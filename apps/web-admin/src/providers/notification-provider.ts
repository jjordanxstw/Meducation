import { toast } from 'sonner';
import type { NotificationProvider } from '@refinedev/core';

/**
 * Refine notification provider backed by sonner. Preserves the undoable
 * mutation UX: for `type: 'progress'` (e.g. the 5s soft-delete window), the
 * toast shows a live countdown and an "Undo" action wired to Refine's
 * `cancelMutation`. Refine re-calls `open` each second with a decremented
 * `undoableTimeout`; sonner updates the toast in place because we reuse `key`.
 */
export const notificationProvider: NotificationProvider = {
  open: ({ key, message, type, description, undoableTimeout, cancelMutation }) => {
    if (type === 'progress') {
      toast(message, {
        id: key,
        duration: Infinity,
        description:
          typeof undoableTimeout === 'number'
            ? `Reverting in ${undoableTimeout}s…`
            : description,
        action: cancelMutation
          ? {
              label: 'Undo',
              onClick: () => cancelMutation(),
            }
          : undefined,
      });
      return;
    }

    if (type === 'success') {
      toast.success(message, { id: key, description });
    } else if (type === 'error') {
      toast.error(message, { id: key, description });
    } else {
      toast(message, { id: key, description });
    }
  },
  close: (key) => {
    toast.dismiss(key);
  },
};
