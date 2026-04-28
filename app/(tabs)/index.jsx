import { useEffect, useState, useRef } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Dimensions,
  RefreshControl, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import Svg, { Circle, Rect, Line, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop, G, Path } from "react-native-svg"
import { useRouter } from "expo-router"
import { Colors } from "../../constants/colors"
import { fetchWithCache } from "../../services/cache"
import { BASE_URL } from "../../config/api"
import { validateWellnessResult } from "../../services/validation"
import DailyTip from "../../components/DailyTip"
import { HealthTrendCard, MonthComparisonCard } from "../../components/HealthWidgets"
import {
  saveHealthRecord,
  getHealthHistory,
  getMonthlySummary,
  getScoreTrend,
  deleteHealthRecord,
  clearHealthHistory,
} from "../../services/healthHistory"

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const { width: SCREEN_W } = Dimensions.get("window")

// ─── CUSTOM BAR CHART ─────────────────────────────────────────────────────────
function ProBarChart({ data }) {
  const chartW = SCREEN_W - 64
  const chartH = 220
  const padL = 10
  const padR = 10
  const padT = 32
  const padB = 48
  const plotW = chartW - padL - padR
  const plotH = chartH - padT - padB
  const maxVal = 100
  const barCount = data.labels.length
  const groupW = plotW / barCount
  const barW = Math.min(groupW * 0.45, 36)

  const METRIC_COLORS = ["#38bdf8", "#34d399", "#f472b6", "#a78bfa"]
  const METRIC_GRADIENTS = [
    ["#0ea5e9", "#38bdf8"],
    ["#10b981", "#34d399"],
    ["#ec4899", "#f472b6"],
    ["#8b5cf6", "#a78bfa"],
  ]

  const gridLines = [0, 25, 50, 75, 100]

  return (
    <Svg width={chartW} height={chartH}>
      <Defs>
        {METRIC_GRADIENTS.map(([start, end], i) => (
          <SvgGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={start} stopOpacity="1" />
            <Stop offset="1" stopColor={end} stopOpacity="0.6" />
          </SvgGradient>
        ))}
      </Defs>

      {gridLines.map((val) => {
        const y = padT + plotH - (val / maxVal) * plotH
        return (
          <G key={val}>
            <Line
              x1={padL} y1={y}
              x2={padL + plotW} y2={y}
              stroke={val === 0 ? "rgba(100,120,150,0.4)" : "rgba(100,120,150,0.12)"}
              strokeWidth={val === 0 ? 1.5 : 1}
              strokeDasharray={val === 0 ? "" : "4,4"}
            />
            {val > 0 && (
              <SvgText
                x={padL - 6}
                y={y + 4}
                fontSize="10"
                fill="rgba(120,140,170,0.7)"
                textAnchor="end"
              >
                {val}
              </SvgText>
            )}
          </G>
        )
      })}

      {data.labels.map((label, i) => {
        const val = data.datasets[0].data[i]
        const barH = (val / maxVal) * plotH
        const cx = padL + groupW * i + groupW / 2
        const barX = cx - barW / 2
        const barY = padT + plotH - barH
        const color = METRIC_COLORS[i % METRIC_COLORS.length]

        return (
          <G key={label}>
            <Rect
              x={barX} y={padT}
              width={barW} height={plotH}
              rx={barW / 2} ry={barW / 2}
              fill="rgba(100,120,150,0.08)"
            />
            <Rect
              x={barX} y={barY}
              width={barW} height={barH}
              rx={barW / 2} ry={barW / 2}
              fill={`url(#barGrad${i})`}
            />
            <SvgText
              x={cx} y={barY - 8}
              fontSize="12" fontWeight="700"
              fill={color} textAnchor="middle"
            >
              {val.toFixed(1)}
            </SvgText>
            <SvgText
              x={cx} y={padT + plotH + 20}
              fontSize="11" fill="rgba(120,140,170,0.9)"
              textAnchor="middle" fontWeight="500"
            >
              {label}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}

// ─── SCORE RING ───────────────────────────────────────────────────────────────
function ScoreRing({ score, displayScore, color }) {
  const size = 180
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 1400, useNativeDriver: false }).start()
  }, [score])

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  })

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size/2} cy={size/2} r={radius}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90" origin={`${size/2}, ${size/2}`}
        />
      </Svg>
      <Text style={ringStyles.score}>{displayScore.toFixed(1)}</Text>
      <Text style={ringStyles.slash}>/ 100</Text>
      <Text style={ringStyles.name}>Wellness Score</Text>
    </View>
  )
}

const ringStyles = StyleSheet.create({
  score: { color: "#fff", fontSize: 48, fontWeight: "800", lineHeight: 52 },
  slash: { color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 2 },
  name:  { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 5, letterSpacing: 0.5 },
})

