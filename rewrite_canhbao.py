import re

with open('frontend/src/app/pages/alerts/CanhBao.tsx', 'r') as f:
    content = f.read()

# 1. Import ZonePondSelector
content = content.replace(
    "import * as alertService from '../../services/alertService';",
    "import * as alertService from '../../services/alertService';\nimport { ZonePondSelector } from '../../components/common/ZonePondSelector';"
)

# 2. Modify ThresholdTab signature
content = content.replace(
    "const ThresholdTab: React.FC<{ pondOptions: PondOption[] }> = ({ pondOptions }) => {",
    "const ThresholdTab: React.FC<{ selectedPond: string }> = ({ selectedPond }) => {"
)

# 3. Modify ThresholdTab form
form_target_id = """            {targetType === 'pond' ? (
              <select
                {...register('target_id', { required: 'Vui lòng chọn ao nuôi.' })}
                className={inputCls(!!errors.target_id)}
              >
                <option value="">— Chọn ao nuôi —</option>
                {pondOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Vùng: {p.zoneName})
                  </option>
                ))}
              </select>
            ) : ("""

new_form_target_id = """            {targetType === 'pond' ? (
              <input
                type="text"
                disabled
                value="Ao đang chọn"
                className={inputCls()}
              />
            ) : ("""
content = content.replace(form_target_id, new_form_target_id)

submit_upsert = """      const saved = await alertService.upsertThreshold({
        target_type: vals.target_type,
        target_id:   vals.target_id,
        metric:      vals.metric,"""
new_submit_upsert = """      const saved = await alertService.upsertThreshold({
        target_type: vals.target_type,
        target_id:   vals.target_type === 'pond' ? selectedPond : vals.target_id,
        metric:      vals.metric,"""
content = content.replace(submit_upsert, new_submit_upsert)

# 4. Modify ThresholdTab table mapping
table_mapping = """                thresholds.map((t) => {
                  const metric = METRICS.find((m) => m.value === t.metric);
                  const targetName = t.target_type === 'pond'
                    ? pondOptions.find((p) => p.id === t.target_id)?.name ?? t.target_id.slice(0, 8)
                    : t.target_id;"""
new_table_mapping = """                thresholds
                  .filter(t => t.target_type !== 'pond' || t.target_id === selectedPond)
                  .map((t) => {
                  const metric = METRICS.find((m) => m.value === t.metric);
                  const targetName = t.target_type === 'pond'
                    ? 'Ao đang chọn'
                    : t.target_id;"""
content = content.replace(table_mapping, new_table_mapping)

# 5. Modify AlertLogsTab signature
content = content.replace(
    "const AlertLogsTab: React.FC<{ pondOptions: PondOption[] }> = ({ pondOptions }) => {",
    "const AlertLogsTab: React.FC<{ selectedPond: string }> = ({ selectedPond }) => {"
)

# 6. Modify getAlertLogs fetch
fetch_logs = """    try {
      const result = await alertService.getAlertLogs({ page: p, limit: LIMIT });"""
new_fetch_logs = """    try {
      const result = await alertService.getAlertLogs({ page: p, limit: LIMIT, zoneId: selectedPond });"""
content = content.replace(fetch_logs, new_fetch_logs)

# 7. Modify fetchLogs dependencies
content = content.replace(
    "  }, []);",
    "  }, [selectedPond]);"
)

# 8. Modify AlertLogsTab table mapping
alert_mapping = """                const metric   = METRICS.find((m) => m.value === log.metric);
                // zone_id field in alert_logs stores the pond context
                const pondName = pondOptions.find((p) => p.id === log.zone_id)?.name ?? log.zone_id?.slice(0, 8) ?? '—';
                const dt       = new Date(log.created_at);"""
new_alert_mapping = """                const metric   = METRICS.find((m) => m.value === log.metric);
                const pondName = 'Ao đang chọn';
                const dt       = new Date(log.created_at);"""
content = content.replace(alert_mapping, new_alert_mapping)

