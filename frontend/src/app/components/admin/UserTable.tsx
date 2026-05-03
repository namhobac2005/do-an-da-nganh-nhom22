/**
 * UserTable.tsx
 * Displays the list of users with search, role filter, status toggle, edit & delete actions.
 */

import { Search, Shield, User, UserX, UserCheck, Pencil, Trash2 } from 'lucide-react';
import type { UserProfile, UserRole } from '../../types/user.types';

interface UserTableProps {
  users:          UserProfile[];
  searchQuery:    string;
  filterRole:     string;
  onSearchChange: (v: string) => void;
  onRoleChange:   (v: string) => void;
  onEdit:         (user: UserProfile) => void;
  onToggleStatus: (user: UserProfile) => void;
  onDelete:       (user: UserProfile) => void;
  isLoading:      boolean;
}

const roleBadge = (role: UserRole) =>
  role === 'admin'
    ? 'bg-purple-100 text-purple-700'
    : 'bg-slate-100 text-slate-600';

const statusBadge = (status: string) =>
  status === 'active'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-red-100 text-red-600';

export const UserTable: React.FC<UserTableProps> = ({
  users,
  searchQuery,
  filterRole,
  onSearchChange,
  onRoleChange,
  onEdit,
  onToggleStatus,
  onDelete,
  isLoading,
}) => {
  const filtered = users.filter((u) => {
    const matchSearch =
      (u.full_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="user-search"
              type="text"
              placeholder="Tìm tài khoản..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-gray-700 text-sm outline-none focus:border-emerald-400 w-52 transition-colors"
            />
          </div>

          {/* Role filter */}
          <select
            id="user-role-filter"
            value={filterRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm outline-none focus:border-emerald-400 transition-colors"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <p className="text-gray-400 text-xs">
          {filtered.length} / {users.length} tài khoản
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100">
              {['Tài khoản', 'Vai trò', 'Khu vực phụ trách', 'Trạng thái', 'Thao tác'].map((col) => (
                <th
                  key={col}
                  className="px-5 py-3.5 text-left text-gray-500 text-xs font-semibold uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              /* Skeleton rows */
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400 text-sm">
                  <User size={28} className="mx-auto mb-2 text-gray-200" />
                  Không tìm thấy tài khoản nào
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                  {/* User info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {(user.full_name ?? user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-900 text-sm font-semibold leading-tight">
                          {user.full_name ?? '—'}
                        </p>
                        <p className="text-gray-400 text-xs">{user.email}</p>
                        {user.phone && (
                          <p className="text-gray-400 text-xs">{user.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Role badge */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${roleBadge(user.role)}`}
                    >
                      {user.role === 'admin' ? <Shield size={11} /> : <User size={11} />}
                      {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                  </td>

                  {/* Zones */}
                  <td className="px-5 py-4">
                    {user.zones.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.zones.map((z) => (
                          <span
                            key={z.id}
                            className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md text-xs font-medium"
                          >
                            {z.name.split(' - ')[0]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        {user.role === 'admin' ? 'Toàn hệ thống' : 'Chưa phân công'}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(user.status)}`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      {user.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        id={`toggle-status-${user.id}`}
                        onClick={() => onToggleStatus(user)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === 'active'
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                      >
                        {user.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>

                      <button
                        id={`edit-user-${user.id}`}
                        onClick={() => onEdit(user)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        id={`delete-user-${user.id}`}
                        onClick={() => onDelete(user)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
