/**
 * useRealtimeAlerts.ts
 * Custom hook — subscribes to Supabase Realtime INSERT events on alert_logs.
 *
 * Behavior:
 *   1. On mount, fetches the current user's assigned pond IDs via the zone/pond API.
 *   2. Opens a Supabase Realtime channel listening for INSERT on public.alert_logs.
 *   3. When a new alert arrives, checks if payload.new.zone_id is in the user's
 *      pond list (zone_id stores the pond UUID in alert_logs).
 *   4. If it matches, fires a toast.error() notification with a Vietnamese message.
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

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let cancelled = false;

    // 1. Fetch user's assigned pond IDs
    const loadPondIds = async () => {
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
            `[useRealtimeAlerts] Đang theo dõi ${allPondIds.length} ao nuôi`,
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
            zone_id: string | null;
            metric: string;
            recorded_value: number;
            reason: string;
            status: string;
            created_at: string;
          };

          // 3. Filter: only show toast if the alert's pond is in user's list
          const alertPondId = newAlert.zone_id;
          if (!alertPondId) return;

          if (pondIdsRef.current.length > 0 && !pondIdsRef.current.includes(alertPondId)) {
            // Alert is for a pond the user doesn't manage — ignore
            return;
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
