/**
 * UsersPage.tsx
 * Quản lý tài khoản & Phân quyền — Admin only.
 * Fully connected to the backend API via userService and zoneService.
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Users, ShieldCheck, UserCheck, UserX, AlertCircle } from 'lucide-react';

import { UserTable }      from '../../components/admin/UserTable';
import { UserFormDialog } from '../../components/admin/UserFormDialog';
import * as userService   from '../../services/userService';
import * as zoneService   from '../../services/zoneService';
import type { UserProfile, Zone, CreateUserDto, UpdateUserDto } from '../../types/user.types';

// ===== STAT CARD =====
const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
  text: string;
}> = ({ label, value, icon, bg, text }) => (
  <div className={`${bg} rounded-2xl p-4 flex items-center gap-4`}>
    <div className={`${text} opacity-80`}>{icon}</div>
    <div>
      <p className={`${text} text-2xl font-bold leading-tight`}>{value}</p>
      <p className="text-gray-500 text-xs mt-0.5">{label}</p>
    </div>
  </div>
);

// ===== PAGE =====
export const UsersPage: React.FC = () => {
  const [users,       setUsers]       = useState<UserProfile[]>([]);
  const [zones,       setZones]       = useState<Zone[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole,  setFilterRole]  = useState('all');
  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [editUser,    setEditUser]    = useState<UserProfile | null>(null);

  // ===== FETCH =====
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, zonesData] = await Promise.all([
        userService.getUsers(),
        zoneService.getZones(),
      ]);
      setUsers(usersData);
      setZones(zonesData);
    } catch (err: any) {
      setError(err.message ?? 'Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ===== HANDLERS =====
  const handleOpenCreate = () => { setEditUser(null); setDialogOpen(true); };
  const handleOpenEdit   = (u: UserProfile) => { setEditUser(u); setDialogOpen(true); };
  const handleClose      = () => { setDialogOpen(false); setEditUser(null); };

  const handleSubmit = async (dto: CreateUserDto | UpdateUserDto) => {
    if (editUser) {
      const updated = await userService.updateUser(editUser.id, dto as UpdateUserDto);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } else {
      const created = await userService.createUser(dto as CreateUserDto);
      setUsers((prev) => [created, ...prev]);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await userService.updateUser(user.id, { status: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản "${user.email}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await userService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  // ===== STATS =====
  const stats = {
    total:    users.length,
    admins:   users.filter((u) => u.role === 'admin').length,
    active:   users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold">Quản lý tài khoản</h1>
          <p className="text-gray-400 text-sm mt-0.5">Tạo, chỉnh sửa và phân quyền người dùng trong hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="refresh-users"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            title="Tải lại"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            id="add-user-btn"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200"
          >
            <Plus size={15} />
            Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="ml-auto text-red-600 text-xs font-medium underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Tổng tài khoản"  value={stats.total}    icon={<Users        size={22} />} bg="bg-slate-50"   text="text-slate-700" />
        <StatCard label="Quản trị viên"   value={stats.admins}   icon={<ShieldCheck  size={22} />} bg="bg-purple-50"  text="text-purple-700" />
        <StatCard label="Đang hoạt động"  value={stats.active}   icon={<UserCheck    size={22} />} bg="bg-emerald-50" text="text-emerald-700" />
        <StatCard label="Bị khóa"         value={stats.inactive} icon={<UserX        size={22} />} bg="bg-red-50"     text="text-red-700" />
      </div>

      {/* User table */}
      <UserTable
        users={users}
        searchQuery={searchQuery}
        filterRole={filterRole}
        onSearchChange={setSearchQuery}
        onRoleChange={setFilterRole}
        onEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Create/Edit dialog */}
      <UserFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editUser={editUser}
        zones={zones}
      />
    </div>
  );
};
