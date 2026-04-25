import { Request, Response } from "express";

declare global {
  namespace Express {
    export interface Request {
      // Allow any validated data to be attached
      validated: {
        body?: any;
        params?: any;
        query?: any;
        headers?: any;
      };
    }
    export interface Response {
      ok: (data: any, message?: string) => Response;
      created: (message?: string, data?: any) => Response;
      error: (message?: string, errors?: any[], status?: number) => Response;
      notFound: (message?: string) => Response;
    }
  }
}
