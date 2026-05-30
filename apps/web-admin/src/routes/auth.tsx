/**
 * Login Route Component
 * Migrated from src/app/page.tsx and src/components/auth/AdminLoginPage.tsx
 */

import { useState, useEffect } from 'react';
import { useLogin, useIsAuthenticated, useTranslate } from '@refinedev/core';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Spin, ConfigProvider, theme } from 'antd';
import { BookOutlined, ExclamationCircleFilled } from '@ant-design/icons';

const GRID_PATTERN =
  'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)';

export function LoginPage() {
  const t = useTranslate();
  const { mutateAsync: login, isPending } = useLogin();
  const { data: authData, isLoading: isCheckingAuth } = useIsAuthenticated();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (authData?.authenticated === true) {
      navigate('/dashboard', { replace: true });
    }
  }, [authData, navigate]);

  // Show loading while checking auth status
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b2e]">
        <Spin size="large" />
      </div>
    );
  }

  const onFinish = async (values: { username: string; password: string }) => {
    setError(null);

    try {
      const result = await login({ username: values.username, password: values.password });
      if (result.success) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message?: string }).message)
          : t('pages.login.errors.invalidCredentials', {}, 'Invalid username or password');
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left branding panel (desktop only) */}
      <div
        className="relative hidden w-3/5 flex-col items-center justify-center bg-[#070f1a] md:flex"
        style={{ backgroundImage: GRID_PATTERN, backgroundSize: '40px 40px' }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <BookOutlined style={{ fontSize: 64, color: '#60a5fa' }} />
          <h1 className="text-3xl font-bold text-white">
            {t('pages.login.brand', {}, 'Meducation Admin')}
          </h1>
          <p className="text-sm text-white/40">
            {t('pages.login.subtitle', {}, 'Content management for the medical learning portal')}
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center bg-[#0d1b2e] p-6 md:w-2/5">
        <ConfigProvider
          theme={{
            algorithm: theme.darkAlgorithm,
            token: {
              colorPrimary: '#0070F3',
              borderRadius: 12,
              colorBgContainer: 'rgba(255,255,255,0.06)',
            },
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            {/* Mobile brand (left panel hidden) */}
            <div className="mb-6 text-center md:text-left">
              <div className="mb-3 flex items-center justify-center gap-2 md:hidden">
                <BookOutlined style={{ fontSize: 28, color: '#60a5fa' }} />
                <span className="text-lg font-bold text-white">
                  {t('pages.login.brand', {}, 'Meducation Admin')}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white">
                {t('pages.login.welcome', {}, 'Welcome back')}
              </h2>
              <p className="mt-1 text-sm text-white/40">
                {t('pages.login.signinPrompt', {}, 'Sign in with your admin account')}
              </p>
            </div>

            {error ? (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                <ExclamationCircleFilled className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
              <Form.Item
                label={<span className="text-white/70">{t('pages.login.fields.email', {}, 'Username')}</span>}
                name="username"
                rules={[{ required: true, message: t('pages.login.fields.usernameRequired', {}, 'Please enter username') }]}
              >
                <Input
                  size="large"
                  autoComplete="username"
                  placeholder={t('pages.login.fields.usernamePlaceholder', {}, 'e.g. admin01')}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-white/70">{t('pages.login.fields.password', {}, 'Password')}</span>}
                name="password"
                rules={[{ required: true, message: t('pages.login.fields.passwordRequired', {}, 'Please enter password') }]}
              >
                <Input.Password
                  size="large"
                  autoComplete="current-password"
                  placeholder={t('pages.login.fields.passwordPlaceholder', {}, 'Enter password')}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" size="large" block loading={isPending}>
                  {t('pages.login.signin', {}, 'Sign In')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </ConfigProvider>
      </div>
    </div>
  );
}

export default LoginPage;
