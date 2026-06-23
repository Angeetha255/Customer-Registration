# Session Isolation System — Documentation

## Overview

This document describes the complete session isolation system that prevents cross-session contamination between Admin and Customer authentication.

## Problem Statement

Previously, when Admin and User were logged in simultaneously in different tabs/windows, session data would get mixed:
- Admin pages showed User details
- User pages showed Admin details

## Solution Architecture

### 1. Separate Storage Keys

All authentication data is stored using distinct, non-overlapping localStorage keys:

| Session Type | Token Key | Data Key |
|-------------|-----------|----------|
| Admin | `adminToken` | `adminData` |
| Customer | `userToken` | `userData` |

**Never use generic keys like `token` or `userData` without a prefix.**

### 2. Session Isolation Utilities (`src/utils/sessionIsolation.js`)

All session operations must go through these utilities:

```javascript
import { 
  SESSION_TYPES,
  getToken,
  setSession,
  clearSession,
  getSessionData,
  setSessionData,
  assertValidSessionType
} from '../utils/sessionIsolation.js'
```

#### Key Functions

- **`getToken(type)`** — Safely reads token for specified session type
- **`setSession(type, token, data)`** — Atomically sets both token and data
- **`clearSession(type)`** — Clears ONLY the specified session type
- **`assertValidSessionType(type)`** — Validates session type, throws on invalid input

### 3. Type-Safe Session Access (`src/hooks/useSession.js`)

Use these hooks instead of raw `useAuth()` to enforce explicit session type selection:

```javascript
// For admin-only components
import { useAdminSession } from '../hooks/useSession.js'
const { user, token, isLoggedIn } = useAdminSession()

// For customer-only components
import { useCustomerSession } from '../hooks/useSession.js'
const { user, token, isLoggedIn } = useCustomerSession()

// Generic (requires explicit type)
import { useSession } from '../hooks/useSession.js'
const { user } = useSession('admin')  // or 'customer'
```

### 4. Context Provider Updates (`src/context/AuthContext.jsx`)

The AuthContext now:
- Removes the combined `user` variable that caused mixing
- Exports `getUser(type)` helper for route-aware user selection
- Validates user types on login to catch backend issues
- Uses session isolation utilities for all storage operations
- Provides safeguarded setters that reject wrong user types

### 5. API Request Isolation (`src/services/api.js`)

All API requests use explicit header functions:

```javascript
// Admin endpoints — ALWAYS use admin token
const adminHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken(SESSION_TYPES.ADMIN)}`,
})

// Customer endpoints — ALWAYS use customer token
const userHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken(SESSION_TYPES.CUSTOMER)}`,
})
```

### 6. Protected Route Separation

- **`ProtectedRoute`** — Customer-only routes
- **`AdminRoute`** — Admin-only routes
- Both check the correct user type independently

### 7. Development Safeguards (`src/utils/sessionGuard.js`)

Active only in development mode (`import.meta.env.DEV`):

- **Warns on direct localStorage access** to auth keys
- **Validates user types** to catch mismatches
- **Logs session access patterns** for debugging
- **Detects dual-session state** (valid, but logged)

## Usage Guidelines

### ✅ DO

```javascript
// Use session isolation utilities
import { getToken, setSession, clearSession } from '../utils/sessionIsolation.js'
const token = getToken(SESSION_TYPES.ADMIN)

// Use type-safe hooks
import { useAdminSession } from '../hooks/useSession.js'
const { user } = useAdminSession()

// Use explicit context values
const { adminUser, customerUser, getUser } = useAuth()
const admin = getUser('admin')
const customer = getUser('customer')

// Use correct headers in API calls
import { adminHeaders, userHeaders } from '../services/api.js'
```

### ❌ DON'T

