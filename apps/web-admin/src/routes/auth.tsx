/**
 * Admin Login Route — light blue/white theme, English only.
 */

import { useState, useEffect } from 'react';
import { useLogin, useIsAuthenticated } from '@refinedev/core';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Spin } from 'antd';
import { BookOutlined, ExclamationCircleFilled } from '@ant-design/icons';

export function LoginPage() {
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
      <div className="flex min-h-screen items-center justify-center bg-[#f4f8ff]">
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
          : 'Invalid username or password';
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#f4f8ff]">
      {/* Left branding panel (desktop only) */}
      <div className="relative hidden w-3/5 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#1d4ed8] to-[#1e40af] md:flex">
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <BookOutlined style={{ fontSize: 64, color: '#ffffff' }} />
          <h1 className="text-3xl font-bold text-white">Meducation Admin</h1>
          <p className="max-w-xs text-sm text-white/80">
            Content management for the medical learning portal
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center p-6 md:w-2/5">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Mobile brand (left panel hidden) */}
          <div className="mb-6 text-center md:text-left">
            <div className="mb-3 flex items-center justify-center gap-2 md:hidden">
              <BookOutlined style={{ fontSize: 28, color: '#1d4ed8' }} />
              <span className="text-lg font-bold text-slate-900">Meducation Admin</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in with your admin account</p>
          </div>

          {error ? (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <ExclamationCircleFilled className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: 'Please enter username' }]}
            >
              <Input size="large" autoComplete="username" placeholder="e.g. admin01" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password size="large" autoComplete="current-password" placeholder="Enter password" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" size="large" block loading={isPending}>
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
