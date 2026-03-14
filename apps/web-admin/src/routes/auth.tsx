/**
 * Login Route Component
 * Migrated from src/app/page.tsx and src/components/auth/AdminLoginPage.tsx
 */

import { useState, useEffect } from 'react';
import { useLogin, useIsAuthenticated } from '@refinedev/core';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, Typography, Alert, Spin } from 'antd';

const { Title, Text } = Typography;

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f5f8ff',
        }}
      >
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
          : 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      setError(message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f8ff',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <Title level={4} style={{ marginBottom: 8 }}>
            Medical Admin
          </Title>
          <Text type="secondary">เข้าสู่ระบบด้วยรหัสผู้ใช้ของผู้ดูแล</Text>
        </div>

        {error ? <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} /> : null}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'กรุณากรอกรหัสผู้ใช้' }]}
          >
            <Input size="large" autoComplete="username" placeholder="เช่น admin01" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
          >
            <Input.Password size="large" autoComplete="current-password" placeholder="กรอกรหัสผ่าน" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" block loading={isPending}>
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default LoginPage;
