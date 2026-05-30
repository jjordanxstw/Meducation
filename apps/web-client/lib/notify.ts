import { toast } from 'sonner';

/**
 * Thin wrapper around sonner's `toast` API that gives the app a small,
 * intentional surface for user-facing notifications. Use this instead of
 * `alert()` or `console.log` for anything the user should see.
 *
 * The visual styling (dark surface, soft border, success/error accent) is
 * configured once on the `<Toaster />` in the root layout.
 */
export const notify = {
  success(message: string) {
    return toast.success(message);
  },
  error(message: string) {
    return toast.error(message);
  },
  info(message: string) {
    return toast(message);
  },
  /** Returns the toast id so it can be dismissed once the work resolves. */
  loading(message: string) {
    return toast.loading(message);
  },
  dismiss(id?: string | number) {
    return toast.dismiss(id);
  },
};

export type Notify = typeof notify;
