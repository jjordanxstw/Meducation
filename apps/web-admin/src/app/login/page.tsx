'use client';

/**
 * Login Route
 * Uses Refine built-in AuthPage and redirects authenticated users.
 */

import { Authenticated } from '@refinedev/core';
import { NavigateToResource } from '@refinedev/nextjs-router';
import { AdminLoginPage } from '../../components/auth/AdminLoginPage';

export default function LoginPage() {
  return (
    <Authenticated
      key="login-auth"
      fallback={<AdminLoginPage />}
    >
      <NavigateToResource resource="dashboard" />
    </Authenticated>
  );
}
