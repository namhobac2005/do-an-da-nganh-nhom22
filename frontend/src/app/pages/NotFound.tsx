/**
 * NotFound.tsx
 * Trang 404 - Không tìm thấy trang
 */

import { useNavigate } from 'react-router';
import { Home, Fish, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Fish size={36} className="text-teal-600" />
        </div>
        <h1 className="text-gray-900 mb-2" style={{ fontSize: '48px', fontWeight: 800 }}>404</h1>
        <p className="text-gray-600 mb-6" style={{ fontSize: '16px' }}>
          Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            style={{ fontWeight: 600 }}
          >
            <Home size={16} />
            Về Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
