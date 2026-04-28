import { useEffect, useState } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions, RefreshControl, Platform
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BarChart, PieChart, LineChart } from "react-native-chart-kit"
import Svg, { Path, Line, Circle, Text as SvgText, G, Defs, LinearGradient as SvgGradient, Stop, Rect } from "react-native-svg"
import { Colors } from "../../constants/colors"
import { fetchWithCache } from "../../services/cache"
import { BASE_URL } from "../../config/api"

const SEGMENT_NAMES = {
  0: "นักวิ่ง",
  1: "คนรักสุขภาพ",
  2: "กำลังพัฒนา",
  3: "เริ่มต้นใหม่",
}

// Premium palette
const PALETTE = {
  navy:       "#0B1D3A",
  navyMid:    "#152D56",
  navyLight:  "#1E3F72",
  accent:     "#3B82F6",
  accentSoft: "#EFF6FF",
  emerald:    "#10B981",
  amber:      "#F59E0B",
  rose:       "#F43F5E",
  sky:        "#38BDF8",
  purple:     "#8B5CF6",
  text:       "#0F172A",
  textMuted:  "#64748B",
  textLight:  "#94A3B8",
  border:     "rgba(15,23,42,0.08)",
  surface:    "#FFFFFF",
  bg:         "#F8FAFD",
}

const SEGMENT_COLORS = [PALETTE.accent, PALETTE.emerald, PALETTE.purple, PALETTE.amber]

// ── Utility ──────────────────────────────────────────────────────────────────
const scoreColor = (v) =>
  v >= 70 ? PALETTE.emerald : v >= 50 ? PALETTE.amber : PALETTE.rose

const scoreLabel = (v) =>
  v >= 70 ? "ดีมาก" : v >= 50 ? "ปานกลาง" : "ต้องปรับปรุง"

