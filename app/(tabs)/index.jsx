import { useEffect, useState, useRef } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Dimensions,
  RefreshControl, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { BarChart } from "react-native-chart-kit"
import Svg, { Circle } from "react-native-svg"
import { useRouter } from "expo-router"
import { Colors } from "../../constants/colors"
import { fetchWithCache } from "../../services/cache"
import { BASE_URL } from "../../config/api"
import { validateWellnessResult } from "../../services/validation"

// Create animated SVG Circle for score ring animation
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// ── Form Progress Bar ────────────────────────────────────────────────────────
function FormProgress({ step, total }) {
  const pct = Math.round((step / total) * 100)
  return (
    <View style={progressStyles.wrap}>
      <View style={progressStyles.header}>
        <Text style={progressStyles.label}>กรอกข้อมูลสุขภาพ</Text>
        <Text style={progressStyles.step}>{step} / {total}</Text>
      </View>
      <View style={progressStyles.track}>
        <View style={[progressStyles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={progressStyles.pct}>{pct}%</Text>
    </View>
  )
}

const progressStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 18,
    marginBottom: 12, borderWidth: 0.5, borderColor: Colors.border,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  label: { color: Colors.text, fontWeight: "600", fontSize: 14 },
  step:  { color: Colors.primary, fontWeight: "700", fontSize: 14 },
  track: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  fill:  { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  pct:   { color: Colors.textMuted, fontSize: 11, marginTop: 8, textAlign: "right" },
})

// ── Score Ring (SVG Arc Animation) ──────────────────────────────────────────
function ScoreRing({ score, displayScore, color }) {
  const size = 180
  const stroke = 10
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: score,
      duration: 1400,
      useNativeDriver: false,
    }).start()
  }, [score])

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  })

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke} fill="none"
        />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color}
          strokeWidth={stroke} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
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

