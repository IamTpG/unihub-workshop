## 1. Khao sat va chuan bi

- [x] 1.1 Developer A: Liet ke tat ca duong dan hien dang tro den `unihub-backend/`, `src/core`, `prisma/`, va cac script backend bang `rg`.
- [x] 1.2 Developer B: Ghi lai cac lenh hien dang chay duoc cho backend (`dev`, `build`, `lint`, `format`, Prisma seed/generate neu co) de lam baseline verify.
- [x] 1.3 Developer A: Tao nhanh ban do di chuyen file cho backend, Prisma, middleware, config, worker va docs truoc khi sua file.

## 2. Tao workspace layout

- [x] 2.1 Developer A: Tao cac thu muc goc `apps/`, `packages/`, `data/`, `docs/` va giu nguyen `openspec/`.
- [x] 2.2 Developer A: Tao `apps/web/`, `apps/api/`, va `apps/worker/` voi placeholder ro rang cho app chua implement.
- [x] 2.3 Developer B: Tao `packages/db/prisma/`, `packages/shared/src/types/`, `packages/shared/src/constants/`, `packages/shared/src/validation/`, va `packages/config/` voi placeholder can thiet de Git track.

## 3. Di chuyen backend sang apps/api

- [x] 3.1 Developer A: Di chuyen noi dung `unihub-backend/` vao `apps/api/` ma khong thay doi logic runtime.
- [x] 3.2 Developer A: Cap nhat `apps/api/package.json`, `tsconfig.json`, ESLint/Prettier config, `.env.example`, va file bootstrap de phu hop vi tri moi.
- [x] 3.3 Developer B: Cap nhat root `package.json`, npm workspaces, scripts root va lint-staged tu `unihub-backend/...` sang `apps/api/...`.
- [x] 3.4 Developer B: Xoa hoac thay the `unihub-backend/` sau khi xac nhan khong con la active backend path.

## 4. Sap xep API source boundaries

- [x] 4.1 Developer A: Chuyen middleware dung chung tu `apps/api/src/core/middlewares` sang `apps/api/src/middleware` va cap nhat imports.
- [x] 4.2 Developer A: Chuyen config/adapters hien co cho Prisma, Redis, email/JWT vao cac thu muc phu hop trong `apps/api/src/infra`.
- [x] 4.3 Developer A: Tao `apps/api/src/routes/` va dat route composition o day neu app hien tai dang gan route truc tiep trong `app.ts`.
- [x] 4.4 Developer B: Giu `modules/auth` hoat dong theo pattern route/controller/service/repository/schema va cap nhat imports sau khi middleware/infra doi vi tri.
- [x] 4.5 Developer B: Tao thu muc module `users`, `workshops`, `registrations`, `payments`, `checkins`, `notifications`, `student-import`, `ai-summary`, `admin`, va `reporting` khong dang ky endpoint gia.
- [x] 4.6 Developer B: Tao thu muc infra `db`, `redis`, `queue`, `mail`, `payment`, `ai`, `storage`, `auth`, `rate-limit`, `idempotency`, va `circuit-breaker`.

## 5. Di chuyen Prisma va tai lieu

- [x] 5.1 Developer A: Di chuyen Prisma schema va seed sang `packages/db/prisma/` hoac cau hinh explicit de assets database duoc tham chieu tu vi tri nay.
- [x] 5.2 Developer A: Cap nhat `prisma.config.ts`, package Prisma seed config, va moi script lien quan den schema/seed path.
- [x] 5.3 Developer B: Di chuyen hoac cap nhat `ARCHITECTURE.md` vao `docs/` de mo ta layout moi va cach chay API.
- [x] 5.4 Developer B: Cap nhat README/placeholder can thiet de phan biet folder placeholder voi tinh nang da hoan thanh.

## 6. Verification va cleanup

- [x] 6.1 Developer A: Chay API build tu root bang script moi va sua moi loi import/config stale.
- [x] 6.2 Developer A: Chay lint/format cho API neu dependencies san sang trong workspace.
- [x] 6.3 Developer B: Tim lai `rg "unihub-backend|src/core|\\.\\./core"` va cap nhat hoac ghi chu ro cac reference lich su con lai.
- [x] 6.4 Developer B: Kiem tra cay thu muc dap ung spec: root layout, app folders, package folders, API module folders va infra folders.
- [x] 6.5 Developer A: Xac nhan entry point `apps/api/src/server.ts` duoc build tu root script moi.
- [x] 6.6 Developer B: Chay `openspec status --change refactor-project-folder-structure` va xac nhan change van apply-ready.

## 7. Dieu chinh theo target structure moi

- [x] 7.1 Developer A: Tao package `@unihub/db` voi `packages/db/src/index.ts`, chuyen API sang import Prisma singleton tu package nay.
- [x] 7.2 Developer B: Tao package `@unihub/shared` voi `src/types`, `src/constants`, `src/validation`, va dung queue constants/job types tu package nay.
- [x] 7.3 Developer A: Tach BullMQ mail processor sang `apps/worker/src/processors`, `apps/worker/src/queue.ts`, va `apps/worker/src/main.ts`.
- [x] 7.4 Developer B: Xoa folder/metadata khong thuoc target structure: `packages/ui`, `packages/shared/utils`, nested lockfiles, generated/build artifacts.
- [x] 7.5 Developer A: Cap nhat root scripts cho `dev/build/lint` API, worker va `db:generate/db:seed`.
- [x] 7.6 Developer B: Chay verify: `npm run db:generate`, `npm run build:api`, `npm run lint:api`, `npm run build:worker`, structure check va stale-reference search.
