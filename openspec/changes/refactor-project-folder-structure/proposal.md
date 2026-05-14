## Why

Cau truc hien tai dat backend trong `unihub-backend/`, trong khi yeu cau khoa hoc va huong phat trien san pham can mot workspace ro rang cho web, API, worker, package dung chung, tai lieu va du lieu. Thay doi nay giup nhom 2 nguoi tach bien module, de demo, de them tinh nang tiep theo va tranh de code ha tang lan vao logic nghiep vu.

## What Changes

- **BREAKING**: Chuyen cau truc thu muc goc sang workspace moi voi `apps/`, `packages/`, `data/`, `docs/`, va giu `openspec/`.
- **BREAKING**: Di chuyen backend hien co tu `unihub-backend/` sang `apps/api/` va cap nhat script, cau hinh TypeScript, lint, Prisma, import path va tai lieu lien quan.
- Tao cau truc thu muc cho `apps/web/`, `apps/worker/`, `packages/db/`, `packages/shared/`, va `packages/config/` de san sang cho cac phase sau.
- Bien `packages/db` thanh package `@unihub/db` voi `prisma/schema.prisma` va `src/index.ts` export Prisma singleton.
- Bien `packages/shared` thanh package `@unihub/shared` voi `src/types`, `src/constants`, va `src/validation`.
- Chuan hoa `apps/api/src/` thanh cac vung `modules/`, `infra/`, `middleware/`, va `routes/`.
- Tao san cac module API du kien: `auth`, `users`, `workshops`, `registrations`, `payments`, `checkins`, `notifications`, `student-import`, `ai-summary`, `admin`, va `reporting`.
- Tao san cac adapter ha tang API du kien: `db`, `redis`, `queue`, `mail`, `payment`, `ai`, `storage`, `auth`, `rate-limit`, `idempotency`, va `circuit-breaker`.
- Tach worker BullMQ sang `apps/worker/src/processors`, `apps/worker/src/queue.ts`, va `apps/worker/src/main.ts`.
- Cap nhat cong cu phat trien de lenh build/dev/lint/format, worker va db generate/seed van chay sau khi doi thu muc.

Non-goals:

- Khong xay moi frontend, worker xu ly nen, hay domain feature chua co trong scope.
- Khong thay doi hanh vi API dang co tru khi can thiet do import path va bootstrap du an.
- Khong doi schema database, co che dang nhap, RBAC, hay contract API hien co.
- Khong them he thong monorepo phuc tap neu script npm hien tai du cho MVP.

## Capabilities

### New Capabilities

- `project-structure`: Dinh nghia cau truc workspace, vi tri app/package, bien module API va quy tac di chuyen backend hien co sang `apps/api`.

### Modified Capabilities

Khong co. Cac capability hien co nhu `jwt-session`, `otp-login`, va `rbac-middleware` chi bi anh huong boi vi tri file/import path, khong thay doi requirement hanh vi.

## Impact

- Affected code: root `package.json`, lint-staged config, API package files, worker package files, TypeScript/ESLint/Prettier config, Prisma schema/seed, Express app bootstrap, middleware, module imports, worker entry points, and docs.
- Affected systems: local development commands, production build/start commands, Prisma generate/migrate/seed paths, and any tooling that currently references `unihub-backend/`.
- Dependencies: no new runtime dependency is required for the structural refactor; package manager/workspace config may be adjusted if needed to keep commands simple.
- Course/demo value: the repository will visibly match the requested architecture and make upcoming MVP slices easier to assign, review, and present.
