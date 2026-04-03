/**
 * UsersPage.tsx
 * Trang Quản Lý Tài Khoản & Phân Quyền - Dành cho Admin
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, UserCheck, UserX, Search, Shield, User, X, CheckCircle2 } from 'lucide-react';
import { MOCK_USERS, MOCK_ZONES, type User as UserType } from '../../data/mockData';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
    );
  };

  const deleteUser = (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tổng tài khoản', value: users.length, color: 'text-gray-700', bg: 'bg-gray-50' },
          { label: 'Admin', value: users.filter((u) => u.role === 'admin').length, color: 'text-purple-700', bg: 'bg-purple-50' },
          { label: 'Đang hoạt động', value: users.filter((u) => u.status === 'active').length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Bị khóa', value: users.filter((u) => u.status === 'inactive').length, color: 'text-red-700', bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
            <p className={s.color} style={{ fontSize: '24px', fontWeight: 700 }}>{s.value}</p>
            <p className="text-gray-500" style={{ fontSize: '12px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tài khoản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-gray-700 outline-none focus:border-emerald-400 w-52"
              style={{ fontSize: '13px' }}
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
            style={{ fontSize: '13px' }}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          style={{ fontSize: '13px', fontWeight: 600 }}>
          <Plus size={16} />
          Thêm tài khoản
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Tài khoản', 'Vai trò', 'Khu vực phụ trách', 'Trạng thái', 'Đăng nhập lần cuối', 'Thao tác'].map((col) => (
                  <th key={col} className="px-5 py-3.5 text-left text-gray-500"
                    style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => {
                const assignedZone = MOCK_ZONES.find((z) => z.id === user.zoneId);
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    {/* User Info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          user.role === 'admin' ? 'bg-purple-100' : 'bg-emerald-100'
                        }`}>
                          <span className={user.role === 'admin' ? 'text-purple-700' : 'text-emerald-700'}
                            style={{ fontSize: '14px', fontWeight: 700 }}>
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-900" style={{ fontSize: '13px', fontWeight: 600 }}>{user.name}</p>
                          <p className="text-gray-400" style={{ fontSize: '12px' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`} style={{ fontSize: '12px', fontWeight: 600 }}>
                        {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                      </span>
                    </td>

                    {/* Zone */}
                    <td className="px-5 py-4">
                      {assignedZone ? (
                        <span className="px-2 py-1 bg-teal-50 text-teal-700 rounded-lg" style={{ fontSize: '12px', fontWeight: 500 }}>
                          {assignedZone.name.split(' - ')[0]}
                        </span>
                      ) : (
                        <span className="text-gray-400" style={{ fontSize: '12px' }}>
                          {user.role === 'admin' ? 'Toàn hệ thống' : 'Chưa phân công'}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                        user.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`} style={{ fontSize: '12px', fontWeight: 600 }}>
                        <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="px-5 py-4">
                      <p className="text-gray-600" style={{ fontSize: '12px' }}>
                        {new Date(user.lastLogin).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-gray-400" style={{ fontSize: '11px' }}>
                        {new Date(user.lastLogin).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === 'active'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Chỉnh sửa">
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-16 text-center">
            <User size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400" style={{ fontSize: '14px' }}>Không tìm thấy tài khoản</p>
          </div>
        )}
      </div>
    </div>
  );
};
