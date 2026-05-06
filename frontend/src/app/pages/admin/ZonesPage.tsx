/**
 * ZonesPage.tsx
 * Trang Quản Lý Vùng Ao (UC01) — master list.
 * Fully connected to the backend API. No mock data.
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Waves } from 'lucide-react';

import { ZoneTable }      from '../../components/admin/ZoneTable';
import { ZoneFormDialog } from '../../components/admin/ZoneFormDialog';
import * as zoneService   from '../../services/zoneService';
import type { Zone, CreateZoneDto, UpdateZoneDto } from '../../types/user.types';

export const ZonesPage: React.FC = () => {
  const [zones,        setZones]        = useState<Zone[]>([]);
  const [farmingTypes, setFarmingTypes] = useState<string[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [dialogOpen,   setDialogOpen]   = useState(false);
  const [editZone,     setEditZone]     = useState<Zone | null>(null);

  // ===== FETCH =====
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [zonesData, typesData] = await Promise.all([
        zoneService.getZones(),
        zoneService.getFarmingTypes(),
      ]);
      setZones(zonesData);
      setFarmingTypes(typesData);
    } catch (err: any) {
      setError(err.message ?? 'Không thể tải dữ liệu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ===== FILTER =====
  const filtered = zones.filter((z) =>
    z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (z.location ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (z.farming_type ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ===== HANDLERS =====
  const handleOpenCreate = () => { setEditZone(null); setDialogOpen(true); };
  const handleOpenEdit   = (z: Zone) => { setEditZone(z); setDialogOpen(true); };
  const handleClose      = () => { setDialogOpen(false); setEditZone(null); };

  const handleSubmit = async (dto: CreateZoneDto | UpdateZoneDto) => {
    if (editZone) {
      const updated = await zoneService.updateZone(editZone.id, dto as UpdateZoneDto);
      setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
      // Refresh farming types in case a new one was added
      const types = await zoneService.getFarmingTypes();
      setFarmingTypes(types);
    } else {
      const created = await zoneService.createZone(dto as CreateZoneDto);
      setZones((prev) => [created, ...prev]);
      if (created.farming_type && !farmingTypes.includes(created.farming_type)) {
        setFarmingTypes((prev) => [...prev, created.farming_type!].sort());
      }
    }
  };

  const handleDelete = async (zone: Zone) => {
    if (!confirm(`Bạn có chắc muốn xóa vùng ao "${zone.name}"?\nHành động này không thể hoàn tác.`))
      return;
    try {
      await zoneService.deleteZone(zone.id);
      setZones((prev) => prev.filter((z) => z.id !== zone.id));
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <Waves size={22} className="text-teal-600" />
            Quản lý vùng ao
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {isLoading ? 'Đang tải...' : `${zones.length} vùng ao trong hệ thống`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              id="zone-search"
              type="text"
              placeholder="Tìm vùng ao..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-sm text-gray-700 outline-none focus:border-emerald-400 w-48 transition-colors"
            />
          </div>

          {/* Refresh */}
          <button
            id="refresh-zones"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            title="Tải lại"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>

          {/* Add */}
          <button
            id="add-zone-btn"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200"
          >
            <Plus size={15} />
            Thêm Vùng Ao
          </button>
        </div>
      </div>

      {/* Zone grid */}
      <ZoneTable
        zones={filtered}
        isLoading={isLoading}
        error={error}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onRetry={fetchData}
      />

      {/* Create / Edit Dialog */}
      <ZoneFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editZone={editZone}
        farmingTypes={farmingTypes}
      />
    </div>
  );
};
