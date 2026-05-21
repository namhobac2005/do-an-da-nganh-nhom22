/**
 * PondsByZonePage.tsx
 * Danh sách Ao Nuôi trong 1 Vùng Nuôi cụ thể.
 * Route: /zones/:zoneId/ponds
 *
 * Features:
 *  - Breadcrumb: Vùng nuôi > [Zone Name] > Danh sách ao
 *  - Pond cards with status, farming_type, sensor/actuator counts
 *  - Click pond → /zones/:zoneId/ponds/:pondId
 *  - Admin: Create/Edit/Delete pond
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Search, RefreshCw, Waves, MapPin, Fish, ChevronRight,
  Pencil, Trash2, AlertCircle, ArrowLeft, Activity, Cpu, Loader2,
} from 'lucide-react';
import { useParams, useNavigate, Link } from 'react-router';
import * as zoneService from '../../services/zoneService';
import { useAuth } from '../../context/AuthContext';
import type { Zone, Pond, CreatePondDto, UpdatePondDto } from '../../types/user.types';

// ===== STATUS CONFIG =====
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:      { label: 'Hoạt động', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  inactive:    { label: 'Ngưng HĐ',  bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
  maintenance: { label: 'Bảo trì',   bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
};

// ===== INLINE POND FORM DIALOG =====
const PondFormDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (dto: CreatePondDto | UpdatePondDto) => Promise<void>;
  editPond?: Pond | null;
}> = ({ open, onClose, onSubmit, editPond }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [farmingType, setFarmingType] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance'>('active');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editPond?.name ?? '');
      setLocation(editPond?.location ?? '');
      setFarmingType(editPond?.farming_type ?? '');
      setStatus((editPond?.status as any) ?? 'active');
    }
  }, [open, editPond]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Tên ao nuôi là bắt buộc'); return; }
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        location: location.trim() || undefined,
        farming_type: farmingType.trim() || undefined,
        status,
      });
      onClose();
    } catch { /* parent handles toast */ }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-gray-900 text-base font-semibold">
            {editPond ? 'Chỉnh sửa ao nuôi' : 'Thêm ao nuôi mới'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tên ao nuôi <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Ao A1 - Tôm Thẻ"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Địa điểm</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="VD: Phía Bắc ao lớn"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Loại nuôi</label>
            <input value={farmingType} onChange={(e) => setFarmingType(e.target.value)} placeholder="VD: Tôm thẻ chân trắng"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Trạng thái</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white">
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngưng hoạt động</option>
              <option value="maintenance">Đang bảo trì</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {editPond ? 'Lưu thay đổi' : 'Tạo ao nuôi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== MAIN PAGE =====
export const PondsByZonePage: React.FC = () => {
  const { zoneId } = useParams<{ zoneId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [zone, setZone] = useState<Zone | null>(null);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPond, setEditPond] = useState<Pond | null>(null);

  const fetchData = useCallback(async () => {
    if (!zoneId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [zoneData, pondsData] = await Promise.all([
        zoneService.getZoneById(zoneId),
        zoneService.getPondsByZone(zoneId),
      ]);
      setZone(zoneData);
      setPonds(pondsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [zoneId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // CRUD
  const handleCreate = async (dto: CreatePondDto | UpdatePondDto) => {
    if (!zoneId) return;
    await zoneService.createPond(zoneId, dto as CreatePondDto);
    toast.success('Đã tạo ao nuôi thành công!');
    fetchData();
  };

  const handleUpdate = async (dto: CreatePondDto | UpdatePondDto) => {
    if (!zoneId || !editPond) return;
    await zoneService.updatePond(zoneId, editPond.id, dto as UpdatePondDto);
    toast.success('Đã cập nhật ao nuôi!');
    fetchData();
  };

  const handleDelete = async (pond: Pond) => {
    if (!zoneId) return;
    if (!confirm(`Bạn chắc chắn muốn xóa "${pond.name}"?`)) return;
    try {
      await zoneService.deletePond(zoneId, pond.id);
      toast.success('Đã xóa ao nuôi!');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = ponds.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.farming_type ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/zones" className="text-emerald-600 hover:underline font-medium">Vùng nuôi</Link>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-700 font-semibold">{zone?.name ?? 'Đang tải...'}</span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-500">Danh sách ao</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/zones')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <Fish size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-gray-900 text-lg font-bold">{zone?.name ?? 'Ao Nuôi'}</h1>
            <p className="text-gray-500 text-xs">{filtered.length} ao nuôi trong vùng này</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-48">
            <Search size={14} className="text-gray-400" />
            <input type="text" placeholder="Tìm ao nuôi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-gray-600 outline-none w-full text-sm" />
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Làm mới">
            <RefreshCw size={16} />
          </button>
          {isAdmin && (
            <button onClick={() => { setEditPond(null); setDialogOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">
              <Plus size={15} /> Thêm Ao Nuôi
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-20 bg-gradient-to-r from-blue-100 to-teal-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
          <AlertCircle size={32} className="text-red-400 mb-3" />
          <p className="text-gray-600 text-sm font-medium mb-1">Không thể tải danh sách ao nuôi</p>
          <p className="text-gray-400 text-xs mb-4">{error}</p>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <Fish size={36} className="text-gray-200 mb-3" />
          <p className="text-gray-500 text-sm font-medium">Chưa có ao nuôi nào trong vùng này</p>
          {isAdmin && <p className="text-gray-400 text-xs mt-1">Nhấn "Thêm Ao Nuôi" để bắt đầu</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((pond) => {
            const cfg = STATUS_CONFIG[pond.status] || STATUS_CONFIG.active;
            return (
              <div key={pond.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer group"
                onClick={() => navigate(`/zones/${zoneId}/ponds/${pond.id}`)}
              >
                {/* Card Header */}
                <div className="bg-gradient-to-br from-blue-800 to-teal-700 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <Fish size={20} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-bold truncate">{pond.name}</p>
                        {pond.location && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-blue-200 shrink-0" />
                            <p className="text-blue-200 text-xs truncate">{pond.location}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  {pond.farming_type ? (
                    <div className="flex items-center gap-1.5">
                      <Fish size={13} className="text-teal-500 shrink-0" />
                      <span className="text-sm text-teal-700 font-medium">{pond.farming_type}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-300 italic">Chưa xác định loại nuôi</p>
                  )}

                  {/* Counts */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Activity size={12} className="text-blue-400" />
                      <span>{pond.sensor_count ?? 0} cảm biến</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Cpu size={12} className="text-purple-400" />
                      <span>{pond.actuator_count ?? 0} thiết bị</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    Tạo ngày {new Date(pond.created_at).toLocaleDateString('vi-VN')}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/zones/${zoneId}/ponds/${pond.id}`); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      Chi tiết <ChevronRight size={12} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setEditPond(pond); setDialogOpen(true); }}
                          className="p-2 rounded-lg text-gray-500 border border-gray-200 hover:bg-gray-50" title="Chỉnh sửa">
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(pond); }}
                          className="p-2 rounded-lg text-red-500 border border-red-100 hover:bg-red-50" title="Xóa">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pond Form Dialog */}
      <PondFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditPond(null); }}
        onSubmit={editPond ? handleUpdate : handleCreate}
        editPond={editPond}
      />
    </div>
  );
};