// ── Radar Chart ──────────────────────────────────────────────────────────────
function RadarChart({ data, size = 240 }) {
  const cx = size / 2
  const cy = size / 2
  const r  = size * 0.32
  const n  = data.length
  const angleOf = (i) => (Math.PI * 2 * i) / n - Math.PI / 2
  const point = (i, radius) => ({
    x: cx + radius * Math.cos(angleOf(i)),
    y: cy + radius * Math.sin(angleOf(i)),
  })

  const rings = [0.25, 0.5, 0.75, 1].map((pct) => {
    const pts = data.map((_, i) => point(i, r * pct))
    return pts.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z"
  })

  const dataPts = data.map((d, i) => point(i, r * Math.min(d.value / 100, 1)))
  const dataPath = dataPts.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z"
  const axes = data.map((_, i) => ({ from: { x: cx, y: cy }, to: point(i, r) }))

  return (
    <View style={{ alignItems: "center", marginTop: 8 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={PALETTE.accent} stopOpacity="0.25" />
            <Stop offset="1" stopColor={PALETTE.accent} stopOpacity="0.05" />
          </SvgGradient>
        </Defs>
        {rings.map((d, i) => (
          <Path
            key={i} d={d} fill="none"
            stroke={i === 3 ? PALETTE.border : "rgba(203,213,225,0.4)"}
            strokeWidth={i === 3 ? "1.5" : "1"}
            strokeDasharray={i < 3 ? "3,3" : undefined}
          />
        ))}
        {axes.map((a, i) => (
          <Line
            key={i}
            x1={a.from.x} y1={a.from.y}
            x2={a.to.x}   y2={a.to.y}
            stroke="rgba(203,213,225,0.5)" strokeWidth="1"
          />
        ))}
        <Path d={dataPath} fill="url(#radarFill)" stroke={PALETTE.accent} strokeWidth="2.5" strokeLinejoin="round" />
        {dataPts.map((p, i) => (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r="6" fill={PALETTE.surface} stroke={PALETTE.accent} strokeWidth="2" />
            <Circle cx={p.x} cy={p.y} r="2.5" fill={PALETTE.accent} />
          </G>
        ))}
        {data.map((d, i) => {
          const lp = point(i, r + 26)
          return (
            <G key={i}>
              <SvgText
                x={lp.x} y={lp.y - 5}
                textAnchor="middle" alignmentBaseline="middle"
                fontSize="10.5" fill={PALETTE.textMuted} fontWeight="500"
              >
                {d.label}
              </SvgText>
              <SvgText
                x={lp.x} y={lp.y + 9}
                textAnchor="middle" alignmentBaseline="middle"
                fontSize="12" fontWeight="700"
                fill={scoreColor(d.value)}
              >
                {d.value.toFixed(0)}
              </SvgText>
            </G>
          )
        })}
      </Svg>
    </View>
  )
}

// ── Score Row Item ────────────────────────────────────────────────────────────
function ScoreRow({ label, value, index }) {
  const color = scoreColor(value)
  const pct = Math.min(value, 100)
  return (
    <View style={scoreRowStyles.wrap}>
      <View style={scoreRowStyles.left}>
        <Text style={scoreRowStyles.index}>{String(index + 1).padStart(2, "0")}</Text>
        <View>
          <Text style={scoreRowStyles.label}>{label}</Text>
          <Text style={[scoreRowStyles.status, { color }]}>{scoreLabel(value)}</Text>
        </View>
      </View>
      <View style={scoreRowStyles.right}>
        <View style={scoreRowStyles.barBg}>
          <View style={[scoreRowStyles.barFg, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
        <Text style={[scoreRowStyles.val, { color }]}>{value.toFixed(0)}</Text>
      </View>
    </View>
  )
}

const scoreRowStyles = StyleSheet.create({
  wrap:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: PALETTE.border },
  left:   { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  index:  { fontSize: 11, fontWeight: "700", color: PALETTE.textLight, fontVariant: ["tabular-nums"], width: 20 },
  label:  { fontSize: 14, fontWeight: "600", color: PALETTE.text },
  status: { fontSize: 11, marginTop: 1 },
  right:  { flexDirection: "row", alignItems: "center", gap: 10 },
  barBg:  { width: 72, height: 4, backgroundColor: "rgba(148,163,184,0.2)", borderRadius: 2, overflow: "hidden" },
  barFg:  { height: 4, borderRadius: 2 },
  val:    { fontSize: 14, fontWeight: "700", minWidth: 28, textAlign: "right" },
})

// ── Segment Bar ───────────────────────────────────────────────────────────────
function SegmentBar({ name, count, total, color, rank }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <View style={segStyles.wrap}>
      <View style={segStyles.header}>
        <View style={segStyles.nameRow}>
          <View style={[segStyles.dot, { backgroundColor: color }]} />
          <Text style={segStyles.name}>{name}</Text>
          <View style={[segStyles.rankBadge, { backgroundColor: color + "18" }]}>
            <Text style={[segStyles.rankText, { color }]}>#{rank}</Text>
          </View>
        </View>
        <View style={segStyles.stats}>
          <Text style={segStyles.count}>{count.toLocaleString()}</Text>
          <Text style={[segStyles.pct, { color }]}>{pct}%</Text>
        </View>
      </View>
      <View style={segStyles.track}>
        <View style={[segStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

const segStyles = StyleSheet.create({
  wrap:       { marginBottom: 16 },
  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  nameRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  name:       { fontSize: 14, fontWeight: "600", color: PALETTE.text },
  rankBadge:  { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  rankText:   { fontSize: 10, fontWeight: "700" },
  stats:      { flexDirection: "row", alignItems: "center", gap: 10 },
  count:      { fontSize: 12, color: PALETTE.textMuted },
  pct:        { fontSize: 15, fontWeight: "700" },
  track:      { height: 6, backgroundColor: "rgba(148,163,184,0.15)", borderRadius: 3, overflow: "hidden" },
  fill:       { height: 6, borderRadius: 3 },
})

// ── Metric Pill ───────────────────────────────────────────────────────────────
function MetricPill({ label, value, color }) {
  return (
    <View style={[pillStyles.wrap, { borderColor: color + "40", backgroundColor: color + "0D" }]}>
      <View style={[pillStyles.dot, { backgroundColor: color }]} />
      <Text style={pillStyles.label}>{label}</Text>
      <Text style={[pillStyles.val, { color }]}>{typeof value === "number" ? value.toFixed(0) : value}</Text>
    </View>
  )
}
const pillStyles = StyleSheet.create({
  wrap:  { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  dot:   { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, color: PALETTE.textMuted, fontWeight: "500" },
  val:   { fontSize: 11, fontWeight: "700" },
})

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, badge }) {
  return (
    <View style={shStyles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={shStyles.title}>{title}</Text>
        {subtitle ? <Text style={shStyles.sub}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={shStyles.badge}>
          <View style={shStyles.badgeDot} />
          <Text style={shStyles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  )
}
const shStyles = StyleSheet.create({
  wrap:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title:     { fontSize: 15, fontWeight: "700", color: PALETTE.text, letterSpacing: -0.3 },
  sub:       { fontSize: 12, color: PALETTE.textMuted, marginTop: 2 },
  badge:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: PALETTE.emerald + "15", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.emerald },
  badgeText: { fontSize: 11, fontWeight: "600", color: PALETTE.emerald },
})

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return <View style={[cardStyles.card, style]}>{children}</View>
}
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: PALETTE.border,
    shadowColor: "#0B1D3A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
})

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [analytics, setAnalytics]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]           = useState(null)
  const screenWidth = Dimensions.get("window").width

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setError(null)
    try {
      const a = await fetchWithCache(`${BASE_URL}/analytics`, 60000)
      setAnalytics(a)
    } catch (err) {
      setError(`ไม่สามารถโหลดข้อมูลได้: ${err.message}`)
    }
    setLoading(false)
  }

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false) }

  if (loading && !analytics) return (
    <View style={S.center}>
      <View style={S.loadingRing}>
        <Text style={{ fontSize: 28 }}>📊</Text>
      </View>
      <Text style={S.loadingTitle}>กำลังโหลดข้อมูล</Text>
      <Text style={S.loadingDesc}>Health Analytics</Text>
    </View>
  )

  if (error) return (
    <View style={S.center}>
      <View style={S.errorIcon}><Text style={{ fontSize: 28 }}>⚠️</Text></View>
      <Text style={S.errorText}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={S.retryBtn} activeOpacity={0.8}>
        <Text style={S.retryLabel}>ลองโหลดใหม่</Text>
      </TouchableOpacity>
    </View>
  )

  // ── data prep ──
  const radarData = [
    { label: "Wellness",  value: analytics?.avg_wellness        ?? 0 },
    { label: "Sleep",     value: analytics?.avg_sleep           ?? 0 },
    { label: "Activity",  value: analytics?.avg_activity        ?? 72 },
    { label: "Cardio",    value: analytics?.avg_cardiovascular  ?? 68 },
    { label: "Mental",    value: analytics?.avg_mental          ?? 65 },
    { label: "BMI",       value: analytics?.avg_bmi_score       ?? 70 },
  ]

  const segmentEntries = Object.entries(analytics?.segments ?? {})
  const totalUsers = analytics?.total_users ?? 0

  const namedSegments = segmentEntries
    .map(([key, count], i) => ({
      key,
      name:  SEGMENT_NAMES[Number(key)] ?? `กลุ่ม ${key}`,
      count: Number(count),
      color: SEGMENT_COLORS[i] ?? "#ccc",
    }))
    .sort((a, b) => b.count - a.count)

  const pieData = namedSegments.map(s => ({
    name: `${s.name} ${Math.round((s.count / totalUsers) * 100)}%`,
    population: s.count,
    color: s.color,
    legendFontColor: PALETTE.textMuted,
    legendFontSize: 11,
  }))

  const lineData = {
    labels: namedSegments.map(s => s.name.slice(0, 3)),
    datasets: [{
      data: namedSegments.length > 0 ? namedSegments.map(s => s.count) : [0],
      color: (o = 1) => `rgba(59,130,246,${o})`,
      strokeWidth: 2.5,
    }],
  }

  const chartCfg = {
  backgroundGradientFrom: PALETTE.surface,
  backgroundGradientTo:   PALETTE.surface,
  decimalPlaces: 0,
  color: (o = 1, index) => {
    const colors = [
      `rgba(59,130,246,${o})`,   // blue   - Wellness
      `rgba(56,189,248,${o})`,   // sky    - Sleep
      `rgba(16,185,129,${o})`,   // emerald - Activity
      `rgba(245,158,11,${o})`,   // amber  - Cardio
      `rgba(139,92,246,${o})`,   // purple - Mental
      `rgba(244,63,94,${o})`,    // rose   - BMI
    ]
    return colors[index ?? 0] ?? colors[0]
  },
  labelColor: () => PALETTE.textMuted,
  formatTopBarValue: v => v.toFixed(0),
  barPercentage: 0.65,
  useShadowColorFromDataset: false,
  fillShadowGradientOpacity: 0,
  propsForBackgroundLines: {
    strokeDasharray: "4,4",
    stroke: PALETTE.border,
    strokeWidth: 1,
  },
}

  const overallScore = radarData.reduce((s, d) => s + d.value, 0) / radarData.length
  const topSegment = namedSegments[0]

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PALETTE.accent} />
        }
      >
        {/* ── Hero Header ── */}
        <LinearGradient
          colors={[PALETTE.navy, PALETTE.navyMid, PALETTE.navyLight]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={S.hero}
        >
          <Text style={S.heroEyebrow}>POPULATION ANALYTICS</Text>
          <Text style={S.heroTitle}>Health Insights</Text>
          <Text style={S.heroSub}>
            ข้อมูลเชิงลึกจากผู้ใช้{" "}
            <Text style={{ color: "#4ADE80", fontWeight: "700" }}>
              {totalUsers.toLocaleString()}
            </Text>{" "}
            คน
          </Text>

          {/* KPI strip */}
          <View style={S.kpiStrip}>
            {[
              { label: "Avg Wellness", value: analytics?.avg_wellness?.toFixed(1) ?? "—", color: "#4ADE80" },
              { label: "Avg Sleep",    value: analytics?.avg_sleep?.toFixed(1)    ?? "—", color: PALETTE.sky },
              { label: "Avg Activity", value: (analytics?.avg_activity ?? 72).toFixed(1),  color: PALETTE.amber },
            ].map((m, i) => (
              <View key={m.label} style={[S.kpiItem, i > 0 && S.kpiDivider]}>
                <Text style={[S.kpiVal, { color: m.color }]}>{m.value}</Text>
                <Text style={S.kpiLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Summary Cards ── */}
        <View style={S.summaryRow}>
          {[
            { icon: "👥", value: totalUsers.toLocaleString(), label: "Total Users", color: PALETTE.accent },
            { icon: "💯", value: overallScore.toFixed(1),     label: "Avg Score",   color: scoreColor(overallScore) },
            { icon: "🏆", value: namedSegments.length,        label: "Segments",    color: PALETTE.purple },
          ].map(s => (
            <View key={s.label} style={S.summaryCard}>
              <Text style={S.summaryIcon}>{s.icon}</Text>
              <Text style={[S.summaryVal, { color: s.color }]}>{s.value}</Text>
              <Text style={S.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Health Radar ── */}
        <Card>
          <SectionHeader
            title="🕸️ Health Radar"
            subtitle="ภาพรวมสุขภาพ 6 ด้านของประชากร"
            badge="Live"
          />
          <RadarChart data={radarData} size={screenWidth - 112} />
          {/* mini legend below radar */}
          <View style={S.pillWrap}>
            {radarData.map(d => (
              <MetricPill key={d.label} label={d.label} value={d.value} color={scoreColor(d.value)} />
            ))}
          </View>
        </Card>

        {/* ── Health Scores ── */}
        <Card>
          <SectionHeader title="📋 Health Scores" subtitle="คะแนนเฉลี่ยแต่ละด้าน" />
          {radarData.map((d, i) => (
            <ScoreRow key={d.label} label={d.label} value={d.value} index={i} />
          ))}
          <View style={S.legendStrip}>
            {[
              { label: "ดีมาก ≥70",     color: PALETTE.emerald },
              { label: "ปานกลาง ≥50",   color: PALETTE.amber },
              { label: "ต้องปรับปรุง",  color: PALETTE.rose },
            ].map(l => (
              <View key={l.label} style={S.legendItem}>
                <View style={[S.legendDot, { backgroundColor: l.color }]} />
                <Text style={S.legendLabel}>{l.label}</Text>
              </View>
            ))}
          </View>
        </Card>

       {/* ── Bar Chart ── */}
<Card>
  <SectionHeader title="📊 Score Comparison" subtitle="เปรียบเทียบคะแนนทุกด้าน" />
  <View style={{ marginTop: 4 }}>
    {[
      { label: "Wellness", color: "#3B82F6" },
      { label: "Sleep",    color: "#38BDF8" },
      { label: "Activity", color: "#10B981" },
      { label: "Cardio",   color: "#F59E0B" },
      { label: "Mental",   color: "#8B5CF6" },
      { label: "BMI",      color: "#F43F5E" },
    ].map((item, i) => {
      const d = radarData[i]
      const pct = Math.min(d?.value ?? 0, 100)
      return (
        <View key={item.label} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: PALETTE.text }}>{item.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: item.color }}>{pct.toFixed(0)}</Text>
          </View>
          <View style={{ height: 10, backgroundColor: "rgba(148,163,184,0.15)", borderRadius: 5, overflow: "hidden" }}>
            <View style={{ height: 10, width: `${pct}%`, backgroundColor: item.color, borderRadius: 5 }} />
          </View>
        </View>
      )
    })}
  </View>
</Card>
        {/* ── User Segments ── */}
        <Card>
          <SectionHeader title="👥 User Segments" subtitle="การแบ่งกลุ่มตามพฤติกรรมสุขภาพ" />
          {pieData.length > 0 && (
            <PieChart
              data={pieData}
              width={screenWidth - 96}
              height={160}
              chartConfig={{ color: (o = 1) => `rgba(59,130,246,${o})` }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="8"
              style={{ borderRadius: 12, marginBottom: 8 }}
            />
          )}
          <View style={{ borderTopWidth: 0.5, borderTopColor: PALETTE.border, paddingTop: 16, marginTop: 4 }}>
            {namedSegments.map((s, i) => (
              <SegmentBar
                key={s.key}
                name={s.name}
                count={s.count}
                total={totalUsers}
                color={s.color}
                rank={i + 1}
              />
            ))}
          </View>
        </Card>

        {/* ── Segment Trend ── */}
<Card>
  <SectionHeader title="📈 Segment Trend" subtitle="จำนวนผู้ใช้ในแต่ละกลุ่ม" />

  {/* bars พร้อม gradient-style */}
  <View style={{ marginTop: 8, gap: 16 }}>
    {namedSegments.map((s, i) => {
      const maxCount = Math.max(...namedSegments.map(x => x.count), 1)
      const pct = (s.count / maxCount) * 100
      return (
        <View key={s.key}>
          {/* label row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: PALETTE.text }}>{s.name}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 12, color: PALETTE.textMuted }}>
                {Math.round((s.count / totalUsers) * 100)}%
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: s.color }}>
                {s.count.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* track */}
          <View style={{ height: 8, backgroundColor: "rgba(148,163,184,0.12)", borderRadius: 4, overflow: "hidden" }}>
            <View style={{
              height: 8, width: `${pct}%`,
              backgroundColor: s.color,
              borderRadius: 4,
              opacity: 0.9,
            }} />
          </View>
        </View>
      )
    })}
  </View>

  {/* summary row */}
  <View style={{
    flexDirection: "row", marginTop: 20, paddingTop: 16,
    borderTopWidth: 0.5, borderTopColor: PALETTE.border,
    justifyContent: "space-between",
  }}>
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "800", color: PALETTE.accent }}>
        {namedSegments.length}
      </Text>
      <Text style={{ fontSize: 10, color: PALETTE.textLight, marginTop: 2 }}>กลุ่ม</Text>
    </View>
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "800", color: PALETTE.emerald }}>
        {totalUsers.toLocaleString()}
      </Text>
      <Text style={{ fontSize: 10, color: PALETTE.textLight, marginTop: 2 }}>ผู้ใช้ทั้งหมด</Text>
    </View>
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 18, fontWeight: "800", color: PALETTE.purple }}>
        {namedSegments[0]
          ? `${Math.round((namedSegments[0].count / totalUsers) * 100)}%`
          : "—"}
      </Text>
      <Text style={{ fontSize: 10, color: PALETTE.textLight, marginTop: 2 }}>กลุ่มใหญ่สุด</Text>
    </View>
  </View>
