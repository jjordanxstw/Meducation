'use client';

/**
 * Root Auth Entry
 * Render login immediately; authenticated users are redirected by middleware.
 */

import { AdminLoginPage } from '../components/auth/AdminLoginPage';

export default function LoginPage() {
  return <AdminLoginPage />;
}