# 9. Modify CanhBao main component
canhbao_old = """export const CanhBao: React.FC = () => {
  const [activeTab,   setActiveTab]   = useState<Tab>('log');
  const [pondOptions, setPondOptions] = useState<PondOption[]>([]);
  const [unread,      setUnread]      = useState(0);

  // Fetch zones + ponds grouped on mount
  useEffect(() => {
    const loadPonds = async () => {
      try {
        const zones = await zoneService.getZones();
        const results: ZoneWithPonds[] = await Promise.all(
          (zones || []).map(async (z: any) => {
            try {
              const ponds = await zoneService.getPondsByZone(z.id);
              return { zone: { id: z.id, name: z.name }, ponds: ponds || [] };
            } catch {
              return { zone: { id: z.id, name: z.name }, ponds: [] };
            }
          })
        );

        // Flatten to PondOption[]
        const options: PondOption[] = [];
        results.forEach((g) => {
          g.ponds.forEach((p) => {
            options.push({
              id: p.id,
              name: p.name,
              farming_type: p.farming_type,
              zoneName: g.zone.name,
            });
          });
        });
        setPondOptions(options);
      } catch {
        setPondOptions([]);
      }
    };

    loadPonds();
    alertService.getUnreadCount().then(setUnread).catch(() => null);
  }, []);"""

canhbao_new = """export const CanhBao: React.FC = () => {
  const [activeTab,   setActiveTab]   = useState<Tab>('log');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedPond, setSelectedPond] = useState('');
  const [unread,      setUnread]      = useState(0);

  useEffect(() => {
    alertService.getUnreadCount().then(setUnread).catch(() => null);
  }, []);"""
content = content.replace(canhbao_old, canhbao_new)

# 10. Fix CanhBao header
header_old = """      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <Bell size={20} className="text-red-500" />
            Cảnh báo & Ngưỡng
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Quản lý ngưỡng cảnh báo và nhật ký sự kiện
          </p>
        </div>
        {unread > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
            <ShieldAlert size={15} className="text-red-500" />
            <span className="text-red-700 text-sm font-semibold">{unread} cảnh báo chưa xử lý</span>
          </div>
        )}
      </div>"""
header_new = """      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <Bell size={20} className="text-red-500" />
            Cảnh báo & Ngưỡng
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Quản lý ngưỡng cảnh báo và nhật ký sự kiện
          </p>
        </div>
        <div className="flex items-center gap-4">
          {unread > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
              <ShieldAlert size={15} className="text-red-500" />
              <span className="text-red-700 text-sm font-semibold">{unread} cảnh báo chưa xử lý</span>
            </div>
          )}
          <ZonePondSelector
            onPondSelect={setSelectedPond}
            onZoneSelect={setSelectedZone}
          />
        </div>
      </div>"""
content = content.replace(header_old, header_new)

# 11. Fix CanhBao body
body_old = """      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Chưa xử lý', value: unread, color: 'text-red-700', bg: 'bg-red-50', icon: <AlertTriangle size={20} /> },
          { label: 'Ao nuôi', value: pondOptions.length, color: 'text-teal-700', bg: 'bg-teal-50', icon: <Fish size={20} /> },
          { label: 'Thiết lập', value: '—', color: 'text-amber-700', bg: 'bg-amber-50', icon: <Settings size={20} /> },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className={`${s.color} opacity-70`}>{s.icon}</div>
            <div>
              <p className={`${s.color} text-xl font-bold leading-tight`}>{s.value}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
            {t.key === 'log' && unread > 0 && (
              <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'threshold' ? <ThresholdTab pondOptions={pondOptions} /> : <AlertLogsTab pondOptions={pondOptions} />}"""

body_new = """      {!selectedPond ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
          <ShieldAlert size={64} className="mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-slate-500">
            Chưa chọn ao nuôi
          </h3>
          <p>Vui lòng chọn Vùng và Ao để xem cảnh báo và thiết lập ngưỡng.</p>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Chưa xử lý', value: unread, color: 'text-red-700', bg: 'bg-red-50', icon: <AlertTriangle size={20} /> },
              { label: 'Ao đang chọn', value: '1', color: 'text-teal-700', bg: 'bg-teal-50', icon: <Fish size={20} /> },
              { label: 'Thiết lập', value: '—', color: 'text-amber-700', bg: 'bg-amber-50', icon: <Settings size={20} /> },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
                <div className={`${s.color} opacity-70`}>{s.icon}</div>
                <div>
                  <p className={`${s.color} text-xl font-bold leading-tight`}>{s.value}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === t.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.icon}
                {t.label}
                {t.key === 'log' && unread > 0 && (
                  <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'threshold' ? <ThresholdTab selectedPond={selectedPond} /> : <AlertLogsTab selectedPond={selectedPond} />}
        </>
      )}"""
content = content.replace(body_old, body_new)

with open('frontend/src/app/pages/alerts/CanhBao.tsx', 'w') as f:
    f.write(content)

print("Done rewrite")
