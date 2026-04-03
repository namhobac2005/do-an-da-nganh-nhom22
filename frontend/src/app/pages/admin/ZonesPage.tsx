/**
 * ZonesPage.tsx
 * Trang Quản Lý Vùng Ao (Zone Management) - Dành cho Admin
 */

import { useState } from 'react';
import { Plus, Pencil, Trash2, Waves, Fish, Cpu, MapPin, Search, X, CheckCircle2 } from 'lucide-react';
import { MOCK_ZONES, MOCK_PONDS, MOCK_DEVICES, type Zone } from '../../data/mockData';

// ===== ZONE FORM MODAL =====
interface ZoneFormProps {
  zone?: Zone;
  onClose: () => void;
  onSave: (zone: Partial<Zone>) => void;
}

const ZoneForm: React.FC<ZoneFormProps> = ({ zone, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: zone?.name || '',
    location: zone?.location || '',
    status: zone?.status || 'active' as Zone['status'],
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim() || !form.location.trim()) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    onSave(form);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-gray-900" style={{ fontSize: '16px', fontWeight: 600 }}>
            {zone ? 'Chỉnh sửa vùng ao' : 'Thêm vùng ao mới'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
              Tên vùng ao *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="VD: Khu A - Tôm Thẻ"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 outline-none focus:border-emerald-500"
              style={{ fontSize: '14px' }}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
              Địa điểm *
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="VD: Phía Bắc, Cà Mau"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 outline-none focus:border-emerald-500"
              style={{ fontSize: '14px' }}
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1.5" style={{ fontSize: '13px', fontWeight: 500 }}>
              Trạng thái
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Zone['status'] }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 outline-none focus:border-emerald-500"
              style={{ fontSize: '14px' }}
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngưng hoạt động</option>
              <option value="maintenance">Đang bảo trì</option>
            </select>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ fontWeight: 500 }}>
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !form.name.trim()}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            style={{ fontWeight: 600 }}
          >
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang lưu...</>
            ) : (
              <><CheckCircle2 size={16} />Lưu</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== MAIN PAGE =====
export const ZonesPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>(MOCK_ZONES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | undefined>(undefined);

  const filteredZones = zones.filter((z) =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = (formData: Partial<Zone>) => {
    if (editingZone) {
      setZones((prev) => prev.map((z) => (z.id === editingZone.id ? { ...z, ...formData } : z)));
    } else {
      const newZone: Zone = {
        id: `zone-${Date.now()}`,
        name: formData.name || '',
        location: formData.location || '',
        pondCount: 0,
        totalArea: 0,
        status: formData.status || 'active',
        managerId: 'user-1',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setZones((prev) => [...prev, newZone]);
    }
    setEditingZone(undefined);
    setShowForm(false);
  };

  const handleDelete = (zoneId: string) => {
    if (!confirm('Bạn có chắc muốn xóa vùng ao này?')) return;
    setZones((prev) => prev.filter((z) => z.id !== zoneId));
  };

  const STATUS_CONFIG = {
    active:      { label: 'Hoạt động',      bg: 'bg-emerald-100', text: 'text-emerald-700' },
    inactive:    { label: 'Ngưng HĐ',       bg: 'bg-gray-100',    text: 'text-gray-600' },
    maintenance: { label: 'Bảo trì',        bg: 'bg-amber-100',   text: 'text-amber-700' },
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm vùng ao..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-gray-700 outline-none focus:border-emerald-400 w-60"
            style={{ fontSize: '13px' }}
          />
        </div>
        <button
          onClick={() => { setEditingZone(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          <Plus size={16} />
          Thêm Vùng Ao
        </button>
      </div>

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredZones.map((zone) => {
          const zonePonds = MOCK_PONDS.filter((p) => p.zoneId === zone.id);
          const zoneDevices = MOCK_DEVICES.filter((d) => d.zoneId === zone.id);
          const statusCfg = STATUS_CONFIG[zone.status];

          return (
            <div key={zone.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-teal-800 to-emerald-700 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Waves size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>{zone.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-emerald-200" />
                        <p className="text-emerald-200" style={{ fontSize: '11px' }}>{zone.location}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
                    style={{ fontSize: '11px', fontWeight: 600 }}>
                    {statusCfg.label}
                  </span>
                </div>
              </div>

              {/* Card Stats */}
              <div className="p-5">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2.5 bg-blue-50 rounded-xl">
                    <p className="text-blue-700" style={{ fontSize: '20px', fontWeight: 700 }}>{zonePonds.length}</p>
                    <p className="text-blue-500" style={{ fontSize: '11px' }}>Ao nuôi</p>
                  </div>
                  <div className="text-center p-2.5 bg-emerald-50 rounded-xl">
                    <p className="text-emerald-700" style={{ fontSize: '20px', fontWeight: 700 }}>{zoneDevices.length}</p>
                    <p className="text-emerald-500" style={{ fontSize: '11px' }}>Thiết bị</p>
                  </div>
                  <div className="text-center p-2.5 bg-teal-50 rounded-xl">
                    <p className="text-teal-700" style={{ fontSize: '20px', fontWeight: 700 }}>
                      {(zone.totalArea / 1000).toFixed(1)}
                    </p>
                    <p className="text-teal-500" style={{ fontSize: '11px' }}>ha (1000m²)</p>
                  </div>
                </div>

                {/* Pond Species Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {[...new Set(zonePonds.map((p) => p.species))].map((species) => (
                    <div key={species} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                      <Fish size={11} className="text-gray-500" />
                      <span className="text-gray-600" style={{ fontSize: '11px' }}>{species}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => { setEditingZone(zone); setShowForm(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                  >
                    <Pencil size={13} />
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => handleDelete(zone.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                    style={{ fontSize: '12px' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone Form Modal */}
      {showForm && (
        <ZoneForm
          zone={editingZone}
          onClose={() => { setShowForm(false); setEditingZone(undefined); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
