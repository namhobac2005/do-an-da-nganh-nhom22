/**
 * ZonesPage.tsx
 * Trang danh sách Vùng Nuôi (Zone Gallery).
 * Click vào Zone → điều hướng sang /zones/:zoneId/ponds
 * Admin: có thể tạo/sửa/xóa zone.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Search, RefreshCw, Waves, MapPin, ChevronRight, Pencil, Trash2, AlertCircle, Fish } from 'lucide-react';
import { useNavigate } from 'react-router';
import * as zoneService from '../../services/zoneService';
import { useAuth } from '../../context/AuthContext';
import type { Zone, CreateZoneDto, UpdateZoneDto } from '../../types/user.types';

// ===== STATUS CONFIG =====
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:      { label: 'Hoạt động', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  inactive:    { label: 'Ngưng HĐ',  bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
  maintenance: { label: 'Bảo trì',   bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500' },
};

// ===== INLINE ZONE FORM DIALOG =====
const ZoneFormDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateZoneDto | UpdateZoneDto) => Promise<void>;
  editZone?: Zone | null;
}> = ({ open, onClose, onSubmit, editZone }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'maintenance'>('active');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editZone?.name ?? '');
      setLocation(editZone?.location ?? '');
      setStatus((editZone?.status as any) ?? 'active');
    }
  }, [open, editZone]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Tên vùng nuôi là bắt buộc'); return; }
    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), location: location.trim() || undefined, status });
      onClose();
    } catch { /* parent handles toast */ }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="text-gray-900 text-base font-semibold">
            {editZone ? 'Chỉnh sửa vùng nuôi' : 'Thêm vùng nuôi mới'}
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {editZone ? `Cập nhật ${editZone.name}` : 'Nhập thông tin vùng nuôi'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tên vùng nuôi <span className="text-red-500">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Khu A - Tôm thẻ"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Địa điểm</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="VD: Phía Bắc, Cà Mau"
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
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
              {loading ? 'Đang xử lý...' : (editZone ? 'Lưu thay đổi' : 'Tạo vùng nuôi')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ===== MAIN PAGE =====
export const ZonesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editZone, setEditZone] = useState<Zone | null>(null);

  const fetchZones = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await zoneService.getZones();
      setZones(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  // CRUD handlers
  const handleCreate = async (dto: CreateZoneDto | UpdateZoneDto) => {
    await zoneService.createZone(dto as CreateZoneDto);
    toast.success('Đã tạo vùng nuôi thành công!');
    fetchZones();
  };

  const handleUpdate = async (dto: CreateZoneDto | UpdateZoneDto) => {
    if (!editZone) return;
    await zoneService.updateZone(editZone.id, dto as UpdateZoneDto);
    toast.success('Đã cập nhật vùng nuôi!');
    fetchZones();
  };

  const handleDelete = async (zone: Zone) => {
    if (!confirm(`Bạn chắc chắn muốn xóa "${zone.name}"? Tất cả ao nuôi bên trong sẽ bị xóa!`)) return;
    try {
      await zoneService.deleteZone(zone.id);
      toast.success('Đã xóa vùng nuôi!');
      fetchZones();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Filter
  const filtered = zones.filter((z) =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (z.location ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Waves size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-gray-900 text-lg font-bold">Vùng Nuôi</h1>
            <p className="text-gray-500 text-xs">{filtered.length} vùng nuôi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-48">
            <Search size={14} className="text-gray-400" />
            <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-gray-600 outline-none w-full text-sm" />
          </div>
          <button onClick={fetchZones} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Làm mới">
            <RefreshCw size={16} />
          </button>
          {isAdmin && (
            <button onClick={() => { setEditZone(null); setDialogOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">
              <Plus size={15} /> Thêm Vùng Nuôi
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-24 bg-gradient-to-r from-teal-100 to-emerald-100" />
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
          <p className="text-gray-600 text-sm font-medium mb-1">Không thể tải danh sách vùng nuôi</p>
          <p className="text-gray-400 text-xs mb-4">{error}</p>
          <button onClick={fetchZones} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <Waves size={36} className="text-gray-200 mb-3" />
          <p className="text-gray-500 text-sm font-medium">Chưa có vùng nuôi nào</p>
          {isAdmin && <p className="text-gray-400 text-xs mt-1">Nhấn "Thêm Vùng Nuôi" để bắt đầu</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((zone) => {
            const cfg = STATUS_CONFIG[zone.status] || STATUS_CONFIG.active;
            return (
              <div key={zone.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer group"
                onClick={() => navigate(`/zones/${zone.id}/ponds`)}
              >
                {/* Card Header */}
                <div className="bg-gradient-to-br from-teal-800 to-emerald-700 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <Waves size={20} className="text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-bold truncate">{zone.name}</p>
                        {zone.location && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="text-emerald-200 shrink-0" />
                            <p className="text-emerald-200 text-xs truncate">{zone.location}</p>
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
                  <div className="flex items-center gap-1.5">
                    <Fish size={13} className="text-teal-500 shrink-0" />
                    <span className="text-sm text-teal-700 font-medium">
                      {zone.pond_count ?? 0} ao nuôi
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Tạo ngày {new Date(zone.created_at).toLocaleDateString('vi-VN')}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/zones/${zone.id}/ponds`); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold hover:bg-teal-100 transition-colors"
                    >
                      Xem ao nuôi <ChevronRight size={12} />
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setEditZone(zone); setDialogOpen(true); }}
                          className="p-2 rounded-lg text-gray-500 border border-gray-200 hover:bg-gray-50" title="Chỉnh sửa">
                          <Pencil size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(zone); }}
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

      {/* Zone Form Dialog */}
      <ZoneFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditZone(null); }}
        onSubmit={editZone ? handleUpdate : handleCreate}
        editZone={editZone}
      />
    </div>
  );
};
