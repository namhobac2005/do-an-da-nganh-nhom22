/**
 * Login.tsx
 * Trang đăng nhập hệ thống
 * Sử dụng AuthContext để xử lý xác thực
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Eye, EyeOff, Fish, Lock, Mail, AlertCircle, Wifi } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, isAuthenticated, clearError } = useAuth();

  const [email, setEmail] = useState('admin@aquaculture.vn');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  // Nếu đã đăng nhập, redirect về dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const from =
        (location.state as { from?: { pathname: string } })?.from?.pathname ||
        '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await login(email.trim(), password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A3622] via-[#0d5c35] to-[#1a8a50] flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl" />
        {/* Water wave effect */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-teal-900/30 to-transparent" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#0A3622] to-emerald-700 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Fish size={32} className="text-[#0A3622]" />
            </div>
            <h1
              className="text-white"
              style={{ fontSize: '22px', fontWeight: 700 }}
            >
              AquaSmart
            </h1>
            <p className="text-emerald-200 mt-1" style={{ fontSize: '13px' }}>
              Hệ thống quản lý ao nuôi thủy sản thông minh
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <h2
              className="text-gray-900 mb-6"
              style={{ fontSize: '20px', fontWeight: 600 }}
            >
              Đăng nhập
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle
                    size={16}
                    className="text-red-500 mt-0.5 shrink-0"
                  />
                  <p className="text-red-700" style={{ fontSize: '13px' }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label
                  className="block text-gray-700 mb-1.5"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@aquasmart.vn"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    style={{ fontSize: '14px' }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  className="block text-gray-700 mb-1.5"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    style={{ fontSize: '14px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-emerald-600 hover:underline"
                  style={{ fontSize: '13px' }}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg py-3 transition-colors flex items-center justify-center gap-2"
                style={{ fontWeight: 600 }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p
                className="text-blue-800 mb-2"
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                🔑 Tài khoản demo:
              </p>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setEmail('admin@aquasmart.vn');
                    setPassword('Admin@123');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-blue-100 transition-colors"
                >
                  <p className="text-blue-700" style={{ fontSize: '12px' }}>
                    👑 <strong>Admin:</strong> admin@aquasmart.vn / Admin@123
                  </p>
                </button>
                <button
                  onClick={() => {
                    setEmail('mai.tran@aquasmart.vn');
                    setPassword('User@123');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 border border-blue-100 transition-colors"
                >
                  <p className="text-blue-700" style={{ fontSize: '12px' }}>
                    👤 <strong>User:</strong> mai.tran@aquasmart.vn / User@123
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-emerald-200/70">
          <Wifi size={14} />
          <p style={{ fontSize: '12px' }}>
            Kết nối IoT qua Adafruit IO • v2.0.0
          </p>
        </div>
      </div>
    </div>
  );
};
