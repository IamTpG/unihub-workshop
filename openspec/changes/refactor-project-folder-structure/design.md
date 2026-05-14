## Context

Repository hien tai gom root package dung cho Husky/lint-staged va mot backend Express/TypeScript nam trong `unihub-backend/`. Backend da co module `auth`, Prisma schema/seed, config Redis/Prisma, middleware dung chung, worker email va tai lieu kien truc cu.

Thay doi nay chuyen repo sang layout monorepo nhe:

```text
unihub-workshop/
  apps/
    web/
    api/
    worker/
      src/
        processors/
        queue.ts
        main.ts
  packages/
    db/prisma/
    db/src/index.ts
    shared/src/types/
    shared/src/constants/
    shared/src/validation/
    config/
  data/
  docs/
  openspec/
```

Trong `apps/api/src/`, code API duoc sap thanh `modules/`, `infra/`, `middleware/`, va `routes/`. Muc tieu la giu hanh vi backend hien co, nhung lam ro bien domain va ha tang de cac slice workshop, dang ky, thanh toan, check-in, notification, import sinh vien, AI summary, admin va reporting co cho dung ngay tu dau.

## Goals / Non-Goals

**Goals:**

- Di chuyen backend dang chay sang `apps/api/` ma van build/dev/lint duoc.
- Dua Prisma vao `packages/db` va export Prisma singleton qua package `@unihub/db`.
- Dua hang so/type dung chung vao package `@unihub/shared`.
- Tach worker BullMQ sang `apps/worker` de API chi enqueue job.
- Tao cay thu muc dung nhu yeu cau cho `apps`, `packages`, `data`, `docs`, va `openspec`.
- Chuan hoa API source layout theo domain module va adapter ha tang.
- Cap nhat script root va package de nhom co the chay lenh tu root trong demo.
- Giu stable API contracts, session/auth behavior va schema database hien co.

**Non-Goals:**

- Khong implement cac tinh nang domain moi ngoai placeholder thu muc/module.
- Khong tach API thanh microservice.
- Khong them NX/Turborepo neu npm workspaces va script don gian da dap ung.
- Khong refactor sau business logic cua `auth` ngoai cac import path bat buoc.
- Khong doi database schema hay migration trong thay doi nay.

## Decisions

### Decision 1: Dung npm workspaces nhe

Root `package.json` se khai bao workspaces cho `apps/*` va `packages/*`, dong thoi cung cap script `dev:api`, `build:api`, `lint:api`, va `format:api`. Lua chon nay phu hop timeline 4 buoi toi va khong bat nhom hoc them tool moi.

Alternative considered: them Turborepo/NX. Cach nay tot cho repo lon hon, nhung tang cau hinh va rui ro demo trong khi hien tai chi can API chay on dinh.

### Decision 2: Di chuyen backend sang `apps/api` truoc, tach worker rieng

Toan bo noi dung backend hien co se duoc preserve trong `apps/api/`, sau do sua duong dan Prisma, script va import. Worker BullMQ duoc tach sang `apps/worker`, con `apps/web` va `packages/config` duoc giu placeholder.

Alternative considered: tao lai app API tu dau theo layout moi. Cach nay de dep cay thu muc hon nhung rui ro lam hong auth/session hien co.

### Decision 3: Tach `infra` khoi `modules`, dua DB vao package rieng

`apps/api/src/modules/*` chi chua logic domain. Redis, queue producer, mail enqueue, payment, AI, storage, auth helper, rate-limit, idempotency va circuit-breaker nam trong `apps/api/src/infra/*`. Prisma singleton nam trong `packages/db/src/index.ts` va duoc import bang `@unihub/db`. Middleware Express dung chung nam trong `apps/api/src/middleware`, route composition nam trong `apps/api/src/routes`.

Alternative considered: giu `core/` nhu hien tai. `core/` ngan gon cho backend nho, nhung yeu cau moi da chi ro cac vung `infra`, `middleware`, `routes`; tach ro se de mo rong cac module sap toi.

### Decision 4: Giu API module pattern hien co

Module nhu `auth` tiep tuc dung pattern route/controller/service/repository/schema. Cac module moi duoc tao thu muc, nhung khong them endpoint gia neu chua co spec nghiep vu.

Alternative considered: tao day du skeleton file cho moi module. Cach nay lam cay code lon nhanh va tao file rong kho bao tri; voi MVP, thu muc placeholder la du.

## Risks / Trade-offs

- [Risk] Script hoac import path con tro den `unihub-backend/` cu -> Mitigation: tim bang `rg "unihub-backend|\\.\\./core|src/core|prisma/"`, cap nhat va chay build/lint.
- [Risk] Prisma khong tim thay schema/seed sau khi di chuyen -> Mitigation: cap nhat `prisma.config.ts`, package `prisma.seed`, va cac script lien quan; verify bang build hoac prisma command neu co the.
- [Risk] Worker email bi lech queue name voi API enqueue -> Mitigation: dat queue name va job payload trong `@unihub/shared`.
- [Risk] Placeholder qua nhieu lam tuong nham da co tinh nang -> Mitigation: dung `.gitkeep` hoac README ngan, khong tao endpoint/service gia.
- [Risk] Doi cau truc anh huong lint-staged/Husky -> Mitigation: cap nhat pattern tu `unihub-backend/src/**/*.ts` sang `apps/api/src/**/*.ts`.
- [Risk] Rollback can khoi phuc nhieu duong dan -> Mitigation: moi buoc di chuyen phai giu commit atomic; rollback bang revert change neu build khong dat.

## Migration Plan

1. Tao cay `apps`, `packages`, `data`, `docs` va cac thu muc con theo yeu cau.
2. Di chuyen `unihub-backend/*` vao `apps/api/`.
3. Di chuyen Prisma schema/seed sang `packages/db/prisma/`, tao `packages/db/src/index.ts`, va cap nhat API import sang `@unihub/db`.
4. Tao `packages/shared/src/types`, `packages/shared/src/constants`, `packages/shared/src/validation` va dung `@unihub/shared` cho queue name/job type.
5. Tach worker mail sang `apps/worker/src/processors/mail.processor.ts`, `apps/worker/src/queue.ts`, va `apps/worker/src/main.ts`.
6. Sap xep `apps/api/src`: `core/middlewares` -> `middleware`, config/adapter -> `infra`, route composition -> `routes`, giu `modules/auth` va tao cac module folder con lai.
7. Cap nhat script root, package API/worker/db/shared, lint-staged, TypeScript, ESLint va docs.
8. Chay verification: `npm run db:generate`, `npm run build:api`, `npm run lint:api`, `npm run build:worker`, va kiem tra `openspec status`.
9. Neu build that bai do duong dan, uu tien sua import/config thay vi thay doi hanh vi code.

Fallback behavior:

- Neu monorepo workspace script gap van de, giu script root tro truc tiep vao `apps/api` bang `npm --prefix apps/api ...` de demo van chay.
- Neu Prisma schema path moi gay loi generate/build, them cau hinh explicit thay vi dua vao default path.
- Neu mot module placeholder khong duoc Git track vi rong, dat `.gitkeep` de giu dung cau truc.

## Open Questions

- Co can doi ten package backend tu `unihub-backend` sang `@unihub/api` trong cung thay doi nay khong, hay giu ten hien co de giam rui ro?
- Prisma client generated output se giu mac dinh trong `node_modules/@prisma/client` hay dat output rieng cho `packages/db` trong phase sau?
