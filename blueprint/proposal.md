# UniHub Workshop — Project Proposal

## Problem

University workshop registration today often relies on Google Forms and manual spreadsheets. That approach breaks down at scale:

- **No real seat control** — duplicate submissions and race conditions can oversell capacity.
- **No payment lifecycle** — paid workshops cannot gate confirmation on payment without fragile manual reconciliation.
- **No operational tooling** — staff cannot reliably check in attendees; admins cannot manage workshops, rosters, or registration windows from one system.
- **Poor burst behavior** — when thousands of students open registration at the same time, forms and ad-hoc backends stall or corrupt data.

UniHub Workshop replaces this with a purpose-built platform that supports high-concurrency registration, mock payment integration suitable for demos, staff QR check-in (including offline sync), and admin operations in a single shippable MVP.

## Goals


| Goal                     | Target / success signal                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scale registration**   | Support ~12,000 students with a large share registering in the first 10 minutes without overselling seats                                                     |
| **Fast API path**        | Registration gate returns in < 200 ms via Redis soft reservation + async worker commit                                                                        |
| **End-to-end lifecycle** | Discover workshop → register → pay (mock) → view ticket/QR → staff check-in                                                                                   |
| **Demoability**          | Full flows runnable in browser (responsive web) for student, admin, and staff roles                                                                           |
| **Course deliverables**  | OTP auth, RBAC, CSV student import, resilience (rate limit, idempotency, circuit breaker), notifications, AI PDF summary, offline check-in queue |


## Users and Needs


| Role        | Primary needs                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Student** | Browse published workshops, register workshops, view registrations and QR ticket, receive status notifications and emails |
| **Admin**   | Manage workshops, import student CSV roster, upload PDF for AI summary, view registration stats                           |
| **Staff**   | Scan QR, check in attendees; continue working when connectivity is poor                                                   |


## Scope

### In scope (MVP)

- **Monorepo**: Web app, API server, background worker; shared database and type packages
- **Auth**: OTP login, JWT access token, refresh token rotation, RBAC middleware
- **Workshops**: Published list/detail with caching and live slot counts
- **Registration**: Fast Redis reservation gate, async worker commit, database authoritative seat decrement, idempotency, optional registration window
- **Payments**: Mock payment provider, holding/expired states, payment-timeout jobs
- **Check-in**: QR verify, single check-in, batch sync for offline queue
- **Notifications**: SSE live stream + persisted notification list
- **Student import**: Admin CSV upload + nightly automated cron import → student roster management
- **AI summary**: Admin PDF upload → worker extracts text → summary on workshop
- **Web UI**: Admin desktop shell, student mobile-first shell, staff mobile shell
- **Resilience**: Tiered rate limits, payment circuit breaker, idempotency middleware

### Out of scope (non-goals)

- Real payment gateways (VNPay, Stripe, etc.) — interface only, mock implementation for demo
- Native mobile apps, best-practice databases and workers for OfflineFirst check-in.
- Production-grade multi-region deployment, Kubernetes, or full observability stack
- Email/push notifications beyond OTP and in-app/SSE
- Sending notifications via complex third-party channels like Zalo/Telegram in this phase (though the architecture must be designed to easily accommodate future extensions).
- Refunds, reporting/analytics beyond basic admin stats
- Direct API integration with the legacy student management system

## Risks and Constraints


| Risk                              | Mitigation                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Registration thundering herd      | Redis reservation gate + tiered rate limits + async worker processing             |
| Seat oversell                     | Database atomic decrement; worker compensates Redis on failure                    |
| Double submit / retry storms      | Idempotency middleware (Redis-backed, 24h TTL)                                   |
| Payment gateway hang              | Circuit breaker in worker; seat held with timeout job as fallback                |
| Offline check-in data loss        | Browser-local queue with idempotent batch sync API                               |
| CSV roster drift                  | Students gated on active roster status; import is admin-only                      |
| Small team with minimum resources | Explicit non-goals; no microservices                                              |


