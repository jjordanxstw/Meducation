import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    idToken?: string;
    backendTokenExpiry?: number;
    user?: DefaultSession['user'] & {
      id?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    idToken?: string;
    backendTokenExpiry?: number;
  }
}
