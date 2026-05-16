export type OfflineCheckInSyncStatus = 'pending' | 'synced' | 'failed';

export interface OfflineCheckInQueueItem {
  id: string;
  qrToken: string;
  workshopId: string;
  workshopTitle: string;
  localTimestamp: string;
  syncStatus: OfflineCheckInSyncStatus;
  failureReason?: string;
  retryCount: number;
}

export const OFFLINE_CHECKIN_QUEUE_KEY = 'unihub:checkin-queue';
export const OFFLINE_CHECKIN_QUEUE_EVENT = 'unihub:checkin-queue-updated';

const canUseStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const notifyQueueChanged = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OFFLINE_CHECKIN_QUEUE_EVENT));
};

const persist = (items: OfflineCheckInQueueItem[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(OFFLINE_CHECKIN_QUEUE_KEY, JSON.stringify(items));
  notifyQueueChanged();
};

export const getAll = (): OfflineCheckInQueueItem[] => {
  if (!canUseStorage()) return [];

  const raw = window.localStorage.getItem(OFFLINE_CHECKIN_QUEUE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      persist([]);
      return [];
    }

    return parsed.filter(isQueueItem);
  } catch {
    persist([]);
    return [];
  }
};

export const enqueue = (item: OfflineCheckInQueueItem) => {
  const items = getAll();
  persist([...items, item]);
};

export const updateItem = (
  id: string,
  partial: Partial<Omit<OfflineCheckInQueueItem, 'id'>>,
) => {
  const items = getAll();
  persist(items.map((item) => (item.id === id ? { ...item, ...partial } : item)));
};

export const removeItem = (id: string) => {
  const items = getAll();
  persist(items.filter((item) => item.id !== id));
};

export const getPendingItems = () =>
  getAll().filter((item) => item.syncStatus === 'pending');

export const createQueueItem = (input: {
  qrToken: string;
  workshopId: string;
  workshopTitle: string;
}): OfflineCheckInQueueItem => ({
  id: createId(),
  qrToken: input.qrToken,
  workshopId: input.workshopId,
  workshopTitle: input.workshopTitle,
  localTimestamp: new Date().toISOString(),
  syncStatus: 'pending',
  retryCount: 0,
});

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isQueueItem(value: unknown): value is OfflineCheckInQueueItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<OfflineCheckInQueueItem>;

  return (
    typeof item.id === 'string' &&
    typeof item.qrToken === 'string' &&
    typeof item.workshopId === 'string' &&
    typeof item.workshopTitle === 'string' &&
    typeof item.localTimestamp === 'string' &&
    (item.syncStatus === 'pending' ||
      item.syncStatus === 'synced' ||
      item.syncStatus === 'failed') &&
    typeof item.retryCount === 'number'
  );
}
