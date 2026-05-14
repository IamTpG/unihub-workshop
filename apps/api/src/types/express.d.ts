import type { Role } from "@unihub/db";

export {};

declare global {
  namespace Express {
    export interface Request {
      validated: {
        body?: unknown;
        params?: unknown;
        query?: unknown;
        headers?: unknown;
      };
      user?: {
        id: string;
        role: Role;
      };
    }
    export interface Response {
      ok: (message?: string, data?: unknown) => Response;
      created: (message?: string, data?: unknown) => Response;
      error: (message?: string, errors?: unknown[], status?: number) => Response; // Changed any[] to unknown[]
      notFound: (message?: string) => Response;
    }
  }
}
