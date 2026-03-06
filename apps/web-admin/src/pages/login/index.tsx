/**
 * Admin Login Page
 */

import { useEffect } from 'react';
import { useLogin } from '@refinedev/core';
import { Card, Typography, Alert, Button, Space } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const LoginPage = () => {
  const { mutate: login } = useLogin<{ credential: string }>();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });

      const buttonContainer = document.getElementById('google-signin-button');
      if (buttonContainer) {
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          width: 300,
          text: 'signin_with',
        });
      }
    }
  };

  const handleGoogleCallback = async (response: { credential: string }) => {
    login({ credential: response.credential });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0070F3 0%, #1d4ed8 50%, #0b63e6 100%)',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-50%',
          left: '-50%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          textAlign: 'center',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          border: 'none',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', padding: '8px' }}>
          <div style={{ paddingTop: '8px' }}>
            <div
              style={{
                width: 'clamp(60px, 10vw, 80px)',
                height: 'clamp(60px, 10vw, 80px)',
                margin: '0 auto clamp(16px, 4vw, 24px)',
                background: 'linear-gradient(135deg, #0070F3 0%, #1d4ed8 100%)',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 112, 243, 0.4)',
              }}
            >
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: 'clamp(24px, 6vw, 36px)' }}>M</span>
            </div>
            <Title level={2} style={{ margin: '0 0 8px 0', fontFamily: 'Kanit', fontWeight: 700, fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
              Medical Admin Panel
            </Title>
            <Text type="secondary" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
              ระบบจัดการ Medical Learning Portal
            </Text>
          </div>

          <Alert
            type="warning"
            message="สำหรับผู้ดูแลระบบเท่านั้น"
            description="คุณต้องมีสิทธิ์ Admin เพื่อเข้าใช้งาน"
            showIcon
            style={{
              borderRadius: 12,
              border: '1px solid #ffc53d',
              fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
            }}
          />

          <div
            id="google-signin-button"
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '8px 0',
              borderRadius: 12,
              overflow: 'hidden',
              width: '100%',
            }}
          />
        </Space>
      </Card>
    </div>
  );
};
