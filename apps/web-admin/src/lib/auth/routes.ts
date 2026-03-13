/**
 * Route Definitions
 * Defines protected and public routes
 */

// Public routes that don't require authentication
export const publicRoutes = [
  '/login',
  '/forgot-password',
];

// Protected routes that require authentication
export const protectedRoutes = [
  '/dashboard',
  '/subjects',
  '/sections',
  '/lectures',
  '/resources',
  '/calendar',
  '/profiles',
  '/audit-logs',
];

// Check if a route is public
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(route));
}

// Check if a route is protected
export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname === route || pathname.startsWith(route));
}
