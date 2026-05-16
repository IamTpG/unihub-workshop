import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import {
  OFFLINE_CHECKIN_QUEUE_EVENT,
  type OfflineCheckInQueueItem,
  getAll,
  getPendingItems,
  updateItem,
} from '../lib/offlineQueue';

interface BatchCheckInResponse {
  processedCount: number;
  skippedCount: number;
  syncedIds: string[];
  failedIds: string[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

const BACKOFF_DELAYS = [2000, 4000, 8000];
const MAX_ITEM_RETRIES = 3;

export const useOfflineSync = () => {
  const [items, setItems] = useState<OfflineCheckInQueueItem[]>(() => getAll());
  const [isSyncing, setIsSyncing] = useState(false);
  const timerRef = useRef<number | null>(null);
  const syncingRef = useRef(false);

  const refresh = useCallback(() => {
    setItems(getAll());
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const applyBatchResult = useCallback((pendingItems: OfflineCheckInQueueItem[], result: BatchCheckInResponse) => {
    const syncedIds = new Set(result.syncedIds);
    const failedIds = new Set(result.failedIds);

    pendingItems.forEach((item) => {
      if (syncedIds.has(item.qrToken)) {
        updateItem(item.id, {
          syncStatus: 'synced',
          failureReason: undefined,
        });
        return;
      }

      if (failedIds.has(item.qrToken)) {
        const retryCount = item.retryCount + 1;
        updateItem(item.id, {
          retryCount,
          syncStatus: retryCount >= MAX_ITEM_RETRIES ? 'failed' : 'pending',
          failureReason: retryCount >= MAX_ITEM_RETRIES ? 'Max retries reached' : undefined,
        });
      }
    });
  }, []);

  const syncNow = useCallback(
    async (attempt = 0): Promise<void> => {
      if (syncingRef.current) return;

      const pendingItems = getPendingItems();
      if (pendingItems.length === 0) {
        refresh();
        return;
      }

      syncingRef.current = true;
      setIsSyncing(true);

      try {
        const response = await api.post<ApiEnvelope<BatchCheckInResponse>>('/check-ins/batch', {
          items: pendingItems.map((item) => ({
            registrationId: item.qrToken,
            checkedInAt: item.localTimestamp,
          })),
        });

        applyBatchResult(pendingItems, normalizeBatchResponse(response.data));
        clearRetryTimer();
        refresh();
      } catch {
        if (attempt < BACKOFF_DELAYS.length) {
          const delay = BACKOFF_DELAYS[attempt];
          timerRef.current = window.setTimeout(() => {
            void syncNow(attempt + 1);
          }, delay);
        }
      } finally {
        syncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [applyBatchResult, clearRetryTimer, refresh],
  );

  const retryItem = useCallback(
    (id: string) => {
      updateItem(id, {
        syncStatus: 'pending',
        retryCount: 0,
        failureReason: undefined,
      });
      refresh();
    },
    [refresh],
  );

  useEffect(() => {
    const handleQueueChanged = () => refresh();
    window.addEventListener(OFFLINE_CHECKIN_QUEUE_EVENT, handleQueueChanged);
    window.addEventListener('storage', handleQueueChanged);

    return () => {
      window.removeEventListener(OFFLINE_CHECKIN_QUEUE_EVENT, handleQueueChanged);
      window.removeEventListener('storage', handleQueueChanged);
    };
  }, [refresh]);

  useEffect(() => {
    const handleOnline = () => {
      void syncNow();
    };

    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
      void syncNow();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      clearRetryTimer();
    };
  }, [clearRetryTimer, syncNow]);

  return {
    items,
    pendingCount: items.filter((item) => item.syncStatus === 'pending').length,
    failedCount: items.filter((item) => item.syncStatus === 'failed').length,
    isSyncing,
    refresh,
    retryItem,
    syncNow: () => syncNow(),
  };
};

function normalizeBatchResponse(
  response: ApiEnvelope<BatchCheckInResponse> | BatchCheckInResponse,
): BatchCheckInResponse {
  if (isApiEnvelope(response)) {
    return response.data;
  }

  return response;
}

function isApiEnvelope(
  response: ApiEnvelope<BatchCheckInResponse> | BatchCheckInResponse,
): response is ApiEnvelope<BatchCheckInResponse> {
  return 'data' in response;
}
