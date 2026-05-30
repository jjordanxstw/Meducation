import type { CSSProperties } from 'react';
import { notification } from 'antd';

/**
 * Centralised notification helper for the admin panel. Standardises placement
 * and the dark surface styling so every toast looks consistent regardless of
 * where it is triggered (form submits, deletes, copy actions, session expiry).
 */
notification.config({ placement: 'bottomRight' });

const baseStyle: CSSProperties = {
  background: '#0d1b2e',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: 'rgba(255,255,255,0.9)',
};

export const notify = {
  success(message: string, description?: string) {
    notification.success({ message, description, style: baseStyle });
  },
  error(message: string, description?: string) {
    notification.error({ message, description, style: baseStyle });
  },
  info(message: string, description?: string) {
    notification.info({ message, description, style: baseStyle });
  },
  warning(message: string, description?: string) {
    notification.warning({ message, description, style: baseStyle });
  },
};

export type Notify = typeof notify;
