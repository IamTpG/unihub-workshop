# UniHub Worker

The API only adds email jobs to Redis. Actual email delivery happens here.

Run both processes during local development:

```bash
npm run dev:api
npm run dev:worker
```

The worker loads environment variables from `apps/worker/.env` when present, then falls back to `apps/api/.env`.
