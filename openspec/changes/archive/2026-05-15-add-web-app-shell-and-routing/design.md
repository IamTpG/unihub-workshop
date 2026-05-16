## Context

The `apps/web` project is a React application that needs to serve multiple roles: ADMIN (prioritized for desktop laptops), STAFF, and STUDENT (prioritized for mobile web). Currently, the React application is a basic Vite scaffold with no routing or global state management. We need to implement the core UI foundation to support the differing viewport priorities and role-based access control.

## Goals / Non-Goals

**Goals:**
- Establish the routing structure using React Router v6.
- Create distinct, role-based application shells that cater to different viewport priorities (Desktop vs. Mobile).
- Implement global state management for user authentication (AuthStore).
- Configure live HTTP networking client (Axios) connecting to Backend API.
- Implement the live 2-step Passwordless OTP Authentication flow.
- Provide a secure mechanism to redirect unauthorized users.

**Non-Goals:**
- Full implementation of feature pages (e.g., Workshop creation, User management).
- Advanced CSS/Theming implementation (we will just set up the structural layout components).
- Backend authentication API modifications (we consume existing endpoints).

## Decisions

1. **Routing System: React Router v6 (`createBrowserRouter`)**
   - *Rationale*: It's the industry standard for React SPAs, supporting data loaders and nested layouts natively, which aligns perfectly with our App Shell requirement.
2. **Dual App Shell Architecture**
   - *Rationale*: Serving Admins and Students/Staff requires different UX paradigms.
   - `AdminShell`: Optimized for desktop, featuring a persistent left sidebar and top header for dense data displays.
   - `MobileShell` (for Student/Staff): Optimized for mobile web, featuring a bottom navigation bar and mobile header.
3. **State Management: Zustand (`useAuthStore`)**
   - *Rationale*: Zustand is lightweight, requires minimal boilerplate compared to Redux, and is perfect for holding the `user`, `role`, and `token`. Server state will eventually be handled by React Query, so we only need Zustand for client/UI state.
4. **Role-Based Access Control (RBAC): `ProtectedRoute` Component**
   - *Rationale*: A wrapper component around routes that checks the `AuthStore`. If unauthenticated, redirects to `/login`. If unauthorized (e.g., Student trying to access `/admin`), redirects to a fallback route or shows an error.
5. **API Networking Layer: Axios Client (`src/lib/api.ts`)**
   - *Rationale*: Axios offers flexible defaults (baseURL, withCredentials: true) and robust interceptors needed to automatically include credentials and handle 401 token expiry.
6. **Token Processing: `jwt-decode`**
   - *Rationale*: The backend verify-otp endpoint returns an `accessToken` containing user details (ID and Role) in its payload. Decoding the JWT allows immediate role recognition without adding extra profile-fetching calls.

### Sequence Flow: 2-Step OTP Authentication
1. User enters `username` on `/login` (Step 1) and clicks Submit.
2. Frontend executes `POST /api/v1/auth/login { username }`.
3. API triggers background OTP email and returns `{ success: true, message: "..." }`.
4. Frontend transitions Login form to OTP Entry Mode (Step 2).
5. User inputs 6-digit numeric `otp` and clicks Verify.
6. Frontend executes `POST /api/v1/auth/verify-otp { username, otp }`.
7. API validates OTP, sets HttpOnly `refreshToken` cookie, and returns `{ data: { accessToken } }`.
8. Frontend stores the raw token in `AuthStore` and decodes the payload `{ sub, role }` using `jwt-decode` to assign the runtime role.
9. Component reads the decoded `role` and navigates to appropriate path:
   - `ADMIN` -> `/admin`
   - `STAFF` -> `/manage`
   - `STUDENT` -> `/explore`

## Risks / Trade-offs

- **[Risk] Handling expired tokens in Zustand** → *Mitigation*: The `AuthStore` will need an Axios interceptor or similar global error handler that calls `logout()` and redirects to `/login` if a 401 Unauthorized response is received.
- **[Trade-off] Maintaining two separate Shell components** increases initial boilerplate, but the UX benefits of tailored navigation paradigms (Desktop vs. Mobile) heavily outweigh the cost.
