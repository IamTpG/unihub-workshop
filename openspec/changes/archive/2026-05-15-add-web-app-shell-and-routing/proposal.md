## Why

We need to establish the foundational UI architecture for the web application (`apps/web`) to support feature development. Since the system serves different roles with distinct device priorities (Admin on desktop, Students/Staff on mobile web), we need a role-aware routing system and specialized App Shells. This slice matters for the course requirements as it demonstrates a solid understanding of Role-Based Access Control (RBAC) and responsive design strategies in a modern React application.

Non-goals: We will not implement the actual backend authentication endpoints in this change (they should already exist or be handled separately), nor will we build out the full pages inside these shells beyond placeholders.

## What Changes

- **React Router Setup**: Implement `createBrowserRouter` with a `ProtectedRoute` wrapper to handle authentication checks and Role-Based Access Control (RBAC).
- **Zustand AuthStore**: Create a global state store to hold the authenticated user's profile, role (`ADMIN`, `STAFF`, `STUDENT`), and JWT token.
- **2-Step OTP Login Flow**: Build a live Login page that integrates with the backend API using a multi-step OTP verification flow (send OTP, verify OTP), updates the `AuthStore` with real JWT tokens, and dynamically redirects them based on their decoded role.
- **Admin App Shell**: Implement a Desktop-first layout featuring a persistent left sidebar and top header for back-office management.
- **Mobile App Shell**: Implement a Mobile-first layout featuring a bottom navigation bar and mobile header for Students and Staff.

## Capabilities

### New Capabilities
- `ui-routing-and-rbac`: Core routing infrastructure, role-based access control, App Shell layouts, and the 2-step API auth flow.

### Modified Capabilities
- 

## Impact

- Sets the architectural foundation for the `apps/web` application.
- Establishes the network connection layer (Axios client) for API communication.
- Integrates JWT parsing utilities (`jwt-decode`) into global state management.
- Connects frontend authentication to live Node API auth modules.
