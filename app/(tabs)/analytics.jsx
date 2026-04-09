import { useEffect, useState } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions, RefreshControl
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BarChart, PieChart, LineChart } from "react-native-chart-kit"
import { Colors } from "../../constants/colors"
import { fetchWithCache } from "../../services/cache"

const BASE_URL = "https://healthy-ai.onrender.com"

// ── Segment name mapping ─────────────────────────────────────────────────────
// ปรับชื่อให้ตรงกับ segment จริงจาก API ได้ที่นี่
const SEGMENT_NAMES = {
  0: "นักวิ่ง",
  1: "คนรักสุขภาพ",
  2: "กำลังพัฒนา",
  3: "เริ่มต้นใหม่",
}

const SEGMENT_COLORS = [
  Colors.primary,
  Colors.primaryLight,
  Colors.success,
  "#8b5cf6",
]

// ── Radar Chart (SVG custom) ─────────────────────────────────────────────────
function RadarChart({ data, size = 220 }) {
  const cx = size / 2
  const cy = size / 2
  const r  = size * 0.36
  const n  = data.length

  const angleOf = (i) => (Math.PI * 2 * i) / n - Math.PI / 2

  const point = (i, radius) => ({
    x: cx + radius * Math.cos(angleOf(i)),
    y: cy + radius * Math.sin(angleOf(i)),
  })

  // grid rings
  const rings = [0.25, 0.5, 0.75, 1].map((pct) => {
    const pts = data.map((_, i) => point(i, r * pct))
    return pts.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z"
  })

  // data polygon
  const dataPts = data.map((d, i) => point(i, r * (d.value / 100)))
  const dataPath = dataPts
    .map((p, j) => `${j === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ") + " Z"

  // axis lines
  const axes = data.map((_, i) => ({ from: { x: cx, y: cy }, to: point(i, r) }))

  return (
    <View style={{ alignItems: "center", marginTop: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* grid rings */}
        {rings.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={Colors.border} strokeWidth="1" />
        ))}
        {/* axis lines */}
        {axes.map((a, i) => (
          <line
            key={i}
            x1={a.from.x} y1={a.from.y}
            x2={a.to.x}   y2={a.to.y}
            stroke={Colors.border} strokeWidth="1"
          />
        ))}
        {/* data polygon */}
        <path
          d={dataPath}
          fill={`${Colors.primaryLight}40`}
          stroke={Colors.primaryLight}
          strokeWidth="2"
        />
        {/* dots */}
        {dataPts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={Colors.primary} />
        ))}
        {/* labels */}
        {data.map((d, i) => {
          const lp = point(i, r + 20)
          return (
            <text
              key={i}
              x={lp.x} y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill={Colors.text}
            >
              {d.label}
            </text>
          )
        })}
        {/* value labels on dots */}
        {dataPts.map((p, i) => (
          <text
            key={`v${i}`}
            x={p.x}
            y={p.y - 8}
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill={Colors.primary}
          >
            {data[i].value.toFixed(0)}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <View style={radarStyles.legend}>
        {data.map((d, i) => (
          <View key={i} style={radarStyles.legendItem}>
            <View style={[radarStyles.legendDot, { backgroundColor: getRadarColor(d.value) }]} />
            <Text style={radarStyles.legendLabel}>{d.label}</Text>
            <Text style={[radarStyles.legendVal, { color: getRadarColor(d.value) }]}>
              {d.value.toFixed(1)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const getRadarColor = (v) =>
  v >= 70 ? Colors.success : v >= 50 ? Colors.warning : Colors.danger

const radarStyles = StyleSheet.create({
  legend: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 10, marginTop: 8,
  },
  legendItem: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.background,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  legendDot:   { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: Colors.text, fontSize: 11 },
  legendVal:   { fontWeight: "bold", fontSize: 11 },
})

// ── Segment Card ─────────────────────────────────────────────────────────────
function SegmentCard({ name, count, total, color, rank }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <View style={segStyles.card}>
      <View style={segStyles.left}>
        <View style={[segStyles.rank, { backgroundColor: color + "22" }]}>
          <Text style={[segStyles.rankText, { color }]}>#{rank}</Text>
        </View>
        <View>
          <Text style={segStyles.name}>{name}</Text>
          <Text style={segStyles.count}>{count.toLocaleString()} คน</Text>
        </View>
      </View>
      <View style={segStyles.right}>
        <Text style={[segStyles.pct, { color }]}>{pct}%</Text>
        <View style={segStyles.barBg}>
          <View style={[segStyles.barFg, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  )
}

const segStyles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  left:     { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rank: {
    width: 32, height: 32, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  rankText: { fontWeight: "800", fontSize: 12 },
  name:     { color: Colors.text, fontWeight: "600", fontSize: 14 },
  count:    { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  right:    { alignItems: "flex-end", gap: 4, minWidth: 80 },
  pct:      { fontWeight: "bold", fontSize: 15 },
  barBg: {
    width: 72, height: 5, backgroundColor: Colors.border,
    borderRadius: 3, overflow: "hidden",
  },
  barFg: { height: 5, borderRadius: 3 },
})

// ── Main Component ───────────────────────────────────────────────────────────
export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]         = useState(null)
  const screenWidth = Dimensions.get("window").width

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setError(null)
    try {
      const a = await fetchWithCache(`${BASE_URL}/analytics`, 60000)
      setAnalytics(a)
    } catch { setError("ไม่สามารถโหลดข้อมูลได้") }
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true); await fetchData(); setRefreshing(false)
  }

  if (loading && !analytics) return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIconWrap}>
        <Text style={{ fontSize: 36 }}>📊</Text>
      </View>
      <Text style={styles.loadingText}>กำลังโหลด...</Text>
    </View>
  )

  if (error) return (
    <View style={styles.loadingContainer}>
      <Text style={{ color: Colors.danger, marginBottom: 12 }}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>🔄 ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  )

  // ── Data preparation ────────────────────────────────────────────────────

  // Radar: 6 metrics (ใช้ avg_* จาก API + fallback)
  const radarData = [
    { label: "Wellness", value: analytics?.avg_wellness         ?? 0 },
    { label: "Sleep",    value: analytics?.avg_sleep            ?? 0 },
    { label: "Activity", value: analytics?.avg_activity         ?? 72 },
    { label: "Cardio",   value: analytics?.avg_cardiovascular   ?? 68 },
    { label: "Mental",   value: analytics?.avg_mental           ?? 65 },
    { label: "BMI",      value: analytics?.avg_bmi_score        ?? 70 },
  ]

  // Bar: 6 metrics (same source)
  const barData = {
    labels: ["Well", "Sleep", "Act", "Cardio", "Mental", "BMI"],
    datasets: [{
      data: radarData.map(d => d.value),
    }],
  }

  // Segments — named
  const segmentEntries = Object.entries(analytics?.segments ?? {})
  const totalUsers = analytics?.total_users ?? 0

  const namedSegments = segmentEntries.map(([key, count], i) => ({
    key,
    name:  SEGMENT_NAMES[Number(key)] ?? `กลุ่ม ${key}`,
    count: Number(count),
    color: SEGMENT_COLORS[i] ?? "#ccc",
  })).sort((a, b) => b.count - a.count)

  // Pie data (react-native-chart-kit format)
  const pieData = namedSegments.map((s) => ({
    name: `${s.name} ${Math.round((s.count / totalUsers) * 100)}%`,
    population: s.count,
    color: s.color,
    legendFontColor: Colors.text,
    legendFontSize: 11,
  }))

  // Line — segment distribution
  const lineData = {
    labels: namedSegments.map(s => s.name.slice(0, 4)),
    datasets: [{
      data: namedSegments.map(s => s.count),
      color: (opacity = 1) => `rgba(27,58,107,${opacity})`,
      strokeWidth: 2,
    }],
  }

  const summaryItems = [
    { label: "Total Users",  value: analytics?.total_users,            emoji: "👥" },
    { label: "Avg Wellness", value: analytics?.avg_wellness?.toFixed(1), emoji: "💚" },
    { label: "Avg Sleep",    value: analytics?.avg_sleep?.toFixed(1),    emoji: "😴" },
  ]

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
          <Text style={styles.greeting}>ภาพรวมทั้งหมด</Text>
          <Text style={styles.headerTitle}>Population Analytics</Text>
          <Text style={styles.headerSub}>ข้อมูลจากผู้ใช้ {analytics?.total_users ?? "—"} คน</Text>
        </LinearGradient>

        {/* ── Summary Cards ─────────────────────────────────────────── */}
        <View style={styles.summaryRow}>
          {summaryItems.map((s) => (
            <View key={s.label} style={styles.summaryCard}>
              <Text style={styles.summaryEmoji}>{s.emoji}</Text>
              <Text style={styles.summaryValue}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Radar Chart — ใหม่ ────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🕸️ Health Radar</Text>
          <Text style={styles.cardSub}>ภาพรวมสุขภาพทั้ง 6 ด้านของประชากร</Text>
          <RadarChart data={radarData} size={Dimensions.get("window").width - 96} />
        </View>

        {/* ── Bar Chart — 6 metrics แทน 2 ──────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Average Health Scores</Text>
          <Text style={styles.cardSub}>เปรียบเทียบคะแนนเฉลี่ยทุกด้าน</Text>
          <BarChart
            data={barData}
            width={screenWidth - 64}
            height={220}
            fromZero
            showValuesOnTopOfBars
            yAxisSuffix=""
            chartConfig={{
              backgroundGradientFrom: Colors.card,
              backgroundGradientTo:   Colors.card,
              decimalPlaces: 1,
              color: (opacity = 1, index) => {
                // สีแต่ละแท่งตาม score level
                const v = radarData[index ?? 0]?.value ?? 0
                return v >= 70
                  ? `rgba(29,158,117,${opacity})`
                  : v >= 50
                  ? `rgba(186,117,23,${opacity})`
                  : `rgba(163,45,45,${opacity})`
              },
              labelColor:        () => Colors.text,
              formatTopBarValue: (v) => v.toFixed(0),
            }}
            style={{ borderRadius: 12, marginTop: 12 }}
          />
          {/* Color legend */}
          <View style={styles.barLegend}>
            {[
              { label: "ดี (≥70)",    color: Colors.success },
              { label: "พอใช้ (≥50)", color: Colors.warning },
              { label: "ต้องปรับ",    color: Colors.danger },
            ].map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendLabel}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Segments — named ─────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 User Segments</Text>
          <Text style={styles.cardSub}>การแบ่งกลุ่มผู้ใช้ตามพฤติกรรมสุขภาพ</Text>

          {/* Pie chart */}
          {pieData.length > 0 && (
            <PieChart
              data={pieData}
              width={screenWidth - 64}
              height={180}
              chartConfig={{ color: (o = 1) => `rgba(27,58,107,${o})` }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="12"
              style={{ borderRadius: 12, marginTop: 8 }}
            />
          )}

          {/* Named segment cards — แทน Seg 0/1/2/3 */}
          <View style={{ marginTop: 8 }}>
            {namedSegments.map((s, i) => (
              <SegmentCard
                key={s.key}
                name={s.name}
                count={s.count}
                total={totalUsers}
                color={s.color}
                rank={i + 1}
              />
            ))}
          </View>
        </View>

        {/* ── Line Chart — segment distribution ────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📉 Segment Distribution</Text>
          <Text style={styles.cardSub}>จำนวนผู้ใช้ในแต่ละกลุ่ม</Text>
          <LineChart
            data={lineData}
            width={screenWidth - 64}
            height={180}
            chartConfig={{
              backgroundGradientFrom: Colors.card,
              backgroundGradientTo:   Colors.card,
              decimalPlaces: 0,
              color: (o = 1) => `rgba(27,58,107,${o})`,
              labelColor: () => Colors.text,
              propsForDots: { r: "5", strokeWidth: "2", stroke: Colors.primary },
            }}
            bezier
            style={{ borderRadius: 12, marginTop: 8 }}
          />
        </View>

        {/* ── AI Insight ───────────────────────────────────────────── */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightDot} />
            <Text style={styles.insightTitle}>AI Insight</Text>
          </View>
          <Text style={styles.insightText}>
            {analytics?.avg_wellness >= 70
              ? `ผู้ใช้ ${analytics?.total_users} คน มีสุขภาพโดยรวมดี คะแนนเฉลี่ย ${analytics?.avg_wellness?.toFixed(1)}/100 ครับ`
              : "ผู้ใช้ส่วนใหญ่ควรปรับปรุงด้านการนอนและออกกำลังกายให้มากขึ้นครับ"}
          </Text>
          {namedSegments[0] && (
            <Text style={[styles.insightText, { marginTop: 8 }]}>
              กลุ่มใหญ่สุดคือ{" "}
              <Text style={{ fontWeight: "bold", color: Colors.primary }}>
                {namedSegments[0].name}
              </Text>
              {" "}คิดเป็น{" "}
              {Math.round((namedSegments[0].count / totalUsers) * 100)}%
              ของผู้ใช้ทั้งหมด
            </Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.accentLight,
    justifyContent: "center", alignItems: "center", marginBottom: 14,
  },
  loadingText: { color: Colors.primary, fontWeight: "bold", fontSize: 15 },
  retryBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },

  header: { padding: 24, paddingTop: 52, paddingBottom: 36 },
  greeting:   { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginTop: 2 },
  headerSub:  { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 },

  summaryRow: { flexDirection: "row", margin: 16, gap: 10 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 14,
    alignItems: "center", elevation: 3, borderWidth: 0.5, borderColor: Colors.border,
  },
  summaryEmoji: { fontSize: 22, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: "bold", color: Colors.primary },
  summaryLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 3, textAlign: "center" },

  card: {
    backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 18, elevation: 2,
    borderWidth: 0.5, borderColor: Colors.border,
  },
  cardTitle: { color: Colors.text, fontWeight: "bold", fontSize: 14 },
  cardSub:   { color: Colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: 4 },

  // Bar chart legend
  barLegend: { flexDirection: "row", gap: 14, marginTop: 12, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: Colors.textMuted, fontSize: 11 },

  insightCard: {
    backgroundColor: Colors.accentLight, marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border,
  },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  insightDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryLight },
  insightTitle:  { color: Colors.primary, fontWeight: "bold", fontSize: 13 },
  insightText:   { color: Colors.text, lineHeight: 22, fontSize: 13 },
})