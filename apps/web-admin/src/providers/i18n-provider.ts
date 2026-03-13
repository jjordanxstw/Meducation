import type { I18nProvider } from '@refinedev/core';

type TranslationMap = Record<string, string>;

const translations: Record<string, TranslationMap> = {
  th: {
    'pages.login.title': 'เข้าสู่ระบบผู้ดูแล',
    'pages.login.fields.email': 'Username',
    'pages.login.fields.password': 'Password',
    'pages.login.signin': 'เข้าสู่ระบบ',
    'pages.login.buttons.forgotPassword': 'ลืมรหัสผ่าน?',
    'pages.login.buttons.noAccount': 'ยังไม่มีบัญชีใช่ไหม?',
    'pages.login.register': 'สมัครสมาชิก',
    'pages.login.buttons.rememberMe': 'จดจำฉัน',
  },
};

let currentLocale = 'th';

export const i18nProvider: I18nProvider = {
  translate: (key: string, defaultMessage?: string) => {
    return translations[currentLocale]?.[key] ?? defaultMessage ?? key;
  },
  changeLocale: async (lang: string) => {
    currentLocale = lang;
  },
  getLocale: () => currentLocale,
};
