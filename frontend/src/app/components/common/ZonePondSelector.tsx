/**
 * ZonePondSelector.tsx
 * Reusable inline cascading selector: Zone (Vùng nuôi) → Pond (Ao nuôi).
 *
 * Props:
 *   - onPondSelect(pondId: string): Called when user picks a pond (or '' to clear)
 *   - onZoneSelect?(zoneId: string): Optional callback when zone changes
 *   - initialZoneId / initialPondId: Pre-select from URL params
 *   - className?: Extra wrapper class
 *
 * Data fetched from the authenticated zoneService API.
 *   GET /zones               → list of zones
 *   GET /zones/:id/ponds     → ponds nested under a zone
 */

import React, { useEffect, useState } from 'react';
import { MapPin, Fish, Loader2 } from 'lucide-react';
import * as zoneService from '../../services/zoneService';

interface ZonePondSelectorProps {
  onPondSelect: (pondId: string) => void;
  onZoneSelect?: (zoneId: string) => void;
  /** Optional: also receive the human-readable pond name when a pond is selected */
  onPondNameSelect?: (pondName: string) => void;
  initialZoneId?: string | null;
  initialPondId?: string | null;
  className?: string;
}

export const ZonePondSelector: React.FC<ZonePondSelectorProps> = ({
  onPondSelect,
  onZoneSelect,
  onPondNameSelect,
  initialZoneId,
  initialPondId,
  className = '',
}) => {
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
  const [ponds, setPonds] = useState<{ id: string; name: string }[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPond, setSelectedPond] = useState<string>('');
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingPonds, setLoadingPonds] = useState(false);
  const [errorZones, setErrorZones] = useState<string | null>(null);
  const [errorPonds, setErrorPonds] = useState<string | null>(null);

  // 1. Fetch zones on mount (once)
  useEffect(() => {
    let cancelled = false;
    setLoadingZones(true);
    setErrorZones(null);

    zoneService.getZones()
      .then((data: any[]) => {
        if (cancelled) return;

        if (!Array.isArray(data)) {
          console.warn('[ZonePondSelector] Zone data is not an array:', data);
          setZones([]);
          setLoadingZones(false);
          return;
        }

        const sorted = [...data].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', 'vi', { sensitivity: 'base' }),
        );
        setZones(sorted);

        // Auto-select zone if initialZoneId provided
        if (initialZoneId && sorted.some((z) => z.id === initialZoneId)) {
          setSelectedZone(initialZoneId);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[ZonePondSelector] Error fetching zones:', err);
        setErrorZones('Không thể tải danh sách vùng nuôi.');
        setZones([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingZones(false);
      });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Fetch ponds whenever selected zone changes
  useEffect(() => {
    if (!selectedZone) {
      setPonds([]);
      setSelectedPond('');
      setErrorPonds(null);
      onPondSelect('');
      return;
    }

    let cancelled = false;
    setLoadingPonds(true);
    setErrorPonds(null);

    zoneService.getPondsByZone(selectedZone)
      .then((data: any[]) => {
        if (cancelled) return;

        if (!Array.isArray(data)) {
          console.warn('[ZonePondSelector] Pond data is not an array:', data);
          setPonds([]);
          setLoadingPonds(false);
          return;
        }

        const sorted = [...data].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', 'vi', { sensitivity: 'base' }),
        );
        setPonds(sorted);

        // Auto-select pond from URL param if it belongs to this zone
        if (initialPondId && sorted.some((p) => p.id === initialPondId)) {
          setSelectedPond(initialPondId);
          onPondSelect(initialPondId);
          onPondNameSelect?.(sorted.find((p) => p.id === initialPondId)?.name || '');
        } else if (sorted.length > 0 && initialZoneId && selectedZone === initialZoneId) {
          // If navigated with a zoneId only, auto-select first pond
          setSelectedPond(sorted[0].id);
          onPondSelect(sorted[0].id);
          onPondNameSelect?.(sorted[0].name || '');
        } else {
          setSelectedPond('');
          onPondSelect('');
          onPondNameSelect?.('');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[ZonePondSelector] Error fetching ponds for zone ${selectedZone}:`, err);
        setErrorPonds('Không thể tải danh sách ao nuôi.');
        setPonds([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPonds(false);
      });

    return () => { cancelled = true; };
  }, [selectedZone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const zoneId = e.target.value;
    setSelectedZone(zoneId);
    setSelectedPond('');
    onPondSelect('');
    onZoneSelect?.(zoneId);
  };

  const handlePondChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pondId = e.target.value;
    const pondName = ponds.find((p) => p.id === pondId)?.name || '';
    setSelectedPond(pondId);
    onPondSelect(pondId);
    onPondNameSelect?.(pondName);
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      {/* ─── Zone Dropdown ─── */}
      <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3 min-w-0">
        <MapPin className="text-slate-400 shrink-0" size={18} />
        {loadingZones ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            Đang tải vùng nuôi...
          </div>
        ) : errorZones ? (
          <span className="text-sm text-red-400 truncate">{errorZones}</span>
        ) : (
          <select
            id="zone-select"
            className="w-full bg-transparent font-semibold text-slate-700 outline-none text-sm cursor-pointer"
            value={selectedZone}
            onChange={handleZoneChange}
            aria-label="Chọn vùng nuôi"
          >
            <option value="">-- Chọn Vùng Nuôi --</option>
            {zones.length > 0 ? (
              zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))
            ) : (
              <option disabled>Không có vùng nào</option>
            )}
          </select>
        )}
      </div>

      {/* ─── Pond Dropdown ─── */}
      <div
        className={`flex-1 bg-slate-50 p-3 rounded-xl border flex items-center gap-3 min-w-0 transition-colors ${
          !selectedZone
            ? 'border-slate-100 opacity-60'
            : 'border-slate-200'
        }`}
      >
        <Fish className="text-slate-400 shrink-0" size={18} />
        {loadingPonds ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            Đang tải ao nuôi...
          </div>
        ) : errorPonds ? (
          <span className="text-sm text-red-400 truncate">{errorPonds}</span>
        ) : (
          <select
            id="pond-select"
            className="w-full bg-transparent font-semibold text-slate-700 outline-none text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!selectedZone || ponds.length === 0}
            value={selectedPond}
            onChange={handlePondChange}
            aria-label="Chọn ao nuôi"
          >
            <option value="">-- Chọn Ao Nuôi --</option>
            {selectedZone && ponds.length > 0 ? (
              ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))
            ) : selectedZone ? (
              <option disabled>Không có ao nào trong vùng này</option>
            ) : null}
          </select>
        )}
      </div>
    </div>
  );
};

export default ZonePondSelector;
