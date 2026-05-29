/**
 * Environment variable validation (5.7).
 *
 * Validated once at module load with zod so a missing/!malformed variable fails
 * fast with a descriptive error instead of surfacing as `undefined` deep in the
 * app. Public vars are referenced statically so Next.js can inline them; server
 * vars are only validated on the server so they never leak into the client
 * bundle.
 */
import { z } from 'zod';

const publicSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1, 'NEXT_PUBLIC_GOOGLE_CLIENT_ID is required'),
});

const serverSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  ALLOWED_EMAIL_DOMAINS: z.string().optional(),
});

function format(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
}

const publicParsed = publicSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
});
if (!publicParsed.success) {
  throw new Error(`Invalid public environment configuration — ${format(publicParsed.error)}`);
}

type ServerEnv = z.infer<typeof serverSchema>;
let serverEnv: Partial<ServerEnv> = {};

if (typeof window === 'undefined') {
  const serverParsed = serverSchema.safeParse({
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    ALLOWED_EMAIL_DOMAINS: process.env.ALLOWED_EMAIL_DOMAINS,
  });
  if (!serverParsed.success) {
    throw new Error(`Invalid server environment configuration — ${format(serverParsed.error)}`);
  }
  serverEnv = serverParsed.data;
}

export const env = {
  ...publicParsed.data,
  ...serverEnv,
} as z.infer<typeof publicSchema> & Partial<ServerEnv>;

/** Email domains allowed to sign in (defense-in-depth before backend verify). */
export function allowedEmailDomains(): string[] {
  return (serverEnv.ALLOWED_EMAIL_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}