```javascript
// DON'T use localStorage directly for auth data
const token = localStorage.getItem('adminToken')  // ❌ BAD

// DON'T use combined 'user' variable
const { user } = useAuth()  // ❌ BAD — could be admin OR customer

// DON'T assume session type from context
const isAdmin = user?.type === 'admin'  // ❌ BAD — user might be wrong session

// DON'T use generic storage keys
localStorage.setItem('token', token)  // ❌ BAD — no type separation
```

## Migration Guide

### For Existing Components

1. **Replace `useAuth()` destructuring:**
   ```javascript
   // Before
   const { user } = useAuth()
   
   // After
   const { adminUser, customerUser, getUser } = useAuth()
   const user = isAdminRoute ? adminUser : customerUser
   ```

2. **Replace direct localStorage access:**
   ```javascript
   // Before
   const token = localStorage.getItem('adminToken')
   
   // After
   import { getToken, SESSION_TYPES } from '../utils/sessionIsolation.js'
   const token = getToken(SESSION_TYPES.ADMIN)
   ```

3. **Use type-safe hooks for new components:**
   ```javascript
   import { useAdminSession } from '../hooks/useSession.js'
   const { user, isLoggedIn } = useAdminSession()
   ```

## Testing the Fix

### Manual Test Scenario

1. Open Browser Tab A → Login as Admin (`/admin/login`)
2. Open Browser Tab B → Login as Customer (`/login`)
3. Verify in Tab A: Admin dashboard shows admin data
4. Verify in Tab B: Customer dashboard shows customer data
5. Refresh both tabs — sessions should persist correctly
6. Logout from Tab A — Tab B should remain logged in
7. Logout from Tab B — Tab A should remain logged in

### Expected Behavior

- ✅ Admin and Customer sessions are completely independent
- ✅ Both can be logged in simultaneously
- ✅ Logging out one doesn't affect the other
- ✅ Page refreshes preserve both sessions
- ✅ API requests use correct tokens for each session type

## Troubleshooting

### Console Warnings

If you see `[SessionGuard]` warnings in development:
1. Review the component mentioned in the warning
2. Ensure it's using the correct session type
3. Check for direct localStorage access to auth keys
4. Verify user type matches expected type

### Debug Information

In development mode, you can access session debug info:

```javascript
import { getSessionDebugInfo } from '../utils/sessionIsolation.js'
console.log(getSessionDebugInfo())
// Output:
// {
//   activeSessions: { admin: true, customer: true },
//   adminDataPresent: true,
//   customerDataPresent: true,
//   adminTokenPresent: true,
//   customerTokenPresent: true
// }
```

## Backend Considerations

The backend already supports session isolation via:
- **JWT tokens with `type` field** (`admin` or `customer`)
- **Separate login endpoints** (`/auth/login` vs `/auth/admin/login`)
- **Type-aware middleware** (`authMiddleware` checks `payload.type`)

No backend changes are required — the fix is entirely on the frontend.

## Future Safeguards

To prevent regression:

1. **Code Review Checklist:**
   - [ ] All auth localStorage access uses `sessionIsolation.js` utilities
   - [ ] Components use `useSession()` hooks with explicit type
   - [ ] API calls use `adminHeaders()` or `userHeaders()` explicitly
   - [ ] No combined `user` variable from `useAuth()`

2. **ESLint Rule (Recommended):**
   Consider adding a custom ESLint rule to flag:
   - Direct `localStorage.getItem('adminToken')` usage
   - Destructuring `user` from `useAuth()`
   - Generic `localStorage.setItem('token', ...)` calls

3. **TypeScript Migration (Future):**
   When migrating to TypeScript, use:
   ```typescript
   type SessionType = 'admin' | 'customer'
   function useSession(type: SessionType): SessionHookReturn
   ```

## Summary

This session isolation system ensures:
- ✅ **Complete separation** of Admin and Customer sessions
- ✅ **No cross-contamination** possible through proper architecture
- ✅ **Type-safe access** via hooks and utilities
- ✅ **Development safeguards** to catch issues early
- ✅ **Permanent fix** with clear guidelines to prevent regression