// ── Metric Bar Row ───────────────────────────────────────────────────────────
function MetricBarRow({ label, score, getColor }) {
  const color = getColor(score)
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }}>
        <Text style={{ color: Colors.text, fontSize: 14 }}>{label}</Text>
        <Text style={{ color, fontWeight: "700", fontSize: 14 }}>{score.toFixed(1)}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFg, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ emoji, label, value, color, bgColor }) {
  return (
    <View style={[styles.metricCard, { borderTopWidth: 3, borderTopColor: color }]}>
      <View style={[styles.metricIconWrap, { backgroundColor: bgColor }]}>
        <Text style={styles.metricEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.metricName}>{label}</Text>
      <Text style={[styles.metricVal, { color }]}>{value.toFixed(1)}</Text>
      <View style={styles.metricBarBg}>
        <View style={[styles.metricBarFg, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [userId, setUserId] = useState(0)
  const [user, setUser] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [displayScore, setDisplayScore] = useState(0)

  const [healthForm, setHealthForm] = useState({
    age: "", gender: "male", weight: "",
    height: "", sleep_hours: "", activity_level: 3,
  })
  const [healthResult, setHealthResult] = useState(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthError, setHealthError] = useState(null)
  const [formSubmitted, setFormSubmitted] = useState(false)

  const filledCount = ["age", "weight", "height", "sleep_hours"]
    .filter(k => healthForm[k].trim() !== "").length
  const formProgress = Math.min(filledCount + 1, 4)

  const screenWidth = Dimensions.get("window").width
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(24)).current
  const scoreAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const tabAnim   = useRef(new Animated.Value(0)).current

  const tabKeys = ["overview", "mystats", "population"]

  // โหลด AsyncStorage ตอน mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem("healthForm")
        const savedResult = await AsyncStorage.getItem("healthResult")
        if (saved) setHealthForm(JSON.parse(saved))
        if (savedResult) {
          setHealthResult(JSON.parse(savedResult))
          setFormSubmitted(true)
        }
      } catch (err) {
        console.error("Error loading data:", err)
      }
    }
    loadData()
  }, [])

  useEffect(() => { fetchData() }, [userId])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1400, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    if (user?.Overall_Wellness_Score) {
      Animated.timing(scoreAnim, {
        toValue: user.Overall_Wellness_Score, duration: 1200, useNativeDriver: false,
      }).start()
      const id = scoreAnim.addListener(({ value }) => setDisplayScore(value))
      return () => scoreAnim.removeListener(id)
    }
  }, [user])

  useEffect(() => {
    const idx = tabKeys.indexOf(activeTab)
    Animated.spring(tabAnim, { toValue: idx, useNativeDriver: true, tension: 60, friction: 10 }).start()
  }, [activeTab])

  const fetchData = async () => {
    setError(null)
    try {
      const [u, a] = await Promise.all([
        fetchWithCache(`${BASE_URL}/user/${userId}`, 30000),
        fetchWithCache(`${BASE_URL}/analytics`, 60000),
      ])
      setUser(u)
      setAnalytics(a)
    } catch (err) {
      setError(`ไม่สามารถโหลดข้อมูลได้: ${err.message}`)
    }
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  const handleHealthSubmit = async () => {
    const { age, weight, height, sleep_hours } = healthForm
    if (!age || !weight || !height || !sleep_hours) {
      setHealthError("กรุณากรอกข้อมูลให้ครบครับ"); return
    }
    setHealthError(null); setHealthLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/calculate-wellness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number(age), weight: Number(weight),
          height: Number(height), sleep_hours: Number(sleep_hours),
          activity_level: healthForm.activity_level, gender: healthForm.gender,
        }),
      })
      if (!res.ok) {
        throw new Error(`Server error: ${res.status} ${res.statusText}`)
      }
      const result = await res.json()
      validateWellnessResult(result)
      setHealthResult(result)
      setFormSubmitted(true)
      await AsyncStorage.setItem("healthForm", JSON.stringify(healthForm))
      await AsyncStorage.setItem("healthResult", JSON.stringify(result))
    } catch (err) {
      setHealthError(`ไม่สามารถเชื่อมต่อได้: ${err.message}`)
    }
    setHealthLoading(false)
  }

  const getScoreColor = (s) =>
    s >= 70 ? Colors.success : s >= 50 ? Colors.warning : Colors.danger

  const getScoreBg = (s) =>
    s >= 70 ? "rgba(29,158,117,0.1)" : s >= 50 ? "rgba(186,117,23,0.1)" : "rgba(163,45,45,0.1)"

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
    Sleep_Health_Score:           analytics?.avg_sleep  ?? avgScore,
    Activity_Health_Score:        avgScore,
    Cardiovascular_Health_Score:  avgScore,
    Mental_Health_Score:          avgScore,
  }

  const activityLabels = {
    1: "ไม่ค่อยขยับ 🛋️",
    2: "เดินบ้าง 🚶",
    3: "ออกกำลังกายบ้าง 🏋️",
    4: "สม่ำเสมอ 🔥",
    5: "หนักมาก 💪",
  }

  const tabWidth = (screenWidth - 32) / 3

  if (loading && !user) return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIconWrap}>
        <Text style={{ fontSize: 36 }}>🏥</Text>
      </View>
      <Text style={styles.loadingText}>กำลังโหลด...</Text>
      <Text style={styles.loadingSubtext}>รอสักครู่นะครับ</Text>
    </View>
  )

  if (error) return (
    <View style={styles.loadingContainer}>
      <Text style={{ color: Colors.danger, fontSize: 15, marginBottom: 20 }}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>🔄 ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  )

  const chartData = {
    labels: ["Sleep", "Activity", "Cardio", "Mental"],
    datasets: [{ data: metrics.map(m => user?.[m.key] ?? 0) }],
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
        >
          {/* ── HERO ──────────────────────────────────────────────────── */}
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.greeting}>สวัสดี 👋</Text>
                <Text style={styles.headerTitle}>HealthyAI</Text>
              </View>
              <View style={styles.userPill}>
                <TouchableOpacity
                  onPress={() => setUserId(Math.max(0, userId - 1))}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.pillArrow}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.pillId}>#{userId}</Text>
                <TouchableOpacity
                  onPress={() => setUserId(userId + 1)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.pillArrow}>▶</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.ringWrap}>
              <ScoreRing score={rawScore} displayScore={displayScore} color={ringColor} />
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, {
                backgroundColor: diff >= 0 ? "rgba(74,222,128,0.18)" : "rgba(248,113,113,0.18)",
              }]}>
                <Text style={styles.badgeText}>
                  {diff >= 0
                    ? `📈 +${diff.toFixed(1)} กว่าค่าเฉลี่ย`
                    : `📉 ${diff.toFixed(1)} จากค่าเฉลี่ย`}
                </Text>
              </View>
              {analytics && (
                <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                  <Text style={styles.badgeText}>👥 {analytics.total_users} คน</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* ── TABS ──────────────────────────────────────────────────── */}
          <View style={styles.tabWrap}>
            <View style={styles.tabBar}>
              <Animated.View style={[styles.tabIndicator, {
                width: tabWidth - 6,
                transform: [{
                  translateX: tabAnim.interpolate({
                    inputRange:  [0, 1, 2],
                    outputRange: [3, tabWidth + 3, tabWidth * 2 + 3],
                  }),
                }],
              }]} />
              {[
                { key: "overview",   label: "📊 Overview" },
                { key: "mystats",    label: "💚 My Stats" },
                { key: "population", label: "🌍 Compare" },
              ].map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tab, { width: tabWidth }]}
                  onPress={() => setActiveTab(t.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ════ OVERVIEW ════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <View style={styles.section}>
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <View style={styles.insightDot} />
                    <Text style={styles.insightTitle}>AI Insight</Text>
                  </View>
                  <Text style={styles.insightText}>
                    {rawScore >= 70
                      ? "สุขภาพโดยรวมของคุณอยู่ในเกณฑ์ดีมาก รักษาพฤติกรรมนี้ต่อไปนะครับ 💪"
                      : "ควรเพิ่มคุณภาพการนอนและกิจกรรมเพื่อเพิ่มคะแนนสุขภาพครับ"}
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>Health Metrics</Text>
                <View style={styles.metricsGrid}>
                  {metrics.map((m) => {
                    const val = user?.[m.key] ?? 0
                    return (
                      <MetricCard
                        key={m.key}
                        emoji={m.emoji}
                        label={m.label}
                        value={val}
                        color={getScoreColor(val)}
                        bgColor={getScoreBg(val)}
                      />
                    )
                  })}
                </View>

                <View style={styles.card}>
                  <Text style={styles.cardTitle}>📈 Health Overview</Text>
                  <BarChart
                    data={chartData}
                    width={screenWidth - 64}
                    height={200}
                    fromZero showValuesOnTopOfBars yAxisSuffix=""
                    chartConfig={{
                      backgroundGradientFrom: Colors.card,
                      backgroundGradientTo: Colors.card,
                      decimalPlaces: 1,
                      color: (o = 1) => `rgba(27,58,107,${o})`,
                      labelColor: () => Colors.text,
                      formatTopBarValue: (v) => v.toFixed(1),
                    }}
                    style={{ borderRadius: 12, marginTop: 12 }}
                  />
                </View>
              </View>
            )}

            {/* ════ MY STATS ════════════════════════════════════════════ */}
            {activeTab === "mystats" && (
              <View style={styles.section}>
                {!formSubmitted ? (
                  <>
                    <FormProgress step={formProgress} total={4} />

                    <View style={styles.infoCard}>
                      <Text style={styles.infoText}>
                        กรอกข้อมูลของคุณ AI จะวิเคราะห์และเปรียบเทียบกับผู้ใช้กว่า{" "}
                        <Text style={{ fontWeight: "700", color: Colors.primary }}>1,000 คน</Text>
                      </Text>
                    </View>

                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>เพศ</Text>
                      <View style={styles.genderRow}>
                        {[
                          { key: "male",   emoji: "👨", label: "ชาย" },
                          { key: "female", emoji: "👩", label: "หญิง" },
                        ].map((g) => (
                          <TouchableOpacity
                            key={g.key}
                            style={[styles.genderBtn, healthForm.gender === g.key && styles.genderBtnActive]}
                            onPress={() => setHealthForm({ ...healthForm, gender: g.key })}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.genderEmoji}>{g.emoji}</Text>
                            <Text style={[
                              styles.genderText,
                              healthForm.gender === g.key && { color: Colors.primary, fontWeight: "700" },
                            ]}>
                              {g.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.card}>
                      {[
                        { label: "อายุ (ปี)",               key: "age",         placeholder: "เช่น 25" },
                        { label: "น้ำหนัก (กก.)",           key: "weight",      placeholder: "เช่น 65" },
                        { label: "ส่วนสูง (ซม.)",           key: "height",      placeholder: "เช่น 170" },
                        { label: "ชั่วโมงนอนเฉลี่ยต่อคืน", key: "sleep_hours", placeholder: "เช่น 7" },
                      ].map((f, i) => (
                        <View key={f.key} style={i > 0 ? { marginTop: 18 } : {}}>
                          <View style={styles.fieldLabelRow}>
                            <Text style={styles.fieldLabel}>{f.label}</Text>
                            {healthForm[f.key] !== "" && (
                              <View style={styles.checkBadge}>
                                <Text style={styles.checkBadgeText}>✓ บันทึก</Text>
                              </View>
                            )}
                          </View>
                          <TextInput
                            style={[styles.input, healthForm[f.key] !== "" && styles.inputFilled]}
                            placeholder={f.placeholder}
                            placeholderTextColor={Colors.textMuted}
                            value={healthForm[f.key]}
                            onChangeText={(v) => setHealthForm({ ...healthForm, [f.key]: v })}
                            keyboardType="numeric"
                            returnKeyType="next"
                          />
                        </View>
                      ))}
                    </View>

                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>ระดับการออกกำลังกาย</Text>
                      <Text style={styles.activitySelected}>{activityLabels[healthForm.activity_level]}</Text>
                      <View style={styles.activityRow}>
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <TouchableOpacity
                            key={lvl}
                            style={[styles.activityBtn, healthForm.activity_level === lvl && styles.activityBtnActive]}
                            onPress={() => setHealthForm({ ...healthForm, activity_level: lvl })}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.activityBtnText,
                              healthForm.activity_level === lvl && { color: "#fff" },
                            ]}>
                              {lvl}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {healthError && (
                      <View style={styles.errorCard}>
                        <Text style={styles.errorText}>⚠️ {healthError}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.primaryBtn, healthLoading && { opacity: 0.6 }]}
                      onPress={handleHealthSubmit}
                      disabled={healthLoading}
                      activeOpacity={0.8}
                    >
                      {healthLoading ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={styles.primaryBtnText}>AI กำลังวิเคราะห์...</Text>
                        </View>
                      ) : (
                        <Text style={styles.primaryBtnText}>🔍 วิเคราะห์สุขภาพของฉัน</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.resultScoreCard}>
                      <Text style={styles.resultLabel}>Overall Wellness Score</Text>
                      <Text style={[styles.resultBig, { color: getScoreColor(healthResult.overall_score) }]}>
                        {healthResult.overall_score}
                      </Text>
                      <View style={[styles.resultBadge, { backgroundColor: getScoreBg(healthResult.overall_score) }]}>
                        <Text style={[styles.resultBadgeText, { color: getScoreColor(healthResult.overall_score) }]}>
                          ดีกว่า {healthResult.percentile}% ของผู้ใช้ {healthResult.total_users} คน
                        </Text>
                      </View>
                    </View>

                    <View style={styles.bmiRow}>
                      <View style={[styles.bmiCard, { flex: 1 }]}>
                        <Text style={styles.bmiLabel}>⚖️ BMI</Text>
                        <Text style={styles.bmiVal}>{healthResult.bmi}</Text>
                        <Text style={[styles.bmiCat, {
                          color: healthResult.bmi_category === "ปกติ" ? Colors.success : Colors.warning,
                        }]}>
                          {healthResult.bmi_category}
                        </Text>
                      </View>
                      <View style={[styles.bmiCard, { flex: 1 }]}>
                        <Text style={styles.bmiLabel}>📊 ค่าเฉลี่ย</Text>
                        <Text style={styles.bmiVal}>{healthResult.avg_wellness}</Text>
                        <Text style={[styles.bmiCat, { color: Colors.textMuted }]}>Population avg</Text>
                      </View>
                    </View>

                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>💪 Health Metrics</Text>
                      {[
                        { label: "😴 Sleep",    score: healthResult.sleep_score },
                        { label: "🏃 Activity", score: healthResult.activity_score },
                        { label: "❤️ Cardio",   score: healthResult.cardiovascular_score },
                        { label: "🧠 Mental",   score: healthResult.mental_score },
                      ].map((item) => (
                        <MetricBarRow
                          key={item.label}
                          label={item.label}
                          score={item.score}
                          getColor={getScoreColor}
                        />
                      ))}
                    </View>

                    {healthResult.summary && (
                      <View style={styles.insightCard}>
                        <Text style={styles.insightTitle}>🤖 AI วิเคราะห์</Text>
                        <Text style={styles.insightText}>{healthResult.summary}</Text>
                      </View>
                    )}

                    {healthResult.advice && (
                      <View style={styles.adviceCard}>
                        <Text style={styles.adviceTitle}>💡 คำแนะนำ</Text>
                        <Text style={{ color: Colors.text, lineHeight: 24, fontSize: 14 }}>
                          {healthResult.advice}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.ghostBtn}
                      onPress={async () => {
                        setFormSubmitted(false)
                        setHealthResult(null)
                        await AsyncStorage.removeItem("healthResult")
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.ghostBtnText}>🔄 กรอกข้อมูลใหม่</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* ════ POPULATION ══════════════════════════════════════════ */}
            {activeTab === "population" && (
              <View style={styles.section}>
                <View style={styles.compareCard}>
                  <Text style={styles.cardTitle}>เปรียบเทียบกับค่าเฉลี่ย</Text>
                  <View style={styles.compareRow}>
                    <View style={{ alignItems: "center" }}>
                      <Text style={[styles.compareVal, { color: Colors.primary }]}>
                        {rawScore.toFixed(1)}
                      </Text>
                      <Text style={styles.compareLabel}>คะแนนของคุณ</Text>
                    </View>
                    <View style={styles.vsCircle}>
                      <Text style={styles.vsText}>VS</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text style={[styles.compareVal, { color: Colors.textMuted }]}>
                        {avgScore.toFixed(1)}
                      </Text>
                      <Text style={styles.compareLabel}>ค่าเฉลี่ยกลาง</Text>
                    </View>
                  </View>
                  <View style={[styles.diffPill, {
                    backgroundColor: diff >= 0 ? "rgba(29,158,117,0.1)" : "rgba(163,45,45,0.08)",
                  }]}>
                    <Text style={{ color: diff >= 0 ? Colors.success : Colors.danger, fontWeight: "700" }}>
                      {diff >= 0
                        ? `📈 สูงกว่าค่าเฉลี่ย +${diff.toFixed(1)}`
                        : `📉 ต่ำกว่าค่าเฉลี่ย ${diff.toFixed(1)}`}
                    </Text>
                  </View>
                </View>

                {analytics && (
                  <>
                    <Text style={styles.sectionTitle}>Population Stats</Text>
                    <View style={styles.statsRow}>
                      {[
                        { label: "Avg Wellness", val: analytics.avg_wellness?.toFixed(1) },
                        { label: "Avg Sleep",    val: analytics.avg_sleep?.toFixed(1) },
                        { label: "Total Users",  val: analytics.total_users },
                      ].map((s) => (
                        <View key={s.label} style={styles.statCard}>
                          <Text style={styles.statVal}>{s.val}</Text>
                          <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>📊 Metric vs Average</Text>
                      {metrics.map((m) => {
                        const myVal  = user?.[m.key] ?? 0
                        const avgVal = metricAvgMap[m.key] ?? avgScore
                        return (
                          <View key={m.key} style={{ marginBottom: 18 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }}>
                              <Text style={{ color: Colors.text, fontSize: 14 }}>
                                {m.emoji} {m.label}
                              </Text>
                              <Text style={{ color: getScoreColor(myVal), fontWeight: "700", fontSize: 13 }}>
                                {myVal.toFixed(1)}{" "}
                                <Text style={{ color: Colors.textMuted, fontWeight: "400" }}>
                                  / avg {typeof avgVal === "number" ? avgVal.toFixed(1) : avgVal}
                                </Text>
                              </Text>
                            </View>
                            <View style={styles.dualBar}>
                              <View style={[styles.dualBarFg, {
                                width: `${myVal}%`, backgroundColor: getScoreColor(myVal),
                              }]} />
                              <View style={[styles.dualBarMark, { left: `${avgVal}%` }]} />
                            </View>
                          </View>
                        )
                      })}
                      <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success }} />
                          <Text style={{ color: Colors.textMuted, fontSize: 12 }}>คุณ</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={{ width: 2, height: 12, backgroundColor: Colors.textMuted }} />
                          <Text style={{ color: Colors.textMuted, fontSize: 12 }}>ค่าเฉลี่ย</Text>
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

        <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push("/(tabs)/recommendations")}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 26 }}>🤖</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingIconWrap: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.accentLight,
    justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  loadingText:    { color: Colors.primary, fontWeight: "700", fontSize: 16 },
  loadingSubtext: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  retryBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 13,
  },
  header: { padding: 24, paddingTop: 56, paddingBottom: 44 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting:    { color: "rgba(255,255,255,0.65)", fontSize: 13, letterSpacing: 0.3 },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 2 },
  userPill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9,
    gap: 10, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)",
  },
  pillArrow: { color: "#fff", fontWeight: "700", fontSize: 14 },
  pillId: { color: "#fff", fontWeight: "700", fontSize: 15, minWidth: 32, textAlign: "center" },
  ringWrap: { alignItems: "center", marginTop: 32, marginBottom: 8 },
  badgeRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 24 },
  badge: {
    borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.18)",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  tabWrap: { paddingHorizontal: 16, marginTop: -22 },
  tabBar: {
    flexDirection: "row", backgroundColor: Colors.card,
    borderRadius: 18, padding: 3,
    borderWidth: 0.5, borderColor: Colors.border,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute", height: "85%", top: "7.5%",
    backgroundColor: Colors.accentLight,
    borderRadius: 14, borderWidth: 0.5, borderColor: Colors.border,
  },
  tab:           { paddingVertical: 13, alignItems: "center" },
  tabText:       { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
  tabTextActive: { color: Colors.primary, fontWeight: "700" },
  section:      { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: {
    color: Colors.text, fontWeight: "700", fontSize: 13,
    marginBottom: 10, letterSpacing: 0.3, textTransform: "uppercase",
  },
  card: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 20,
    marginBottom: 12, borderWidth: 0.5, borderColor: Colors.border,
  },
  cardTitle: { color: Colors.text, fontWeight: "700", fontSize: 14, marginBottom: 4 },
  insightCard: {
    backgroundColor: Colors.accentLight, borderRadius: 20, padding: 18,
    marginBottom: 12, borderWidth: 0.5, borderColor: Colors.border,
  },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  insightDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  insightTitle:  { color: Colors.primary, fontWeight: "700", fontSize: 13 },
  insightText:   { color: Colors.text, fontSize: 13, lineHeight: 22 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  metricCard: {
    flex: 1, minWidth: "45%", backgroundColor: Colors.card,
    borderRadius: 18, padding: 16,
    borderWidth: 0.5, borderColor: Colors.border, overflow: "hidden",
  },
  metricIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  metricEmoji:  { fontSize: 20 },
  metricName:   { color: Colors.textMuted, fontSize: 11, marginTop: 2, fontWeight: "500" },
  metricVal:    { fontSize: 24, fontWeight: "800", marginTop: 4, marginBottom: 10 },
  metricBarBg:  { height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  metricBarFg:  { height: 4, borderRadius: 2 },
  infoCard: {
    backgroundColor: Colors.accentLight, borderRadius: 0, padding: 16,
    marginBottom: 12, borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  infoText: { color: Colors.text, fontSize: 13, lineHeight: 22 },
  fieldLabelRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  fieldLabel: { color: Colors.text, fontWeight: "600", fontSize: 14 },
  checkBadge: {
    backgroundColor: "rgba(29,158,117,0.1)",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  checkBadgeText: { color: Colors.success, fontSize: 11, fontWeight: "700" },
  input: {
    backgroundColor: Colors.background, borderRadius: 14, padding: 15,
    color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 15,
  },
  inputFilled: { borderColor: Colors.primary, backgroundColor: Colors.accentLight },
  genderRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  genderBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: "center", flexDirection: "row",
    justifyContent: "center", gap: 8,
  },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.accentLight },
  genderEmoji:     { fontSize: 20 },
  genderText:      { color: Colors.textMuted, fontWeight: "600", fontSize: 15 },
  activitySelected: {
    color: Colors.primary, fontWeight: "700", fontSize: 14,
    textAlign: "center", marginBottom: 14, marginTop: 8,
  },
  activityRow:       { flexDirection: "row", gap: 8 },
  activityBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: "center", borderWidth: 1, borderColor: Colors.border,
  },
  activityBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  activityBtnText:   { color: Colors.text, fontWeight: "700", fontSize: 15 },
  errorCard: {
    backgroundColor: "#fde8e8", borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 0.5, borderColor: "#f5c6c6",
  },
  errorText: { color: Colors.danger, fontSize: 13 },
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: 18,
    padding: 18, alignItems: "center", marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  ghostBtn: {
    backgroundColor: Colors.background, borderRadius: 18, padding: 16,
    alignItems: "center", marginBottom: 12,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  ghostBtnText: { color: Colors.primary, fontWeight: "700", fontSize: 15 },
  resultScoreCard: {
    backgroundColor: Colors.card, borderRadius: 24, padding: 32,
    alignItems: "center", marginBottom: 12,
    borderWidth: 0.5, borderColor: Colors.border,
  },
  resultLabel: { color: Colors.textMuted, fontSize: 13 },
  resultBig:   { fontSize: 76, fontWeight: "800", marginTop: 4, lineHeight: 80 },
  resultBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 12 },
  resultBadgeText: { fontSize: 13, fontWeight: "600" },
  bmiRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  bmiCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 20,
    alignItems: "center", borderWidth: 0.5, borderColor: Colors.border,
  },
  bmiLabel: { color: Colors.text, fontWeight: "700", fontSize: 13 },
  bmiVal:   { fontSize: 36, fontWeight: "800", color: Colors.text, marginTop: 6 },
  bmiCat:   { fontSize: 13, fontWeight: "700", marginTop: 4 },
  barBg: { height: 7, backgroundColor: Colors.border, borderRadius: 4 },
  barFg: { height: 7, borderRadius: 4 },
  adviceCard: {
    backgroundColor: "#FFFBEB", borderRadius: 20, padding: 20,
    marginBottom: 12, borderWidth: 0.5, borderColor: "#FCD34D",
  },
  adviceTitle: { color: "#92400E", fontWeight: "700", marginBottom: 10, fontSize: 14 },
  compareCard: {
    backgroundColor: Colors.card, borderRadius: 22, padding: 24,
    marginBottom: 12, alignItems: "center",
    borderWidth: 0.5, borderColor: Colors.border,
  },
  compareRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-around", width: "100%", marginVertical: 20,
  },
  compareVal:   { fontSize: 44, fontWeight: "800" },
  compareLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  vsCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.background,
    borderWidth: 0.5, borderColor: Colors.border,
    alignItems: "center", justifyContent: "center",
  },
  vsText:   { color: Colors.textMuted, fontWeight: "700", fontSize: 12 },
  diffPill: { borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    alignItems: "center", borderWidth: 0.5, borderColor: Colors.border,
  },
  statVal:   { fontSize: 20, fontWeight: "800", color: Colors.primary },
  statLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 4, textAlign: "center" },
  dualBar: {
    height: 7, backgroundColor: Colors.border, borderRadius: 4,
    position: "relative", overflow: "visible",
  },
  dualBarFg:   { height: 7, borderRadius: 4, position: "absolute" },
  dualBarMark: {
    position: "absolute", width: 2, height: 14,
    backgroundColor: Colors.textMuted, top: -3.5, borderRadius: 1,
  },
  fabWrap: { position: "absolute", bottom: 32, right: 24 },
  fab: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
  },
})