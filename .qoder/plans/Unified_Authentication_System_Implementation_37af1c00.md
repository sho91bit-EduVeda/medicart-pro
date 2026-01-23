# Unified Authentication System Implementation Plan

## Overview
The current system has separate authentication paths for customers and owners. We'll implement a unified system with a single login entry point that determines user roles and redirects appropriately.

## Phase 1: Backend Preparation
1. Create a unified user schema in Firestore that stores both customer and owner accounts with a `role` field
2. Ensure the existing customer and owner collections can coexist or migrate to a single users collection
3. Update the authentication hooks to support role-based logic

## Phase 2: Component Creation
1. Create a unified `UnifiedAuth` component that combines login/signup functionality
2. Implement role detection and appropriate redirects after authentication
3. Update the existing `useAuth` and `useCustomerAuth` hooks to work with the unified system

## Phase 3: Frontend Integration
1. Add the missing `/auth` route to `App.tsx`
2. Replace separate login buttons with a single "Login / Sign Up" button
3. Update route protection to use role-based access control

## Detailed Implementation Steps

### 1. Create Unified Auth Component
- Create `src/components/common/UnifiedAuth.tsx`
- Include tabs for login/signup
- Include role-based redirection after authentication
- Handle both customer and owner authentication flows

### 2. Update Authentication Hooks
- Modify `useAuth.ts` to detect user roles from Firestore
- Update `useCustomerAuth.ts` to work with the unified system
- Implement role-based state management

### 3. Create Role-Based Redirect Logic
- After successful login, check user role from Firestore
- Redirect customers to catalog/home pages
- Redirect owners to dashboard

### 4. Update Route Protection
- Update route guards to check user roles
- Ensure owners can't access customer-only routes and vice versa
- Maintain existing dashboard protection

### 5. Schema Changes
The unified user document structure will be:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'OWNER';
  created_at: string;
  updated_at: string;
  // Additional fields based on role
}
```

### 6. Migration Strategy
- Keep existing customer and owner documents during migration
- Update authentication logic to check both collections initially
- Eventually migrate to a unified users collection

This approach maintains backward compatibility while implementing the unified authentication system.