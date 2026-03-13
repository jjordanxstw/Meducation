'use client';

/**
 * Admin Login Page (Root)
 * Traditional username/password login
 */

import { useState } from 'react';
import { useLogin } from '@refinedev/core';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const { mutateAsync: login, isLoading } = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    try {
      await login({ username, password });
      // If successful, useLogin will redirect automatically
    } catch (err: any) {
      // Handle any errors from login
      const errorMessage = err?.error?.message || err?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      setError(errorMessage);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '40px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 16px',
              backgroundColor: '#0070F3',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '28px',
            }}
          >
            M
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#262626',
              margin: '0 0 8px',
            }}
          >
            Medical Admin
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#8c8c8c',
              margin: '0',
            }}
          >
            ระบบจัดการ Medical Learning Portal
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '4px',
              marginBottom: '24px',
              color: '#ff4d4f',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#262626',
                marginBottom: '8px',
              }}
            >
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้"
              autoComplete="username"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0070F3';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d9d9d9';
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#262626',
                marginBottom: '8px',
              }}
            >
              รหัสผ่าน
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  paddingRight: '40px',
                  fontSize: '14px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0070F3';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d9d9d9';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8c8c8c',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: '#0070F3',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '500',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a
              href="/forgot-password"
              style={{
                fontSize: '14px',
                color: '#0070F3',
                textDecoration: 'none',
              }}
            >
              ลืมรหัสผ่าน?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
