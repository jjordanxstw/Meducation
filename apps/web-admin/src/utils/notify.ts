import { toast } from 'sonner';

/**
 * Centralised notification helper for the admin panel. Backed by sonner so
 * every toast looks consistent regardless of where it is triggered (form
 * submits, deletes, copy actions, session expiry).
 */
export const notify = {
  success(message: string, description?: string) {
    toast.success(message, { description });
  },
  error(message: string, description?: string) {
    toast.error(message, { description });
  },
  info(message: string, description?: string) {
    toast.info(message, { description });
  },
  warning(message: string, description?: string) {
    toast.warning(message, { description });
  },
};

export type Notify = typeof notify;
