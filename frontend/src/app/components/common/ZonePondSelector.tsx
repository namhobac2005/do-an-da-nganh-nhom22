import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as sensorService from "../../services/sensorService";
import { useNavigate } from "react-router";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (zoneId: string, pondId: string) => void;
  actionPath?: string | null; // if provided, navigate immediately; if null/undefined show Manage/Control choices
}

export const ZonePondSelector: React.FC<Props> = ({
  open,
  onOpenChange,
  actionPath,
  onSelect,
}) => {
  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([]);
  const [ponds, setPonds] = useState<Array<{ id: string; name: string }>>([]);
  const [zoneId, setZoneId] = useState<string>("");
  const [pondId, setPondId] = useState<string>("");
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingPonds, setLoadingPonds] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const loadZones = async () => {
      setLoadingZones(true);
      const z = await sensorService.getZones();
      setZones(z);
      setLoadingZones(false);
    };
    loadZones();
  }, [open]);

  useEffect(() => {
    if (!zoneId) return setPonds([]);
    const loadPonds = async () => {
      setLoadingPonds(true);
      const p = await sensorService.getPondsByZone(zoneId);
      setPonds(p);
      setLoadingPonds(false);
    };
    loadPonds();
  }, [zoneId]);

  const handleNavigate = (path: string) => {
    if (!zoneId || !pondId) return;
    onOpenChange(false);
    onSelect?.(zoneId, pondId);
    const params = new URLSearchParams({ zoneId, pondId }).toString();
    navigate(`${path}?${params}`);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl outline-none p-6">
          <Dialog.Title className="text-gray-900 text-lg font-semibold">
            Chọn Vùng & Ao
          </Dialog.Title>
          <Dialog.Description className="text-gray-500 text-sm mt-1">
            Chọn Zone và Pond trước khi tiếp tục.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-gray-700 block mb-1">Zone</label>
              <select
                value={zoneId}
                onChange={(e) => {
                  setZoneId(e.target.value);
                  setPondId("");
                }}
                className="w-full border rounded-lg p-2"
              >
                <option value="">-- Chọn vùng --</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-700 block mb-1">Pond</label>
              <select
                value={pondId}
                onChange={(e) => setPondId(e.target.value)}
                disabled={!zoneId || loadingPonds}
                className="w-full border rounded-lg p-2"
              >
                <option value="">-- Chọn ao --</option>
                {ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>
              {actionPath ? (
                <button
                  onClick={() => actionPath && handleNavigate(actionPath)}
                  disabled={!zoneId || !pondId}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                >
                  Tiếp tục
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNavigate("/admin/devices")}
                    disabled={!zoneId || !pondId}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                  >
                    Quản lý thiết bị
                  </button>
                  <button
                    onClick={() => handleNavigate("/control")}
                    disabled={!zoneId || !pondId}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                  >
                    Điều khiển thiết bị
                  </button>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ZonePondSelector;