// ─── METRIC MINI CARD ─────────────────────────────────────────────────────────
function MetricCard({ emoji, label, value, color, bgColor }) {
  const pct = Math.min(value, 100)
  return (
    <View style={[mCard.wrap, { borderTopWidth: 2, borderTopColor: color }]}>
      <View style={[mCard.iconBox, { backgroundColor: bgColor }]}>
        <Text style={{ fontSize: 18 }}>{emoji}</Text>
      </View>
      <Text style={mCard.label}>{label}</Text>
      <Text style={[mCard.val, { color }]}>{value.toFixed(1)}</Text>
      <View style={mCard.track}>
        <View style={[mCard.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}
const mCard = StyleSheet.create({
  wrap: {
    flex: 1, minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 16, padding: 16,
    shadowColor: "#1a3a6b", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    borderWidth: 0.5, borderColor: "rgba(200,215,240,0.6)",
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  label:   { color: "#8899bb", fontSize: 10, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  val:     { fontSize: 26, fontWeight: "800", marginTop: 2, marginBottom: 8 },
  track:   { height: 4, backgroundColor: "rgba(180,195,220,0.3)", borderRadius: 2 },
  fill:    { height: 4, borderRadius: 2 },
})

// ─── PROGRESS BAR ROW ─────────────────────────────────────────────────────────
function MetricBarRow({ label, score, getColor }) {
  const color = getColor(score)
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ color: "#334155", fontSize: 14, fontWeight: "500" }}>{label}</Text>
        <View style={[barRow.badge, { backgroundColor: color + "18" }]}>
          <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{score.toFixed(1)}</Text>
        </View>
      </View>
      <View style={barRow.track}>
        <View style={[barRow.fill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}
const barRow = StyleSheet.create({
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  track: { height: 8, backgroundColor: "rgba(180,195,220,0.25)", borderRadius: 4 },
  fill:  { height: 8, borderRadius: 4 },
})

// ─── FORM PROGRESS ────────────────────────────────────────────────────────────
function FormProgress({ step, total }) {
  const pct = Math.round((step / total) * 100)
  return (
    <View style={fProg.wrap}>
      <View style={fProg.header}>
        <Text style={fProg.label}>กรอกข้อมูลสุขภาพ</Text>
        <Text style={fProg.step}>{step} / {total}</Text>
      </View>
      <View style={fProg.track}>
        <View style={[fProg.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={fProg.pct}>{pct}%</Text>
    </View>
  )
}
const fProg = StyleSheet.create({
  wrap: {
    backgroundColor: "#fff", borderRadius: 20, padding: 18, marginBottom: 12,
    shadowColor: "#1a3a6b", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
    borderWidth: 0.5, borderColor: "rgba(200,215,240,0.5)",
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  label:  { color: "#334155", fontWeight: "600", fontSize: 14 },
  step:   { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  track:  { height: 6, backgroundColor: "rgba(180,195,220,0.3)", borderRadius: 3, overflow: "hidden" },
  fill:   { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  pct:    { color: "#8899bb", fontSize: 11, marginTop: 8, textAlign: "right" },
})

// ─── HEALTH HISTORY SECTION ───────────────────────────────────────────────────
function HealthHistorySection({ history, loading, showHistory, setShowHistory, onDelete, onClear, getScoreColor }) {
  if (loading) return (
    <View style={hS.wrap}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  )
  if (!history || history.length === 0) return null

  return (
    <View style={hS.wrap}>
      <TouchableOpacity
        style={hS.header}
        onPress={() => setShowHistory(!showHistory)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={hS.headerIcon}>📋</Text>
          <Text style={hS.headerTitle}>ประวัติสุขภาพ</Text>
          <View style={hS.countBadge}>
            <Text style={hS.countText}>{history.length}</Text>
          </View>
        </View>
        <Text style={hS.chevron}>{showHistory ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {showHistory && (
        <>
          {history.map((record, index) => (
            <HistoryRecordCard
              key={record.id}
              record={record}
              index={index}
              onDelete={onDelete}
              getScoreColor={getScoreColor}
            />
          ))}
          {history.length > 0 && (
            <TouchableOpacity style={hS.clearBtn} onPress={onClear} activeOpacity={0.7}>
              <Text style={hS.clearBtnText}>🗑️ ลบประวัติทั้งหมด</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  )
}

function HistoryRecordCard({ record, index, onDelete, getScoreColor }) {
  const score = record.scores?.overall ?? 0
  const color = getScoreColor(score)
  const isLatest = index === 0

  return (
    <View style={[hS.recordCard, isLatest && hS.recordCardLatest]}>
      {isLatest && (
        <View style={hS.latestBadge}>
          <Text style={hS.latestBadgeText}>ล่าสุด</Text>
        </View>
      )}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={hS.dateText}>{record.date}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            <Text style={[hS.scoreText, { color }]}>{score.toFixed(1)}</Text>
            <Text style={{ color: "#8899bb", fontSize: 11 }}>/ 100</Text>
            {record.bmi_category && (
              <View style={[hS.bmiBadge, { backgroundColor: color + "15" }]}>
                <Text style={{ color, fontSize: 10, fontWeight: "600" }}>BMI {record.bmi} · {record.bmi_category}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => onDelete(record.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: "#ef4444", fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={hS.pillRow}>
        {[
          { label: "😴", val: record.scores?.sleep    ?? 0 },
          { label: "🏃", val: record.scores?.activity ?? 0 },
          { label: "❤️", val: record.scores?.cardio   ?? 0 },
          { label: "🧠", val: record.scores?.mental   ?? 0 },
        ].map((m, i) => (
          <View key={i} style={[hS.pill, { backgroundColor: getScoreColor(m.val) + "12" }]}>
            <Text style={{ fontSize: 11 }}>{m.label}</Text>
            <Text style={[hS.pillVal, { color: getScoreColor(m.val) }]}>{m.val.toFixed(0)}</Text>
          </View>
        ))}
      </View>

      <Text style={hS.formSummary}>
        {record.form?.age} ปี · {record.form?.weight} กก. · {record.form?.height} ซม. · นอน {record.form?.sleep_hours} ชม.
      </Text>
    </View>
  )
}

const hS = StyleSheet.create({
  wrap: { marginBottom: 12 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 8,
    borderWidth: 0.5, borderColor: "rgba(200,215,240,0.6)",
    shadowColor: "#1a3a6b", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  headerIcon:  { fontSize: 18 },
  headerTitle: { color: "#1e3a5f", fontWeight: "700", fontSize: 14 },
  chevron:     { color: "#8899bb", fontSize: 12 },
  countBadge:  { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  countText:   { color: "#fff", fontSize: 11, fontWeight: "700" },
  recordCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 8,
    borderWidth: 0.5, borderColor: "rgba(200,215,240,0.5)",
    shadowColor: "#1a3a6b", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  recordCardLatest: { borderColor: "rgba(99,102,241,0.3)", borderWidth: 1 },
  latestBadge:     { alignSelf: "flex-start", backgroundColor: "rgba(99,102,241,0.1)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 8 },
  latestBadgeText: { color: "#6366f1", fontSize: 10, fontWeight: "700" },
  dateText:    { color: "#8899bb", fontSize: 11 },
  scoreText:   { fontSize: 28, fontWeight: "800" },
  bmiBadge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pillRow:     { flexDirection: "row", gap: 6, marginTop: 10 },
  pill:        { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  pillVal:     { fontSize: 12, fontWeight: "700" },
  formSummary: { color: "#8899bb", fontSize: 11, marginTop: 8 },
  clearBtn:     { borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", marginTop: 4 },
  clearBtnText: { color: "#ef4444", fontWeight: "600", fontSize: 13 },
})

// ═════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab]     = useState("overview")
  const [userId, setUserId]           = useState(0)
  const [user, setUser]               = useState(null)
  const [analytics, setAnalytics]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [error, setError]             = useState(null)
  const [displayScore, setDisplayScore] = useState(0)
  const [tabBarHeight, setTabBarHeight] = useState(44)

  const [healthForm, setHealthForm]     = useState({ age: "", gender: "male", weight: "", height: "", sleep_hours: "", activity_level: 3 })
  const [healthResult, setHealthResult] = useState(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthError, setHealthError]   = useState(null)
  const [formSubmitted, setFormSubmitted] = useState(false)

  // ── History state ──
  const [history, setHistory]               = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [scoreTrend, setScoreTrend]         = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showHistory, setShowHistory]       = useState(false)

  const filledCount  = ["age","weight","height","sleep_hours"].filter(k => healthForm[k].trim() !== "").length
  const formProgress = Math.min(filledCount + 1, 4)
  const screenWidth  = SCREEN_W
  const fadeAnim     = useRef(new Animated.Value(0)).current
  const slideAnim    = useRef(new Animated.Value(24)).current
  const scoreAnim    = useRef(new Animated.Value(0)).current
  const pulseAnim    = useRef(new Animated.Value(1)).current
  const tabAnim      = useRef(new Animated.Value(0)).current
  const tabKeys      = ["overview","mystats","population"]

  // ── Load persisted form/result on mount ──
  useEffect(() => {
    const loadData = async () => {
      try {
        const [saved, savedResult] = await Promise.all([
          AsyncStorage.getItem("healthForm"),
          AsyncStorage.getItem("healthResult"),
        ])
        if (saved)       setHealthForm(JSON.parse(saved))
        if (savedResult) { setHealthResult(JSON.parse(savedResult)); setFormSubmitted(true) }
      } catch (err) { console.error("Error loading data:", err) }
    }
    loadData()
  }, [])

  useEffect(() => { fetchData() }, [userId])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 1400, useNativeDriver: true }),
    ])).start()
  }, [])

  useEffect(() => {
    if (user?.Overall_Wellness_Score) {
      Animated.timing(scoreAnim, { toValue: user.Overall_Wellness_Score, duration: 1200, useNativeDriver: false }).start()
      const id = scoreAnim.addListener(({ value }) => setDisplayScore(value))
      return () => scoreAnim.removeListener(id)
    }
  }, [user])

  useEffect(() => {
    const idx = tabKeys.indexOf(activeTab)
    Animated.spring(tabAnim, { toValue: idx, useNativeDriver: true, tension: 60, friction: 10 }).start()
  }, [activeTab])

  // ── Load history when mystats tab is active ──
  useEffect(() => {
    if (activeTab === "mystats") loadHistory()
  }, [activeTab])

  const loadHistory = async () => {
    setHistoryLoading(true)
    const [hist, monthly, trend] = await Promise.all([
      getHealthHistory(),
      getMonthlySummary(2),
      getScoreTrend("overall", 7),
    ])
    setHistory(hist)
    setMonthlySummary(monthly)
    setScoreTrend(trend)
    setHistoryLoading(false)
  }

  const fetchData = async () => {
    setError(null)
    try {
      const [u, a] = await Promise.all([
        fetchWithCache(`${BASE_URL}/user/${userId}`, 30000),
        fetchWithCache(`${BASE_URL}/analytics`, 60000),
      ])
      setUser(u); setAnalytics(a)
    } catch (err) { setError(`ไม่สามารถโหลดข้อมูลได้: ${err.message}`) }
    setLoading(false)
  }

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false) }

  const handleHealthSubmit = async () => {
    const { age, weight, height, sleep_hours } = healthForm
    if (!age || !weight || !height || !sleep_hours) { setHealthError("กรุณากรอกข้อมูลให้ครบครับ"); return }
    setHealthError(null); setHealthLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/calculate-wellness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: Number(age), weight: Number(weight), height: Number(height), sleep_hours: Number(sleep_hours), activity_level: healthForm.activity_level, gender: healthForm.gender }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`)
      const result = await res.json()
      validateWellnessResult(result)
      setHealthResult(result)
      setFormSubmitted(true)
      await AsyncStorage.setItem("healthForm", JSON.stringify(healthForm))
      await AsyncStorage.setItem("healthResult", JSON.stringify(result))
      await saveHealthRecord(healthForm, result)
      await loadHistory()
    } catch (err) { setHealthError(`ไม่สามารถเชื่อมต่อได้: ${err.message}`) }
    setHealthLoading(false)
  }

  const getScoreColor = (s) => s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444"
  const getScoreBg    = (s) => s >= 70 ? "rgba(16,185,129,0.10)" : s >= 50 ? "rgba(245,158,11,0.10)" : "rgba(239,68,68,0.10)"

  const rawScore  = user?.Overall_Wellness_Score ?? 0
  const avgScore  = analytics?.avg_wellness ?? 0
  const diff      = rawScore - avgScore
  const ringColor = rawScore >= 70 ? "#4ade80" : rawScore >= 50 ? "#fbbf24" : "#f87171"

  const metrics = [
    { label: "Sleep",    emoji: "😴", key: "Sleep_Health_Score" },
    { label: "Activity", emoji: "🏃", key: "Activity_Health_Score" },
    { label: "Cardio",   emoji: "❤️", key: "Cardiovascular_Health_Score" },
    { label: "Mental",   emoji: "🧠", key: "Mental_Health_Score" },
  ]

  const metricAvgMap = {
    Sleep_Health_Score:          analytics?.avg_sleep ?? avgScore,
    Activity_Health_Score:       avgScore,
    Cardiovascular_Health_Score: avgScore,
    Mental_Health_Score:         avgScore,
  }

  const activityLabels = { 1:"ไม่ค่อยขยับ 🛋️", 2:"เดินบ้าง 🚶", 3:"ออกกำลังกายบ้าง 🏋️", 4:"สม่ำเสมอ 🔥", 5:"หนักมาก 💪" }

  const tabWidth       = (screenWidth - 32) / 3
  const TAB_PADDING    = 3
  const indicatorWidth = tabWidth - TAB_PADDING * 2

  const chartData = {
    labels: ["Sleep","Activity","Cardio","Mental"],
    datasets: [{ data: metrics.map(m => user?.[m.key] ?? 0) }],
  }

  if (loading && !user) return (
    <View style={S.loadingContainer}>
      <View style={S.loadingIconWrap}><Text style={{ fontSize: 36 }}>🏥</Text></View>
      <Text style={S.loadingText}>กำลังโหลด...</Text>
      <Text style={S.loadingSubtext}>รอสักครู่นะครับ</Text>
    </View>
  )

  if (error) return (
    <View style={S.loadingContainer}>
      <Text style={{ color: "#ef4444", fontSize: 15, marginBottom: 20 }}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={S.retryBtn}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>🔄 ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: "#f0f4f8" }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          {/* ── HERO ── */}
          <LinearGradient colors={["#0f2c5c", "#1a4a8a", "#1d6fb5"]} style={S.header}>
            <View style={S.headerGrid} pointerEvents="none" />

            <View style={S.headerRow}>
              <View>
                <Text style={S.greeting}>สวัสดี 👋</Text>
                <Text style={S.headerTitle}>HealthyAI</Text>
              </View>
              <View style={S.userPill}>
                <TouchableOpacity onPress={() => setUserId(Math.max(0, userId - 1))} hitSlop={{ top:12,bottom:12,left:12,right:12 }}>
                  <Text style={S.pillArrow}>◀</Text>
                </TouchableOpacity>
                <Text style={S.pillId}>#{userId}</Text>
                <TouchableOpacity onPress={() => setUserId(userId + 1)} hitSlop={{ top:12,bottom:12,left:12,right:12 }}>
                  <Text style={S.pillArrow}>▶</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={S.ringWrap}>
              <ScoreRing score={rawScore} displayScore={displayScore} color={ringColor} />
            </View>

            <View style={S.heroMetricRow}>
              {[
                { label: "Sleep",    val: user?.Sleep_Health_Score ?? 0,    color: "#38bdf8" },
                { label: "Activity", val: user?.Activity_Health_Score ?? 0, color: "#34d399" },
                { label: "Mental",   val: user?.Mental_Health_Score ?? 0,   color: "#a78bfa" },
              ].map((m, i) => (
                <View key={m.label} style={[S.heroMetricItem, i > 0 && { borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.12)" }]}>
                  <Text style={[S.heroMetricVal, { color: m.color }]}>{m.val.toFixed(0)}</Text>
                  <Text style={S.heroMetricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>

            <View style={S.badgeRow}>
              <View style={[S.badge, { backgroundColor: diff >= 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)" }]}>
                <Text style={S.badgeText}>
                  {diff >= 0 ? `📈 +${diff.toFixed(1)} กว่าค่าเฉลี่ย` : `📉 ${diff.toFixed(1)} จากค่าเฉลี่ย`}
                </Text>
              </View>
              {analytics && (
                <View style={[S.badge, { backgroundColor: "rgba(255,255,255,0.10)" }]}>
                  <Text style={S.badgeText}>👥 {analytics.total_users} คน</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* ── TABS ── */}
          <View style={S.tabWrap}>
            <View style={S.tabBar} onLayout={(e) => setTabBarHeight(e.nativeEvent.layout.height)}>
              <Animated.View style={[S.tabIndicator, {
                width: indicatorWidth,
                height: tabBarHeight - TAB_PADDING * 2,
                top: TAB_PADDING,
                transform: [{ translateX: tabAnim.interpolate({ inputRange: [0,1,2], outputRange: [TAB_PADDING, tabWidth + TAB_PADDING, tabWidth * 2 + TAB_PADDING] }) }],
              }]} />
              {[
                { key: "overview",   label: "📊 Overview" },
                { key: "mystats",    label: "💚 My Stats" },
                { key: "population", label: "🌍 Compare" },
              ].map((t) => (
                <TouchableOpacity key={t.key} style={[S.tab, { width: tabWidth }]} onPress={() => setActiveTab(t.key)} activeOpacity={0.7}>
                  <Text style={[S.tabText, activeTab === t.key && S.tabTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ════ OVERVIEW ════ */}
            {activeTab === "overview" && (
              <View style={S.section}>
                <View style={S.insightCard}>
                  <View style={S.insightHeader}>
                    <View style={S.insightDot} />
                    <Text style={S.insightTitle}>AI Insight</Text>
                  </View>
                  <Text style={S.insightText}>
                    {rawScore >= 70
                      ? "สุขภาพโดยรวมของคุณอยู่ในเกณฑ์ดีมาก รักษาพฤติกรรมนี้ต่อไปนะครับ 💪"
                      : "ควรเพิ่มคุณภาพการนอนและกิจกรรมเพื่อเพิ่มคะแนนสุขภาพครับ"}
                  </Text>
                </View>

                <Text style={S.sectionTitle}>Health Metrics</Text>
                <View style={S.metricsGrid}>
                  {metrics.map((m) => {
                    const val = user?.[m.key] ?? 0
                    return (
                      <MetricCard key={m.key} emoji={m.emoji} label={m.label}
                        value={val} color={getScoreColor(val)} bgColor={getScoreBg(val)} />
                    )
                  })}
                </View>

                <View style={S.card}>
                  <View style={S.cardHeaderRow}>
                    <Text style={S.cardTitle}>📈 Health Overview</Text>
                    <View style={S.chartLegend}>
                      {["Sleep","Activity","Cardio","Mental"].map((l, i) => {
                        const cols = ["#38bdf8","#34d399","#f472b6","#a78bfa"]
                        return (
                          <View key={l} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cols[i] }} />
                            <Text style={{ color: "#8899bb", fontSize: 10 }}>{l}</Text>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                  <View style={{ marginTop: 16, alignItems: "center" }}>
                    <ProBarChart data={chartData} />
                  </View>
                </View>
              </View>
            )}

            {/* ════ MY STATS ════ */}
            {activeTab === "mystats" && (
              <View style={S.section}>
                {!formSubmitted ? (
                  <>
                    <FormProgress step={formProgress} total={4} />
                    <View style={S.infoCard}>
                      <Text style={S.infoText}>
                        กรอกข้อมูลของคุณ AI จะวิเคราะห์และเปรียบเทียบกับผู้ใช้กว่า{" "}
                        <Text style={{ fontWeight: "700", color: Colors.primary }}>1,000 คน</Text>
                      </Text>
                    </View>

                    <View style={S.card}>
                      <Text style={S.cardTitle}>เพศ</Text>
                      <View style={S.genderRow}>
                        {[{ key:"male",emoji:"👨",label:"ชาย" },{ key:"female",emoji:"👩",label:"หญิง" }].map((g) => (
                          <TouchableOpacity key={g.key}
                            style={[S.genderBtn, healthForm.gender === g.key && S.genderBtnActive]}
                            onPress={() => setHealthForm({ ...healthForm, gender: g.key })}
                            activeOpacity={0.7}
                          >
                            <Text style={S.genderEmoji}>{g.emoji}</Text>
                            <Text style={[S.genderText, healthForm.gender === g.key && { color: Colors.primary, fontWeight: "700" }]}>{g.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={S.card}>
                      {[
                        { label: "อายุ (ปี)",               key: "age",         placeholder: "เช่น 25" },
                        { label: "น้ำหนัก (กก.)",           key: "weight",      placeholder: "เช่น 65" },
                        { label: "ส่วนสูง (ซม.)",           key: "height",      placeholder: "เช่น 170" },
                        { label: "ชั่วโมงนอนเฉลี่ยต่อคืน", key: "sleep_hours", placeholder: "เช่น 7" },
                      ].map((f, i) => (
                        <View key={f.key} style={i > 0 ? { marginTop: 18 } : {}}>
                          <View style={S.fieldLabelRow}>
                            <Text style={S.fieldLabel}>{f.label}</Text>
                            {healthForm[f.key] !== "" && (
                              <View style={S.checkBadge}><Text style={S.checkBadgeText}>✓ บันทึก</Text></View>
                            )}
                          </View>
                          <TextInput
                            style={[S.input, healthForm[f.key] !== "" && S.inputFilled]}
                            placeholder={f.placeholder} placeholderTextColor="#aab4c8"
                            value={healthForm[f.key]}
                            onChangeText={(v) => setHealthForm({ ...healthForm, [f.key]: v })}
                            keyboardType="numeric" returnKeyType="next"
                          />
                        </View>
                      ))}
                    </View>

                    <View style={S.card}>
                      <Text style={S.cardTitle}>ระดับการออกกำลังกาย</Text>
                      <Text style={S.activitySelected}>{activityLabels[healthForm.activity_level]}</Text>
                      <View style={S.activityRow}>
                        {[1,2,3,4,5].map((lvl) => (
                          <TouchableOpacity key={lvl}
                            style={[S.activityBtn, healthForm.activity_level === lvl && S.activityBtnActive]}
                            onPress={() => setHealthForm({ ...healthForm, activity_level: lvl })}
                            activeOpacity={0.7}
                          >
                            <Text style={[S.activityBtnText, healthForm.activity_level === lvl && { color: "#fff" }]}>{lvl}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {healthError && (
                      <View style={S.errorCard}><Text style={S.errorText}>⚠️ {healthError}</Text></View>
                    )}

                    <TouchableOpacity style={[S.primaryBtn, healthLoading && { opacity: 0.6 }]}
                      onPress={handleHealthSubmit} disabled={healthLoading} activeOpacity={0.8}>
                      {healthLoading
                        ? <View style={{ flexDirection:"row",alignItems:"center",gap:10 }}>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={S.primaryBtnText}>AI กำลังวิเคราะห์...</Text>
                          </View>
                        : <Text style={S.primaryBtnText}>🔍 วิเคราะห์สุขภาพของฉัน</Text>}
                    </TouchableOpacity>

                    {/* ── ประวัติ (ถ้ามี แม้ยังไม่ submit ใหม่) ── */}
                    {history.length > 0 && (
                      <HealthHistorySection
                        history={history}
                        loading={historyLoading}
                        showHistory={showHistory}
                        setShowHistory={setShowHistory}
                        onDelete={async (id) => { await deleteHealthRecord(id); loadHistory() }}
                        onClear={async () => { await clearHealthHistory(); loadHistory() }}
                        getScoreColor={getScoreColor}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {/* ── Result score card ── */}
                    <LinearGradient colors={["#0f2c5c","#1a4a8a"]} style={S.resultScoreCard}>
                      <Text style={S.resultLabel}>Overall Wellness Score</Text>
                      <Text style={[S.resultBig, { color: ringColor }]}>{healthResult.overall_score}</Text>
                      <View style={[S.resultBadge, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                          ดีกว่า {healthResult.percentile}% ของผู้ใช้ {healthResult.total_users} คน
                        </Text>
                      </View>
                    </LinearGradient>

                    <View style={S.bmiRow}>
                      {[
                        { label: "⚖️ BMI", val: healthResult.bmi, sub: healthResult.bmi_category, subColor: healthResult.bmi_category === "ปกติ" ? "#10b981" : "#f59e0b" },
                        { label: "📊 ค่าเฉลี่ย", val: healthResult.avg_wellness, sub: "Population avg", subColor: "#8899bb" },
                      ].map((b) => (
                        <View key={b.label} style={[S.bmiCard, { flex: 1 }]}>
                          <Text style={S.bmiLabel}>{b.label}</Text>
                          <Text style={S.bmiVal}>{b.val}</Text>
                          <Text style={[S.bmiCat, { color: b.subColor }]}>{b.sub}</Text>
                        </View>
                      ))}
                    </View>

                    {/* ── Health Trend Cards ── */}
                    {scoreTrend.length >= 2 && (
                      <>
                        <Text style={S.sectionTitle}>Health Trends</Text>
                        {[
                          { key: "overall",  title: "Overall",  icon: "⭐", color: "#6366f1", field: "overall"  },
                          { key: "sleep",    title: "Sleep",    icon: "😴", color: "#38bdf8", field: "sleep"    },
                          { key: "activity", title: "Activity", icon: "🏃", color: "#34d399", field: "activity" },
                          { key: "mental",   title: "Mental",   icon: "🧠", color: "#a78bfa", field: "mental"   },
                        ].map((m) => {
                          const trendVals = history.slice(0, 7).map((r) => r.scores[m.field] ?? 0).reverse()
                          const latest    = trendVals[trendVals.length - 1] ?? 0
                          const prev      = trendVals[trendVals.length - 2] ?? latest
                          return (
                            <HealthTrendCard
                              key={m.key}
                              title={m.title}
                              score={latest}
                              history={trendVals}
                              icon={m.icon}
                              color={m.color}
                              change={latest - prev}
                            />
                          )
                        })}
                      </>
                    )}

                    {/* ── Month Comparison ── */}
                    {monthlySummary.length >= 2 && (
                      <MonthComparisonCard
                        currentMonth={monthlySummary[0]}
                        previousMonth={monthlySummary[1]}
                      />
                    )}
                    {monthlySummary.length === 1 && (
                      <MonthComparisonCard
                        currentMonth={monthlySummary[0]}
                        previousMonth={null}
                      />
                    )}

                    <View style={S.card}>
                      <Text style={S.cardTitle}>💪 Health Metrics</Text>
                      <View style={{ marginTop: 8 }}>
                        {[
                          { label: "😴 Sleep",    score: healthResult.sleep_score },
                          { label: "🏃 Activity", score: healthResult.activity_score },
                          { label: "❤️ Cardio",   score: healthResult.cardiovascular_score },
                          { label: "🧠 Mental",   score: healthResult.mental_score },
                        ].map((item) => (
                          <MetricBarRow key={item.label} label={item.label} score={item.score} getColor={getScoreColor} />
                        ))}
                      </View>
                    </View>

                    {healthResult.summary && (
                      <View style={S.insightCard}>
                        <Text style={S.insightTitle}>🤖 AI วิเคราะห์</Text>
                        <Text style={S.insightText}>{healthResult.summary}</Text>
                      </View>
                    )}

                    {healthResult.advice && (
                      <View style={S.adviceCard}>
                        <Text style={S.adviceTitle}>💡 คำแนะนำ</Text>
                        <Text style={{ color: "#334155", lineHeight: 24, fontSize: 14 }}>{healthResult.advice}</Text>
                      </View>
                    )}

                    {/* ── ประวัติสุขภาพ ── */}
                    <HealthHistorySection
                      history={history}
                      loading={historyLoading}
                      showHistory={showHistory}
                      setShowHistory={setShowHistory}
                      onDelete={async (id) => { await deleteHealthRecord(id); loadHistory() }}
                      onClear={async () => { await clearHealthHistory(); loadHistory() }}
                      getScoreColor={getScoreColor}
                    />

                    <TouchableOpacity style={S.ghostBtn}
                      onPress={async () => {
                        setFormSubmitted(false)
                        setHealthResult(null)
                        await AsyncStorage.removeItem("healthResult")
                      }}
                      activeOpacity={0.7}>
                      <Text style={S.ghostBtnText}>🔄 กรอกข้อมูลใหม่</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* ════ POPULATION ════ */}
            {activeTab === "population" && (
              <View style={S.section}>
                <LinearGradient colors={["#0f2c5c","#1a4a8a"]} style={S.compareCard}>
                  <Text style={[S.cardTitle, { color: "#fff", marginBottom: 16 }]}>เปรียบเทียบกับค่าเฉลี่ย</Text>
                  <View style={S.compareRow}>
                    <View style={{ alignItems: "center" }}>
                      <Text style={[S.compareVal, { color: "#4ade80" }]}>{rawScore.toFixed(1)}</Text>
                      <Text style={[S.compareLabel, { color: "rgba(255,255,255,0.6)" }]}>คะแนนของคุณ</Text>
                    </View>
                    <View style={S.vsCircle}><Text style={S.vsText}>VS</Text></View>
                    <View style={{ alignItems: "center" }}>
                      <Text style={[S.compareVal, { color: "rgba(255,255,255,0.7)" }]}>{avgScore.toFixed(1)}</Text>
                      <Text style={[S.compareLabel, { color: "rgba(255,255,255,0.5)" }]}>ค่าเฉลี่ยกลาง</Text>
                    </View>
                  </View>
                  <View style={[S.diffPill, { backgroundColor: diff >= 0 ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)" }]}>
                    <Text style={{ color: diff >= 0 ? "#4ade80" : "#f87171", fontWeight: "700" }}>
                      {diff >= 0 ? `📈 สูงกว่าค่าเฉลี่ย +${diff.toFixed(1)}` : `📉 ต่ำกว่าค่าเฉลี่ย ${diff.toFixed(1)}`}
                    </Text>
                  </View>
                </LinearGradient>

                {analytics && (
                  <>
                    <Text style={S.sectionTitle}>Population Stats</Text>
                    <View style={S.statsRow}>
                      {[
                        { label: "Avg Wellness", val: analytics.avg_wellness?.toFixed(1) },
                        { label: "Avg Sleep",    val: analytics.avg_sleep?.toFixed(1) },
                        { label: "Total Users",  val: analytics.total_users },
                      ].map((s) => (
                        <View key={s.label} style={S.statCard}>
                          <Text style={S.statVal}>{s.val}</Text>
                          <Text style={S.statLabel}>{s.label}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={S.card}>
                      <Text style={S.cardTitle}>📊 Metric vs Average</Text>
                      <View style={{ marginTop: 12 }}>
                        {metrics.map((m) => {
                          const myVal  = user?.[m.key] ?? 0
                          const avgVal = metricAvgMap[m.key] ?? avgScore
                          return (
                            <View key={m.key} style={{ marginBottom: 18 }}>
                              <View style={{ flexDirection:"row",justifyContent:"space-between",marginBottom:8 }}>
                                <Text style={{ color:"#334155",fontSize:14 }}>{m.emoji} {m.label}</Text>
                                <Text style={{ color:getScoreColor(myVal),fontWeight:"700",fontSize:13 }}>
                                  {myVal.toFixed(1)}{" "}
                                  <Text style={{ color:"#8899bb",fontWeight:"400" }}>/ avg {typeof avgVal==="number" ? avgVal.toFixed(1) : avgVal}</Text>
                                </Text>
                              </View>
                              <View style={S.dualBar}>
                                <View style={[S.dualBarFg, { width:`${myVal}%`, backgroundColor:getScoreColor(myVal) }]} />
                                <View style={[S.dualBarMark, { left:(screenWidth - 32 - 40) * (avgVal/100) }]} />
                              </View>
                            </View>
                          )
                        })}
                      </View>
                      <View style={{ flexDirection:"row",gap:16,marginTop:4 }}>
                        <View style={{ flexDirection:"row",alignItems:"center",gap:6 }}>
                          <View style={{ width:10,height:10,borderRadius:5,backgroundColor:"#10b981" }} />
                          <Text style={{ color:"#8899bb",fontSize:12 }}>คุณ</Text>
                        </View>
                        <View style={{ flexDirection:"row",alignItems:"center",gap:6 }}>
                          <View style={{ width:2,height:12,backgroundColor:"#8899bb" }} />
                          <Text style={{ color:"#8899bb",fontSize:12 }}>ค่าเฉลี่ย</Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </View>
            )}
          </Animated.View>
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* FAB */}
        <Animated.View style={[S.fabWrap, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity style={S.fab} onPress={() => router.push("/(tabs)/recommendations")} activeOpacity={0.85}>
            <Text style={{ fontSize: 26 }}>🤖</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

const S = StyleSheet.create({
  loadingContainer: { flex:1, justifyContent:"center", alignItems:"center", backgroundColor:"#f0f4f8" },
  loadingIconWrap:  { width:76,height:76,borderRadius:38,backgroundColor:"#e8eef8",justifyContent:"center",alignItems:"center",marginBottom:16 },
  loadingText:      { color:Colors.primary,fontWeight:"700",fontSize:16 },
  loadingSubtext:   { color:"#8899bb",fontSize:13,marginTop:4 },
  retryBtn:         { backgroundColor:Colors.primary,borderRadius:14,paddingHorizontal:28,paddingVertical:13 },

  header:       { padding:24,paddingTop:56,paddingBottom:44 },
  headerGrid:   { position:"absolute",top:0,left:0,right:0,bottom:0,opacity:0.04 },
  headerRow:    { flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start" },
  greeting:     { color:"rgba(255,255,255,0.6)",fontSize:13,letterSpacing:0.3 },
  headerTitle:  { color:"#fff",fontSize:26,fontWeight:"800",marginTop:2 },
  userPill:     { flexDirection:"row",alignItems:"center",backgroundColor:"rgba(255,255,255,0.12)",borderRadius:22,paddingHorizontal:14,paddingVertical:9,gap:10,borderWidth:0.5,borderColor:"rgba(255,255,255,0.18)" },
  pillArrow:    { color:"#fff",fontWeight:"700",fontSize:14 },
  pillId:       { color:"#fff",fontWeight:"700",fontSize:15,minWidth:32,textAlign:"center" },
  ringWrap:     { alignItems:"center",marginTop:32,marginBottom:8 },

  heroMetricRow:   { flexDirection:"row",marginTop:20,backgroundColor:"rgba(255,255,255,0.07)",borderRadius:16,overflow:"hidden",borderWidth:0.5,borderColor:"rgba(255,255,255,0.12)" },
  heroMetricItem:  { flex:1,paddingVertical:14,alignItems:"center" },
  heroMetricVal:   { fontSize:20,fontWeight:"800" },
  heroMetricLabel: { color:"rgba(255,255,255,0.5)",fontSize:10,marginTop:3,fontWeight:"500" },

  badgeRow: { flexDirection:"row",justifyContent:"center",gap:10,marginTop:16 },
  badge:    { borderRadius:22,paddingHorizontal:14,paddingVertical:8,borderWidth:0.5,borderColor:"rgba(255,255,255,0.15)" },
  badgeText:{ color:"#fff",fontSize:12,fontWeight:"600" },

  tabWrap:       { paddingHorizontal:16,marginTop:-22 },
  tabBar:        { flexDirection:"row",backgroundColor:"#fff",borderRadius:18,padding:3,borderWidth:0.5,borderColor:"rgba(200,215,240,0.6)",position:"relative",shadowColor:"#1a3a6b",shadowOffset:{width:0,height:4},shadowOpacity:0.08,shadowRadius:12,elevation:4 },
  tabIndicator:  { position:"absolute",backgroundColor:"#e8f0fb",borderRadius:14,borderWidth:0.5,borderColor:"rgba(200,215,240,0.8)" },
  tab:           { paddingVertical:13,alignItems:"center" },
  tabText:       { fontSize:12,color:"#8899bb",fontWeight:"600" },
  tabTextActive: { color:Colors.primary,fontWeight:"700" },

  section:      { paddingHorizontal:16,paddingTop:16 },
  sectionTitle: { color:"#8899bb",fontWeight:"700",fontSize:11,marginBottom:10,letterSpacing:1,textTransform:"uppercase" },

  card: {
    backgroundColor:"#fff",borderRadius:20,padding:20,marginBottom:12,
    shadowColor:"#1a3a6b",shadowOffset:{width:0,height:4},shadowOpacity:0.07,shadowRadius:12,elevation:3,
    borderWidth:0.5,borderColor:"rgba(200,215,240,0.5)",
  },
  cardHeaderRow: { flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start" },
  cardTitle:     { color:"#1e3a5f",fontWeight:"700",fontSize:14 },
  chartLegend:   { flexDirection:"row",flexWrap:"wrap",gap:8,maxWidth:"55%",justifyContent:"flex-end" },

  insightCard: {
    backgroundColor:"#eff6ff",borderRadius:20,padding:18,marginBottom:12,
    borderWidth:0.5,borderColor:"rgba(59,130,246,0.2)",
    borderLeftWidth:3,borderLeftColor:Colors.primary,
  },
  insightHeader: { flexDirection:"row",alignItems:"center",gap:8,marginBottom:8 },
  insightDot:    { width:8,height:8,borderRadius:4,backgroundColor:Colors.primary },
  insightTitle:  { color:Colors.primary,fontWeight:"700",fontSize:13 },
  insightText:   { color:"#334155",fontSize:13,lineHeight:22 },

  metricsGrid: { flexDirection:"row",flexWrap:"wrap",gap:10,marginBottom:12 },

  infoCard:  { backgroundColor:"#eff6ff",borderRadius:16,padding:16,marginBottom:12,borderLeftWidth:3,borderLeftColor:Colors.primary },
  infoText:  { color:"#334155",fontSize:13,lineHeight:22 },

  fieldLabelRow:  { flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:8 },
  fieldLabel:     { color:"#334155",fontWeight:"600",fontSize:14 },
  checkBadge:     { backgroundColor:"rgba(16,185,129,0.1)",borderRadius:20,paddingHorizontal:8,paddingVertical:3 },
  checkBadgeText: { color:"#10b981",fontSize:11,fontWeight:"700" },
  input:          { backgroundColor:"#f8fafc",borderRadius:14,padding:15,color:"#334155",borderWidth:1,borderColor:"rgba(200,215,240,0.8)",fontSize:15 },
  inputFilled:    { borderColor:Colors.primary,backgroundColor:"#eff6ff" },

  genderRow:       { flexDirection:"row",gap:10,marginTop:10 },
  genderBtn:       { flex:1,paddingVertical:16,borderRadius:14,borderWidth:1.5,borderColor:"rgba(200,215,240,0.8)",alignItems:"center",flexDirection:"row",justifyContent:"center",gap:8 },
  genderBtnActive: { borderColor:Colors.primary,backgroundColor:"#eff6ff" },
  genderEmoji:     { fontSize:20 },
  genderText:      { color:"#8899bb",fontWeight:"600",fontSize:15 },

  activitySelected: { color:Colors.primary,fontWeight:"700",fontSize:14,textAlign:"center",marginBottom:14,marginTop:8 },
  activityRow:      { flexDirection:"row",gap:8 },
  activityBtn:      { flex:1,paddingVertical:14,borderRadius:12,backgroundColor:"#f8fafc",alignItems:"center",borderWidth:1,borderColor:"rgba(200,215,240,0.8)" },
  activityBtnActive:{ backgroundColor:Colors.primary,borderColor:Colors.primary },
  activityBtnText:  { color:"#334155",fontWeight:"700",fontSize:15 },

  errorCard: { backgroundColor:"#fff1f1",borderRadius:14,padding:14,marginBottom:12,borderWidth:0.5,borderColor:"#fca5a5" },
  errorText: { color:"#ef4444",fontSize:13 },

  primaryBtn:     { backgroundColor:Colors.primary,borderRadius:18,padding:18,alignItems:"center",marginBottom:12,shadowColor:Colors.primary,shadowOffset:{width:0,height:6},shadowOpacity:0.3,shadowRadius:12,elevation:5 },
  primaryBtnText: { color:"#fff",fontWeight:"700",fontSize:16 },
  ghostBtn:       { backgroundColor:"#fff",borderRadius:18,padding:16,alignItems:"center",marginBottom:12,borderWidth:1.5,borderColor:"rgba(200,215,240,0.8)" },
  ghostBtnText:   { color:Colors.primary,fontWeight:"700",fontSize:15 },

  resultScoreCard: { borderRadius:24,padding:32,alignItems:"center",marginBottom:12,shadowColor:"#0f2c5c",shadowOffset:{width:0,height:8},shadowOpacity:0.25,shadowRadius:20,elevation:8 },
  resultLabel:     { color:"rgba(255,255,255,0.65)",fontSize:13 },
  resultBig:       { fontSize:76,fontWeight:"800",marginTop:4,lineHeight:80 },
  resultBadge:     { borderRadius:20,paddingHorizontal:16,paddingVertical:8,marginTop:12 },

  bmiRow:  { flexDirection:"row",gap:10,marginBottom:12 },
  bmiCard: {
    backgroundColor:"#fff",borderRadius:20,padding:20,alignItems:"center",
    shadowColor:"#1a3a6b",shadowOffset:{width:0,height:4},shadowOpacity:0.07,shadowRadius:12,elevation:3,
    borderWidth:0.5,borderColor:"rgba(200,215,240,0.5)",
  },
  bmiLabel: { color:"#334155",fontWeight:"700",fontSize:13 },
  bmiVal:   { fontSize:36,fontWeight:"800",color:"#1e3a5f",marginTop:6 },
  bmiCat:   { fontSize:13,fontWeight:"700",marginTop:4 },

  adviceCard:  { backgroundColor:"#fffbeb",borderRadius:20,padding:20,marginBottom:12,borderWidth:0.5,borderColor:"#fcd34d" },
  adviceTitle: { color:"#92400e",fontWeight:"700",marginBottom:10,fontSize:14 },

  compareCard: { borderRadius:22,padding:24,marginBottom:12,alignItems:"center",shadowColor:"#0f2c5c",shadowOffset:{width:0,height:8},shadowOpacity:0.2,shadowRadius:20,elevation:6 },
  compareRow:  { flexDirection:"row",alignItems:"center",justifyContent:"space-around",width:"100%",marginVertical:20 },
  compareVal:  { fontSize:44,fontWeight:"800" },
  compareLabel:{ fontSize:12,marginTop:4 },
  vsCircle:    { width:46,height:46,borderRadius:23,backgroundColor:"rgba(255,255,255,0.1)",borderWidth:0.5,borderColor:"rgba(255,255,255,0.2)",alignItems:"center",justifyContent:"center" },
  vsText:      { color:"rgba(255,255,255,0.7)",fontWeight:"700",fontSize:12 },
  diffPill:    { borderRadius:14,paddingHorizontal:18,paddingVertical:10 },

  statsRow: { flexDirection:"row",gap:8,marginBottom:12 },
  statCard: {
    flex:1,backgroundColor:"#fff",borderRadius:16,padding:16,alignItems:"center",
    shadowColor:"#1a3a6b",shadowOffset:{width:0,height:4},shadowOpacity:0.07,shadowRadius:12,elevation:3,
    borderWidth:0.5,borderColor:"rgba(200,215,240,0.5)",
  },
  statVal:   { fontSize:20,fontWeight:"800",color:Colors.primary },
  statLabel: { color:"#8899bb",fontSize:10,marginTop:4,textAlign:"center" },

  dualBar:    { height:8,backgroundColor:"rgba(180,195,220,0.25)",borderRadius:4,position:"relative",overflow:"visible" },
  dualBarFg:  { height:8,borderRadius:4,position:"absolute" },
  dualBarMark:{ position:"absolute",width:2,height:16,backgroundColor:"#8899bb",top:-4,borderRadius:1 },

  fabWrap: { position:"absolute",bottom:32,right:24 },
  fab:     {
    width:60,height:60,borderRadius:30,backgroundColor:Colors.primary,
    justifyContent:"center",alignItems:"center",
    shadowColor:Colors.primary,shadowOffset:{width:0,height:8},shadowOpacity:0.35,shadowRadius:16,elevation:8,
  },
})
