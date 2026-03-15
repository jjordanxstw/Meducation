import { cookies } from 'next/headers';

export interface ServerSession {
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    profile?: {
      id: string;
      email: string;
      full_name: string;
      role: string;
      year_level: number | null;
      avatar_url: string | null;
      student_id: string | null;
      created_at: string;
      updated_at: string;
    };
  } | null;
  isAuthenticated: boolean;
}

export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = cookies();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Get all cookies and forward them
    const cookieHeader = cookieStore.toString();

    const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();

    if (data?.success && data?.data?.user) {
      return {
        user: data.data.user,
        isAuthenticated: true,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function logoutServer() {
  const cookieStore = cookies();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    await fetch(`${apiUrl}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        cookie: cookieStore.toString(),
      },
    });
  } catch {
    // Ignore errors during logout
  }
}
