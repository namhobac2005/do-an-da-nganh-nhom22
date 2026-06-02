/**
 * useRealtimeAlerts.ts
 * Custom hook — subscribes to Supabase Realtime INSERT events on alert_logs.
 *
 * Role-based filtering logic:
 *   - Admin: receives toast for ALL alerts (no pond filtering)
 *   - User:  only receives toast for alerts where zone_id (= pond_id) is in their assigned ponds
 *
 * Behavior:
 *   1. On mount, checks user role from AuthContext.
 *   2. If user is NOT admin, fetches assigned pond IDs via the zone/pond API.
 *   3. Opens a Supabase Realtime channel listening for INSERT on public.alert_logs.
 *   4. When a new alert arrives:
 *      - If admin → always show toast
 *      - If user → only show toast if payload.new.zone_id is in their pond list
 *   5. Cleans up the channel subscription on unmount.
 *
 * Activated globally in MainLayout.tsx so it runs for all authenticated pages.
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import * as zoneService from '../services/zoneService';
import { useAuth } from '../context/AuthContext';

/** Human-readable metric labels (Vietnamese) */
const METRIC_LABELS: Record<string, string> = {
  light: 'Ánh sáng',
  temperature: 'Nhiệt độ',
  water_level: 'Mực nước',
  pH: 'pH',
  DO: 'Ô xy hoà tan',
};

export const useRealtimeAlerts = () => {
  const { user, isAuthenticated } = useAuth();
  const pondIdsRef = useRef<string[]>([]);
  const isAdminRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let cancelled = false;
    isAdminRef.current = user.role === 'admin';

    // 1. For non-admin users, fetch their assigned pond IDs
    const loadPondIds = async () => {
      // Admins see ALL alerts → no need to fetch pond list
      if (isAdminRef.current) {
        console.log('[useRealtimeAlerts] Admin — nhận tất cả cảnh báo');
        return;
      }

      try {
        const zones = await zoneService.getZones();
        if (cancelled || !Array.isArray(zones)) return;

        const allPondIds: string[] = [];
        for (const zone of zones) {
          try {
            const ponds = await zoneService.getPondsByZone(zone.id);
            if (Array.isArray(ponds)) {
              ponds.forEach((p: any) => {
                if (p.id) allPondIds.push(p.id);
              });
            }
          } catch {
            // Skip zones that fail to load
          }
        }

        if (!cancelled) {
          pondIdsRef.current = allPondIds;
          console.log(
            `[useRealtimeAlerts] User — đang theo dõi ${allPondIds.length} ao nuôi`,
          );
        }
      } catch (err) {
        console.error('[useRealtimeAlerts] Không thể tải danh sách ao:', err);
      }
    };

    loadPondIds();

    // 2. Subscribe to Supabase Realtime INSERT events on alert_logs
    const channel = supabase
      .channel('realtime-alert-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alert_logs',
        },
        (payload) => {
          const newAlert = payload.new as {
            id: string;
            zone_id: string | null;  // Actually stores pond_id
            metric: string;
            recorded_value: number;
            reason: string;
            status: string;
            created_at: string;
          };

          const alertPondId = newAlert.zone_id;
          if (!alertPondId) return;

          // 3. Role-based filtering
          if (isAdminRef.current) {
            // Admin → always show toast for all alerts
          } else {
            // User → only show toast if this pond is in their assigned list
            if (pondIdsRef.current.length > 0 && !pondIdsRef.current.includes(alertPondId)) {
              return; // Not their pond → skip
            }
            // If pondIdsRef is empty (still loading), show it anyway to be safe
          }

          // 4. Show toast notification
          const metricLabel =
            METRIC_LABELS[newAlert.metric] || newAlert.metric;

          toast.error(
            `🚨 Cảnh báo: ${metricLabel} = ${newAlert.recorded_value} — ${newAlert.reason}`,
            {
              duration: 8000,
              description: `Ao nuôi bị vượt ngưỡng lúc ${new Date(newAlert.created_at).toLocaleTimeString('vi-VN')}`,
            },
          );
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useRealtimeAlerts] ✅ Đã kết nối Realtime alerts');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeAlerts] ❌ Lỗi kết nối Realtime');
        }
      });

    // 5. Cleanup on unmount
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user]);
};
