## 1. Setup & Dependencies

- [x] 1.1 Install `react-router-dom` and `zustand` dependencies in `apps/web`
- [x] 1.2 Scaffold folder structure (`src/components/layout`, `src/pages`, `src/router`, `src/stores`)

## 2. State Management

- [x] 2.1 Implement `src/stores/authStore.ts` using Zustand
- [x] 2.2 Add `login(user, token)` and `logout()` actions to the AuthStore

## 3. UI Layout Shells

- [x] 3.1 Implement `AdminShell` component (Desktop-first: Sidebar, Top Header, main `<Outlet />`)
- [x] 3.2 Implement `MobileShell` component (Mobile-first: Bottom Navigation, Mobile Header, main `<Outlet />`)
- [x] 3.3 Create placeholder pages for `/admin/dashboard` and `/` (Home)

## 4. Routing & RBAC Infrastructure

- [x] 4.1 Implement `ProtectedRoute` component that checks `AuthStore` for token and allowed roles
- [x] 4.2 Define the route tree in `src/router/index.tsx` using `createBrowserRouter`
- [x] 4.3 Configure fallback routes for unauthorized access (e.g. redirect to `/login` or `/`)
- [x] 4.4 Update `src/main.tsx` to provide the Router to the React app

## 5. Login Page & Integration

- [x] 5.1 Implement a basic Login form component in `src/pages/public/Login`
- [x] 5.2 Wire Login form to `AuthStore.login()` with mock data (or actual API if available)
- [x] 5.3 Implement dynamic role-based redirect in the Login component after successful authentication

## 6. Live API Connectivity

- [x] 6.1 Install `axios` and `jwt-decode` dependencies in `apps/web`
- [x] 6.2 Create `src/lib/api.ts` to configure Axios instance with standard base URL and credentials
- [x] 6.3 Enhance `AuthStore` to support raw token ingestion and extract active role via `jwt-decode`
- [x] 6.4 Refactor `Login.tsx` UI into a 2-step state machine (Step 1: Username / Step 2: OTP)
- [x] 6.5 Integrate live Axios operations for trigger (`/auth/login`) and validation (`/auth/verify-otp`)
- [x] 6.6 Wire decoded JWT metadata directly to client-side RBAC routing flow
