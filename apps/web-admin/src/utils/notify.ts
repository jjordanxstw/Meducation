import { notification } from 'antd';

/**
 * Centralised notification helper for the admin panel. Standardises placement
 * so every toast looks consistent regardless of where it is triggered (form
 * submits, deletes, copy actions, session expiry). Styling follows the active
 * Ant Design (light) theme.
 */
notification.config({ placement: 'bottomRight' });

export const notify = {
  success(message: string, description?: string) {
    notification.success({ message, description });
  },
  error(message: string, description?: string) {
    notification.error({ message, description });
  },
  info(message: string, description?: string) {
    notification.info({ message, description });
  },
  warning(message: string, description?: string) {
    notification.warning({ message, description });
  },
};

export type Notify = typeof notify;