</Card>

        {/* ── AI Insight ── */}
        <View style={S.insightCard}>
          <View style={S.insightBadge}>
            <Text style={S.insightBadgeText}>AI Insight</Text>
          </View>
          <Text style={S.insightHeadline}>
            {analytics?.avg_wellness >= 70
              ? `ประชากร ${totalUsers.toLocaleString()} คนมีสุขภาพโดยรวมอยู่ในเกณฑ์ดี`
              : `ประชากรส่วนใหญ่ควรปรับปรุงการนอนและออกกำลังกาย`}
          </Text>
          {topSegment && (
            <Text style={S.insightBody}>
              กลุ่มผู้ใช้ที่ใหญ่ที่สุดคือ{" "}
              <Text style={{ fontWeight: "700", color: topSegment.color }}>
                {topSegment.name}
              </Text>
              {" "}คิดเป็น {Math.round((topSegment.count / totalUsers) * 100)}% ของผู้ใช้ทั้งหมด
            </Text>
          )}
          <View style={S.insightDivider} />
          <View style={S.pillWrap}>
            {radarData.map(d => (
              <MetricPill key={d.label} label={d.label} value={d.value} color={scoreColor(d.value)} />
            ))}
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  )
}

const S = StyleSheet.create({
  center: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: PALETTE.bg, padding: 24,
  },
  loadingRing: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: PALETTE.accentSoft,
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
    borderWidth: 2, borderColor: PALETTE.accent + "30",
  },
  loadingTitle: { fontSize: 16, fontWeight: "700", color: PALETTE.text },
  loadingDesc:  { fontSize: 13, color: PALETTE.textMuted, marginTop: 4 },
  errorIcon:  { width: 76, height: 76, borderRadius: 38, backgroundColor: PALETTE.rose + "15", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  errorText:  { color: PALETTE.rose, fontSize: 14, textAlign: "center", marginBottom: 16, lineHeight: 22 },
  retryBtn:   { backgroundColor: PALETTE.accent, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 },
  retryLabel: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // Hero
  hero:         { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 36 },
  heroEyebrow:  { color: "rgba(255,255,255,0.45)", fontSize: 10, letterSpacing: 2, marginBottom: 6, fontWeight: "600" },
  heroTitle:    { color: "#fff", fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  heroSub:      { color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 6, lineHeight: 22 },
  kpiStrip:     { flexDirection: "row", marginTop: 24, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" },
  kpiItem:      { flex: 1, paddingVertical: 16, alignItems: "center" },
  kpiDivider:   { borderLeftWidth: 0.5, borderLeftColor: "rgba(255,255,255,0.15)" },
  kpiVal:       { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  kpiLabel:     { color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 4, fontWeight: "500" },

  // Summary
  summaryRow:  { flexDirection: "row", marginHorizontal: 16, marginTop: 16, marginBottom: 4, gap: 8 },
  summaryCard: {
    flex: 1, backgroundColor: PALETTE.surface,
    borderRadius: 16, padding: 14, alignItems: "center",
    borderWidth: 0.5, borderColor: PALETTE.border,
    shadowColor: "#0B1D3A", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryIcon:  { fontSize: 20, marginBottom: 6 },
  summaryVal:   { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  summaryLabel: { color: PALETTE.textLight, fontSize: 10, marginTop: 3, fontWeight: "500" },

  // Misc
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 },

  legendStrip: { flexDirection: "row", gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: PALETTE.border },
  legendItem:  { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: PALETTE.textMuted },

  // Insight card
  insightCard: {
    backgroundColor: PALETTE.accentSoft,
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 20, padding: 20,
    borderWidth: 0.5, borderColor: PALETTE.accent + "30",
    borderLeftWidth: 3, borderLeftColor: PALETTE.accent,
  },
  insightBadge: {
    alignSelf: "flex-start",
    backgroundColor: PALETTE.accent,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 12,
  },
  insightBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  insightHeadline:  { fontSize: 15, fontWeight: "700", color: PALETTE.text, lineHeight: 24 },
  insightBody:      { fontSize: 13, color: PALETTE.textMuted, marginTop: 6, lineHeight: 22 },
  insightDivider:   { height: 0.5, backgroundColor: PALETTE.accent + "25", marginVertical: 14 },
})
