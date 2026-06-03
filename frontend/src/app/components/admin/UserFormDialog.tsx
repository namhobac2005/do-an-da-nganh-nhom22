/**
 * UserFormDialog.tsx
 * Radix UI Dialog-based form to Create or Edit a user.
 * Supports username, email, password (create only), phone, role, and multi-pond assignment.
 * Uses real zone/pond data from the API — no mock data.
 */

import { useEffect, useReducer, useCallback, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Eye, EyeOff, MapPin, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import type { UserProfile, CreateUserDto, UpdateUserDto } from '../../types/user.types';
import * as zoneService from '../../services/zoneService';

// ===== FORM STATE =====

interface FormState {
  username:     string;
  email:        string;
  password:     string;
  phone:        string;
  role:         'admin' | 'user';
  pondIds:      string[];
  showPwd:      boolean;
  isSubmitting: boolean;
  error:        string | null;
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormState; value: any }
  | { type: 'TOGGLE_POND'; pondId: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_END'; error?: string }
  | { type: 'RESET'; user?: UserProfile };

const initialState = (user?: UserProfile): FormState => ({
  username:     user?.username ?? '',
  email:        user?.email     ?? '',
  password:     '',
  phone:        user?.phone     ?? '',
  role:         user?.role      ?? 'user',
  pondIds:      user?.ponds.map((p) => p.id) ?? [],
  showPwd:      false,
  isSubmitting: false,
  error:        null,
});

const reducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':    return { ...state, [action.field]: action.value };
    case 'TOGGLE_POND':
      return {
        ...state,
        pondIds: state.pondIds.includes(action.pondId)
          ? state.pondIds.filter((id) => id !== action.pondId)
          : [...state.pondIds, action.pondId],
      };
    case 'SUBMIT_START': return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_END':   return { ...state, isSubmitting: false, error: action.error ?? null };
    case 'RESET':        return initialState(action.user);
    default:             return state;
  }
};

// ===== COMPONENT =====

