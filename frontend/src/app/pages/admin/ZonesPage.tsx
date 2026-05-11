/**
 * ZonesPage.tsx
 * Trang Quản Lý Vùng Ao (UC01) — master list.
 * Fully connected to the backend API. No mock data.
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Search, RefreshCw, Waves } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ZoneTable } from '../../components/admin/ZoneTable';
import { ZoneFormDialog } from '../../components/admin/ZoneFormDialog';
import * as zoneService from '../../services/zoneService';
import type {
  Zone,
  CreateZoneDto,
  UpdateZoneDto,
} from '../../types/user.types';

export const ZonesPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]); // Khởi tạo mảng rỗng
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await zoneService.getZones();
      // BẢO VỆ: Ép kiểu Array để không bao giờ bị lỗi .filter
      setZones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = zones.filter(
    (z) =>
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (z.location ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Waves className="text-blue-600" /> Quản lý vùng ao
        </h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Tìm tên hoặc vị trí..."
              className="pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 ring-blue-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => fetchData()}
            className="p-2 border rounded-xl hover:bg-slate-50"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <ZoneTable
        zones={filtered}
        isLoading={isLoading}
        onRowClick={(id) => navigate(`/admin/zones/${id}`)} // Nhảy sang trang chi tiết
      />
    </div>
  );
};