interface UserFormDialogProps {
  open:      boolean;
  onClose:   () => void;
  onSubmit:  (dto: CreateUserDto | UpdateUserDto) => Promise<void>;
  editUser?: UserProfile | null;
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editUser,
}) => {
  const isEdit = !!editUser;
  const [state, dispatch] = useReducer(reducer, initialState(editUser ?? undefined));

  // Real ponds fetched from API, grouped by zone
  const [pondsByZone, setPondsByZone] = useState<{ zone: { id: string; name: string }; ponds: { id: string; name: string; farming_type: string | null }[] }[]>([]);
  const [pondsLoading, setPondsLoading] = useState(false);
  const [pondOwners, setPondOwners] = useState<Record<string, string>>({});

  // Fetch zones then ponds for each zone, plus current owners
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPondsLoading(true);

    const fetchAll = async () => {
      try {
        const zones = await zoneService.getZones();
        if (cancelled) return;
        const results = await Promise.all(
          (zones || []).map(async (z: any) => {
            try {
              const ponds = await zoneService.getPondsByZone(z.id);
              return { zone: { id: z.id, name: z.name }, ponds: ponds || [] };
            } catch {
              return { zone: { id: z.id, name: z.name }, ponds: [] };
            }
          })
        );
        if (!cancelled) setPondsByZone(results.filter((r) => r.ponds.length > 0));

        // Fetch all users to build a pond → owner map
        try {
          const usersRes = await fetch('http://localhost:5000/admin/users', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json',
            },
          });
          if (usersRes.ok) {
            const usersBody = await usersRes.json();
            const users = usersBody.data || usersBody || [];
            const ownerMap: Record<string, string> = {};
            for (const u of users) {
              if (u.ponds && Array.isArray(u.ponds)) {
                for (const p of u.ponds) {
                  ownerMap[p.id] = u.username || u.email || 'Người dùng';
                }
              }
            }
            if (!cancelled) setPondOwners(ownerMap);
          }
        } catch {
          // ignore — owner display is optional
        }
      } catch {
        if (!cancelled) setPondsByZone([]);
      } finally {
        if (!cancelled) setPondsLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [open]);

  // Reset form when dialog opens/closes or editUser changes
  useEffect(() => {
    dispatch({ type: 'RESET', user: editUser ?? undefined });
  }, [open, editUser]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!state.email.trim()) {
        dispatch({ type: 'SUBMIT_END', error: 'Email là bắt buộc.' });
        return;
      }
      if (!isEdit && !state.password.trim()) {
        dispatch({ type: 'SUBMIT_END', error: 'Mật khẩu là bắt buộc khi tạo tài khoản mới.' });
        return;
      }

      dispatch({ type: 'SUBMIT_START' });
      try {
        const dto: CreateUserDto | UpdateUserDto = isEdit
          ? {
              username: state.username || undefined,
              phone:    state.phone    || undefined,
              role:     state.role,
              pondIds:  state.pondIds,
            }
          : {
              email:    state.email,
              password: state.password,
              username: state.username || undefined,
              phone:    state.phone    || undefined,
              role:     state.role,
              pondIds:  state.pondIds,
            };

        await onSubmit(dto);
        dispatch({ type: 'SUBMIT_END' });
        onClose();
      } catch (error: any) {
        // Capture the error thrown from the backend with multiple fallbacks
        const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra";
        toast.error(errorMessage);  // ← Displays "Đã có người quản lý" to admin
        dispatch({ type: 'SUBMIT_END', error: errorMessage });
      }
    },
    [state, isEdit, onSubmit, onClose]
  );

  // Total ponds count for display
  const totalPonds = pondsByZone.reduce((sum, g) => sum + g.ponds.length, 0);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-white rounded-2xl shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <div>
              <Dialog.Title className="text-gray-900 text-base font-semibold">
                {isEdit ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
              </Dialog.Title>
              <Dialog.Description className="text-gray-400 text-xs mt-0.5">
                {isEdit
                  ? `Cập nhật thông tin cho ${editUser?.email}`
                  : 'Điền thông tin để tạo tài khoản người dùng mới'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                id="close-user-dialog"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-gray-600 mb-1.5">
                Họ và tên
              </label>
              <input
                id="username"
                type="text"
                value={state.username}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'username', value: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Email — read-only in edit mode */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={state.email}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
                placeholder="user@aquasmart.vn"
                disabled={isEdit}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-400 transition-all"
              />
              {isEdit && (
                <p className="text-gray-400 text-xs mt-1">Email không thể thay đổi sau khi tạo.</p>
              )}
            </div>

            {/* Password — only on create */}
            {!isEdit && (
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1.5">
                  Mật khẩu <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={state.showPwd ? 'text' : 'password'}
                    value={state.password}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'showPwd', value: !state.showPwd })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {state.showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-gray-600 mb-1.5">
                Số điện thoại
              </label>
              <input
                id="phone"
                type="tel"
                value={state.phone}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phone', value: e.target.value })}
                placeholder="09xxxxxxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Vai trò <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['user', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    id={`role-${r}`}
                    onClick={() => dispatch({ type: 'SET_FIELD', field: 'role', value: r })}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      state.role === r
                        ? r === 'admin'
                          ? 'border-purple-400 bg-purple-50 text-purple-700'
                          : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {r === 'admin' ? <Shield size={14} /> : <User size={14} />}
                    {r === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pond assignment — grouped by Zone — uses real pond IDs */}
            {state.role === 'user' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  <MapPin size={12} className="inline mr-1" />
                  Phân công ao nuôi
                  {state.pondIds.length > 0 && (
                    <span className="ml-1.5 text-teal-600">({state.pondIds.length} đã chọn)</span>
                  )}
                </label>
                {pondsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-xs py-3">
                    <Loader2 size={14} className="animate-spin" /> Đang tải danh sách ao nuôi...
                  </div>
                ) : totalPonds === 0 ? (
                  <p className="text-gray-400 text-xs">Chưa có ao nuôi nào trong hệ thống.</p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {pondsByZone.map((group) => (
                      <div key={group.zone.id}>
                        {/* Zone header */}
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 px-1">
                          {group.zone.name}
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {group.ponds.map((pond) => {
                            const checked = state.pondIds.includes(pond.id);
                            return (
                              <button
                                key={pond.id}
                                type="button"
                                id={`pond-${pond.id}`}
                                onClick={() => dispatch({ type: 'TOGGLE_POND', pondId: pond.id })}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border-2 text-sm transition-all text-left ${
                                  checked
                                    ? 'border-teal-400 bg-teal-50 text-teal-800'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                <span className="font-medium">
                                  {pond.name}
                                  {pond.farming_type && (
                                    <span className="ml-1.5 text-xs text-gray-400 font-normal">
                                      ({pond.farming_type})
                                    </span>
                                  )}
                                  {pondOwners[pond.id] && pondOwners[pond.id] !== (editUser?.username ?? '') && (
                                    <span className="text-gray-500 italic ml-2 text-xs font-normal">- đã quản lý bởi {pondOwners[pond.id]}</span>
                                  )}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                    checked
                                      ? 'bg-teal-500 border-teal-500'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {checked && (
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <p className="text-red-600 text-sm">{state.error}</p>
              </div>
            )}
          </form>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100">
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </Dialog.Close>
            <button
              id="submit-user-form"
              type="submit"
              form="user-form-submit"
              onClick={handleSubmit}
              disabled={state.isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {state.isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
