import { useEffect, useState, useRef } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Dimensions,
  RefreshControl, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BarChart } from "react-native-chart-kit"
import { useRouter } from "expo-router"
import { Colors } from "../../constants/colors"
import { fetchWithCache } from "../../services/cache"

const BASE_URL = "https://healthy-ai.onrender.com"

export default function Dashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [userId, setUserId] = useState(0)

  // Dashboard state
  const [user, setUser] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [displayScore, setDisplayScore] = useState(0)

  // My Health form state
  const [healthForm, setHealthForm] = useState({
    age: "", gender: "male", weight: "",
    height: "", sleep_hours: "", activity_level: 3,
  })
  const [healthResult, setHealthResult] = useState(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthError, setHealthError] = useState(null)
  const [formSubmitted, setFormSubmitted] = useState(false)

  const screenWidth = Dimensions.get("window").width
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const animatedScore = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const tabSlide = useRef(new Animated.Value(0)).current
  const formExpand = useRef(new Animated.Value(0)).current

  const tabMap = { overview: 0, mystats: 1, population: 2 }

  useEffect(() => { fetchData() }, [userId])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    if (user?.Overall_Wellness_Score) {
      Animated.timing(animatedScore, {
        toValue: user.Overall_Wellness_Score, duration: 900, useNativeDriver: false,
      }).start()
      const listener = animatedScore.addListener(({ value }) => setDisplayScore(value))
      return () => animatedScore.removeListener(listener)
    }
  }, [user])

  useEffect(() => {
    Animated.timing(tabSlide, {
      toValue: tabMap[activeTab] * (screenWidth / 3),
      duration: 280, useNativeDriver: true,
    }).start()
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
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้")
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
      setHealthError("กรุณากรอกข้อมูลให้ครบครับ")
      return
    }
    setHealthError(null)
    setHealthLoading(true)
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
      const data = await res.json()
      setHealthResult(data)
      setFormSubmitted(true)
    } catch {
      setHealthError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่")
    }
    setHealthLoading(false)
  }

  const getScoreColor = (score) => {
    if (score >= 70) return Colors.primary
    if (score >= 50) return Colors.warning
    return Colors.danger
  }

  const circumference = 2 * Math.PI * 52
  const rawScore = user?.Overall_Wellness_Score ?? 0
  const dashOffset = circumference - (rawScore / 100) * circumference
  const avgScore = analytics?.avg_wellness ?? 0
  const diff = rawScore - avgScore

  const activityLabels = {
    1: "ไม่ค่อยขยับ", 2: "เดินบ้าง", 3: "ออกกำลังกายบ้าง",
    4: "ออกกำลังสม่ำเสมอ", 5: "ออกกำลังหนักมาก",
  }

  const metrics = [
    { label: "😴 Sleep", key: "Sleep_Health_Score", color: "#3b82f6" },
    { label: "🏃 Activity", key: "Activity_Health_Score", color: "#f59e0b" },
    { label: "❤️ Cardio", key: "Cardiovascular_Health_Score", color: "#ef4444" },
    { label: "🧠 Mental", key: "Mental_Health_Score", color: "#8b5cf6" },
  ]

  if (loading && !user) return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingEmoji}>🏥</Text>
      <Text style={styles.loadingText}>กำลังโหลด...</Text>
      <Text style={styles.loadingSubtext}>รอสักครู่นะครับ</Text>
    </View>
  )

  if (error) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorMsg}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
        <Text style={styles.retryBtnText}>🔄 ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  )

  const chartData = {
    labels: ["Sleep", "Activity", "Cardio", "Mental"],
    datasets: [{
      data: [
        user?.Sleep_Health_Score ?? 0,
        user?.Activity_Health_Score ?? 0,
        user?.Cardiovascular_Health_Score ?? 0,
        user?.Mental_Health_Score ?? 0,
      ]
    }]
  }

  // ─── RENDER ────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          {/* ── HERO HEADER ── */}
          <LinearGradient colors={[Colors.primary, "#14532d"]} style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>สวัสดี 👋</Text>
                <Text style={styles.headerTitle}>HealthyAI</Text>
              </View>
              {/* User Selector */}
              <View style={styles.userSelector}>
                <TouchableOpacity onPress={() => setUserId(Math.max(0, userId - 1))} style={styles.arrowBtn}>
                  <Text style={styles.arrowText}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.userIdText}>#{userId}</Text>
                <TouchableOpacity onPress={() => setUserId(userId + 1)} style={styles.arrowBtn}>
                  <Text style={styles.arrowText}>▶</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Score Ring */}
            <View style={styles.scoreRingWrap}>
              <View style={styles.scoreRingOuter}>
                <Animated.Text style={[styles.scoreNumber, { color: "#fff" }]}>
                  {displayScore.toFixed(1)}
                </Animated.Text>
                <Text style={styles.scoreSubLabel}>/ 100</Text>
                <Text style={styles.scoreName}>Wellness Score</Text>
              </View>

              {/* Decorative arcs */}
              <View style={styles.arcRingBg} />
              <View style={[styles.arcRingFg, {
                borderColor: rawScore >= 70 ? "#86efac" : rawScore >= 50 ? "#fcd34d" : "#fca5a5"
              }]} />
            </View>

            <View style={styles.headerBadgeRow}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {diff >= 0
                    ? `📈 +${diff.toFixed(1)} กว่าค่าเฉลี่ย`
                    : `📉 ${diff.toFixed(1)} จากค่าเฉลี่ย`}
                </Text>
              </View>
              {analytics && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>👥 {analytics.total_users} คน</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* ── TAB BAR ── */}
          <View style={styles.tabContainer}>
            <View style={styles.tabBar}>
              <Animated.View style={[styles.tabIndicator, { transform: [{ translateX: tabSlide }], width: screenWidth / 3 - 8 }]} />
              {[
                { key: "overview", label: "📊 Overview" },
                { key: "mystats", label: "💚 My Stats" },
                { key: "population", label: "🌍 Compare" },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tab}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ══════════════════════════════════
                TAB 1 — OVERVIEW
            ══════════════════════════════════ */}
            {activeTab === "overview" && (
              <View style={styles.section}>

                {/* AI Insight Card */}
                <View style={styles.aiInsightCard}>
                  <View style={styles.aiInsightHeader}>
                    <View style={styles.aiDot} />
                    <Text style={styles.aiInsightTitle}>AI Insight</Text>
                  </View>
                  <Text style={styles.aiInsightText}>
                    {rawScore >= 70
                      ? "สุขภาพโดยรวมของคุณอยู่ในเกณฑ์ดี รักษาพฤติกรรมนี้ต่อไป 💪"
                      : "ควรเพิ่มคุณภาพการนอนและกิจกรรมเพื่อเพิ่มคะแนนสุขภาพครับ"}
                  </Text>
                </View>

                {/* Metrics Grid */}
                <Text style={styles.sectionLabel}>Health Metrics</Text>
                <View style={styles.metricsGrid}>
                  {metrics.map((m) => {
                    const val = user?.[m.key] ?? 0
                    return (
                      <View key={m.key} style={styles.metricCard}>
                        <Text style={styles.metricEmoji}>{m.label.split(" ")[0]}</Text>
                        <Text style={styles.metricLabel}>{m.label.split(" ")[1]}</Text>
                        <Text style={[styles.metricValue, { color: getScoreColor(val) }]}>
                          {val.toFixed(1)}
                        </Text>
                        <View style={styles.miniBarBg}>
                          <View style={[styles.miniBarFg, {
                            width: `${val}%`,
                            backgroundColor: getScoreColor(val)
                          }]} />
                        </View>
                      </View>
                    )
                  })}
                </View>

                {/* Bar Chart */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>📈 Health Overview</Text>
                  <BarChart
                    data={chartData}
                    width={screenWidth - 64}
                    height={200}
                    fromZero
                    showValuesOnTopOfBars
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundGradientFrom: Colors.card,
                      backgroundGradientTo: Colors.card,
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(22,163,74,${opacity})`,
                      labelColor: () => Colors.text,
                      formatTopBarValue: (v) => v.toFixed(1),
                    }}
                    style={{ borderRadius: 12, marginTop: 8 }}
                  />
                </View>
              </View>
            )}

            {/* ══════════════════════════════════
                TAB 2 — MY STATS (merged MyHealth)
            ══════════════════════════════════ */}
            {activeTab === "mystats" && (
              <View style={styles.section}>
                {!formSubmitted ? (
                  <>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoText}>
                        กรอกข้อมูลของคุณ AI จะวิเคราะห์สุขภาพและเปรียบเทียบกับผู้ใช้กว่า{" "}
                        <Text style={{ fontWeight: "bold", color: Colors.primary }}>1,000 คน</Text>
                      </Text>
                    </View>

                    {/* Gender */}
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>เพศ</Text>
                      <View style={styles.genderRow}>
                        {[{ key: "male", label: "👨 ชาย" }, { key: "female", label: "👩 หญิง" }].map((g) => (
                          <TouchableOpacity
                            key={g.key}
                            style={[styles.genderBtn, healthForm.gender === g.key && styles.genderBtnActive]}
                            onPress={() => setHealthForm({ ...healthForm, gender: g.key })}
                          >
                            <Text style={[styles.genderText, healthForm.gender === g.key && styles.genderTextActive]}>
                              {g.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Inputs */}
                    <View style={styles.card}>
                      {[
                        { label: "อายุ (ปี)", key: "age", placeholder: "เช่น 25" },
                        { label: "น้ำหนัก (กก.)", key: "weight", placeholder: "เช่น 65" },
                        { label: "ส่วนสูง (ซม.)", key: "height", placeholder: "เช่น 170" },
                        { label: "ชั่วโมงนอนเฉลี่ยต่อคืน", key: "sleep_hours", placeholder: "เช่น 7" },
                      ].map((field, i) => (
                        <View key={field.key} style={i > 0 ? { marginTop: 14 } : {}}>
                          <Text style={styles.fieldLabel}>{field.label}</Text>
                          <TextInput
                            style={styles.input}
                            placeholder={field.placeholder}
                            placeholderTextColor={Colors.textMuted}
                            value={healthForm[field.key]}
                            onChangeText={(v) => setHealthForm({ ...healthForm, [field.key]: v })}
                            keyboardType="numeric"
                          />
                        </View>
                      ))}
                    </View>

                    {/* Activity */}
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>ระดับการออกกำลังกาย</Text>
                      <Text style={styles.activityLabel}>{activityLabels[healthForm.activity_level]}</Text>
                      <View style={styles.activityRow}>
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <TouchableOpacity
                            key={lvl}
                            style={[styles.activityBtn, healthForm.activity_level === lvl && styles.activityBtnActive]}
                            onPress={() => setHealthForm({ ...healthForm, activity_level: lvl })}
                          >
                            <Text style={[styles.activityBtnText, healthForm.activity_level === lvl && { color: "#fff" }]}>
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
                      style={[styles.submitBtn, healthLoading && styles.submitBtnDisabled]}
                      onPress={handleHealthSubmit}
                      disabled={healthLoading}
                    >
                      {healthLoading ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          <ActivityIndicator color="#fff" size="small" />
                          <Text style={styles.submitText}>AI กำลังวิเคราะห์...</Text>
                        </View>
                      ) : (
                        <Text style={styles.submitText}>🔍 วิเคราะห์สุขภาพของฉัน</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  /* ── RESULTS ── */
                  <>
                    {/* Score Hero */}
                    <View style={styles.resultScoreCard}>
                      <Text style={styles.resultScoreLabel}>Overall Wellness Score</Text>
                      <Text style={[styles.resultScoreBig, { color: getScoreColor(healthResult.overall_score) }]}>
                        {healthResult.overall_score}
                      </Text>
                      <Text style={styles.resultPercentile}>
                        ดีกว่า {healthResult.percentile}% ของผู้ใช้ {healthResult.total_users} คน
                      </Text>
                    </View>

                    {/* BMI */}
                    <View style={styles.bmiRow}>
                      <View style={[styles.bmiCard, { flex: 1 }]}>
                        <Text style={styles.bmiLabel}>⚖️ BMI</Text>
                        <Text style={styles.bmiValue}>{healthResult.bmi}</Text>
                        <Text style={[styles.bmiCategory, {
                          color: healthResult.bmi_category === "ปกติ" ? Colors.primary : Colors.warning
                        }]}>{healthResult.bmi_category}</Text>
                      </View>
                      <View style={[styles.bmiCard, { flex: 1 }]}>
                        <Text style={styles.bmiLabel}>📊 vs ค่าเฉลี่ย</Text>
                        <Text style={styles.bmiValue}>{healthResult.avg_wellness}</Text>
                        <Text style={[styles.bmiCategory, { color: Colors.textMuted }]}>ค่าเฉลี่ย</Text>
                      </View>
                    </View>

                    {/* Metric bars */}
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>💪 Health Metrics</Text>
                      {[
                        { label: "😴 Sleep", score: healthResult.sleep_score },
                        { label: "🏃 Activity", score: healthResult.activity_score },
                        { label: "❤️ Cardio", score: healthResult.cardiovascular_score },
                        { label: "🧠 Mental", score: healthResult.mental_score },
                      ].map((item) => (
                        <View key={item.label} style={{ marginBottom: 14 }}>
                          <View style={styles.metricRowHeader}>
                            <Text style={{ color: Colors.text, fontSize: 14 }}>{item.label}</Text>
                            <Text style={{ color: getScoreColor(item.score), fontWeight: "bold" }}>
                              {item.score.toFixed(1)}
                            </Text>
                          </View>
                          <View style={styles.barBg}>
                            <View style={[styles.barFg, {
                              width: `${item.score}%`,
                              backgroundColor: getScoreColor(item.score)
                            }]} />
                          </View>
                        </View>
                      ))}
                    </View>

                    {healthResult.summary && (
                      <View style={styles.aiResultCard}>
                        <Text style={styles.aiResultTitle}>🤖 AI วิเคราะห์</Text>
                        <Text style={styles.aiResultText}>{healthResult.summary}</Text>
                      </View>
                    )}

                    {healthResult.advice && (
                      <View style={styles.adviceCard}>
                        <Text style={styles.adviceTitle}>💡 คำแนะนำ</Text>
                        <Text style={styles.aiResultText}>{healthResult.advice}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.resetBtn}
                      onPress={() => { setFormSubmitted(false); setHealthResult(null) }}
                    >
                      <Text style={styles.resetText}>🔄 กรอกข้อมูลใหม่</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* ══════════════════════════════════
                TAB 3 — POPULATION / COMPARE
            ══════════════════════════════════ */}
            {activeTab === "population" && (
              <View style={styles.section}>

                {/* Compare card */}
                <View style={styles.compareHeroCard}>
                  <Text style={styles.compareHeroTitle}>เปรียบเทียบกับค่าเฉลี่ย</Text>
                  <View style={styles.compareRow}>
                    <View style={styles.compareItem}>
                      <Text style={[styles.compareValue, { color: Colors.primary }]}>
                        {rawScore.toFixed(1)}
                      </Text>
                      <Text style={styles.compareItemLabel}>คะแนนของคุณ</Text>
                    </View>
                    <View style={styles.vsCircle}>
                      <Text style={styles.vsText}>VS</Text>
                    </View>
                    <View style={styles.compareItem}>
                      <Text style={[styles.compareValue, { color: Colors.textMuted }]}>
                        {avgScore.toFixed(1)}
                      </Text>
                      <Text style={styles.compareItemLabel}>ค่าเฉลี่ย</Text>
                    </View>
                  </View>
                  <View style={[styles.diffBadge, { backgroundColor: diff >= 0 ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)" }]}>
                    <Text style={{ color: diff >= 0 ? Colors.primary : Colors.danger, fontWeight: "bold", fontSize: 14 }}>
                      {diff >= 0 ? `📈 สูงกว่าค่าเฉลี่ย +${diff.toFixed(1)}` : `📉 ต่ำกว่าค่าเฉลี่ย ${diff.toFixed(1)}`}
                    </Text>
                  </View>
                </View>

                {/* Population stats */}
                {analytics && (
                  <>
                    <Text style={styles.sectionLabel}>Population Stats</Text>
                    <View style={styles.statsGrid}>
                      {[
                        { label: "Avg Wellness", value: analytics.avg_wellness?.toFixed(1) },
                        { label: "Avg Sleep Score", value: analytics.avg_sleep?.toFixed(1) },
                        { label: "Total Users", value: analytics.total_users },
                      ].map((s) => (
                        <View key={s.label} style={styles.statCard}>
                          <Text style={styles.statValue}>{s.value}</Text>
                          <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Per-metric comparison */}
                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>📊 Metric Comparison</Text>
                      {metrics.map((m) => {
                        const myVal = user?.[m.key] ?? 0
                        const avgVal = 60 // placeholder avg
                        return (
                          <View key={m.key} style={{ marginBottom: 16 }}>
                            <View style={styles.metricRowHeader}>
                              <Text style={{ color: Colors.text, fontSize: 14 }}>{m.label}</Text>
                              <Text style={{ color: getScoreColor(myVal), fontWeight: "bold", fontSize: 13 }}>
                                {myVal.toFixed(1)} <Text style={{ color: Colors.textMuted, fontWeight: "normal" }}>/ avg {avgVal}</Text>
                              </Text>
                            </View>
                            <View style={styles.dualBarWrap}>
                              <View style={[styles.dualBarFg, { width: `${myVal}%`, backgroundColor: getScoreColor(myVal) }]} />
                              <View style={[styles.dualBarAvg, { left: `${avgVal}%` }]} />
                            </View>
                          </View>
                        )
                      })}
                      <View style={styles.dualBarLegend}>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                          <Text style={styles.legendText}>คุณ</Text>
                        </View>
                        <View style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: Colors.textMuted, width: 2 }]} />
                          <Text style={styles.legendText}>ค่าเฉลี่ย</Text>
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
        <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity style={styles.fab} onPress={() => router.push("/(tabs)/recommendations")}>
            <Text style={styles.fabIcon}>🤖</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  // ── Base ──
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  loadingEmoji: { fontSize: 48 },
  loadingText: { color: Colors.primary, fontWeight: "bold", fontSize: 16, marginTop: 12 },
  loadingSubtext: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  errorMsg: { color: Colors.danger, fontSize: 16 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 12, marginTop: 12 },
  retryBtnText: { color: "#fff", fontWeight: "bold" },

  // ── Header ──
  header: { padding: 24, paddingTop: 52, paddingBottom: 36 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 2 },
  userSelector: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6, gap: 8 },
  arrowBtn: { padding: 2 },
  arrowText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  userIdText: { color: "#fff", fontWeight: "bold", fontSize: 15, minWidth: 28, textAlign: "center" },

  // ── Score Ring ──
  scoreRingWrap: { alignItems: "center", marginTop: 20, position: "relative" },
  scoreRingOuter: { width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", zIndex: 2 },
  arcRingBg: { position: "absolute", width: 160, height: 160, borderRadius: 80, borderWidth: 6, borderColor: "rgba(255,255,255,0.15)", top: -10 },
  arcRingFg: { position: "absolute", width: 160, height: 160, borderRadius: 80, borderWidth: 6, borderTopColor: "transparent", borderRightColor: "transparent", top: -10, transform: [{ rotate: "45deg" }] },
  scoreNumber: { fontSize: 40, fontWeight: "bold", color: "#fff" },
  scoreSubLabel: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  scoreName: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 4 },
  headerBadgeRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 16 },
  headerBadge: { backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  headerBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // ── Tab Bar ──
  tabContainer: { backgroundColor: Colors.card, marginHorizontal: 16, marginTop: -16, borderRadius: 16, overflow: "hidden", elevation: 4 },
  tabBar: { flexDirection: "row", position: "relative", paddingVertical: 4, paddingHorizontal: 4 },
  tabIndicator: { position: "absolute", height: "80%", top: "10%", left: 4, backgroundColor: `rgba(22,163,74,0.12)`, borderRadius: 10 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabText: { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
  tabTextActive: { color: Colors.primary },

  // ── Section ──
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { color: Colors.text, fontWeight: "bold", fontSize: 14, marginBottom: 10, marginTop: 4 },

  // ── Cards ──
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 12, elevation: 2 },
  cardTitle: { color: Colors.text, fontWeight: "bold", fontSize: 14, marginBottom: 12 },

  // ── AI Insight ──
  aiInsightCard: { backgroundColor: "rgba(22,163,74,0.08)", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(22,163,74,0.2)" },
  aiInsightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  aiInsightTitle: { color: Colors.primary, fontWeight: "bold", fontSize: 13 },
  aiInsightText: { color: Colors.text, fontSize: 13, lineHeight: 22 },

  // ── Metrics Grid ──
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  metricCard: { flex: 1, minWidth: "45%", backgroundColor: Colors.card, borderRadius: 14, padding: 14, elevation: 2 },
  metricEmoji: { fontSize: 18 },
  metricLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  metricValue: { fontSize: 22, fontWeight: "bold", marginTop: 2 },
  miniBarBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 8 },
  miniBarFg: { height: 4, borderRadius: 2 },

  // ── My Stats form ──
  infoCard: { backgroundColor: "rgba(22,163,74,0.08)", borderRadius: 14, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  infoText: { color: Colors.text, fontSize: 13, lineHeight: 22 },
  fieldLabel: { color: Colors.text, fontWeight: "600", marginBottom: 8, fontSize: 14 },
  input: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 15 },
  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: "center" },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: "rgba(22,163,74,0.08)" },
  genderText: { color: Colors.textMuted, fontWeight: "600" },
  genderTextActive: { color: Colors.primary },
  activityLabel: { color: Colors.primary, fontWeight: "bold", fontSize: 15, textAlign: "center", marginBottom: 12 },
  activityRow: { flexDirection: "row", gap: 8 },
  activityBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: Colors.border, alignItems: "center" },
  activityBtnActive: { backgroundColor: Colors.primary },
  activityBtnText: { color: Colors.text, fontWeight: "bold" },
  errorCard: { backgroundColor: "#fee2e2", borderRadius: 12, padding: 14, marginBottom: 12 },
  errorText: { color: Colors.danger, fontSize: 13 },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, alignItems: "center", marginBottom: 12, elevation: 4 },
  submitBtnDisabled: { backgroundColor: Colors.textMuted },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // ── Results ──
  resultScoreCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 12, elevation: 4 },
  resultScoreLabel: { color: Colors.textMuted, fontSize: 13 },
  resultScoreBig: { fontSize: 72, fontWeight: "bold", marginTop: 4 },
  resultPercentile: { color: Colors.textMuted, fontSize: 13, marginTop: 6, textAlign: "center" },
  bmiRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  bmiCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 18, alignItems: "center", elevation: 2 },
  bmiLabel: { color: Colors.text, fontWeight: "bold", fontSize: 13 },
  bmiValue: { fontSize: 36, fontWeight: "bold", color: Colors.text, marginTop: 6 },
  bmiCategory: { fontSize: 14, fontWeight: "bold", marginTop: 4 },
  metricRowHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  barBg: { height: 10, backgroundColor: Colors.border, borderRadius: 5 },
  barFg: { height: 10, borderRadius: 5 },
  aiResultCard: { backgroundColor: "rgba(22,163,74,0.08)", borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "rgba(22,163,74,0.2)" },
  aiResultTitle: { color: Colors.primary, fontWeight: "bold", marginBottom: 8, fontSize: 14 },
  aiResultText: { color: Colors.text, lineHeight: 24, fontSize: 14 },
  adviceCard: { backgroundColor: "#fef3c7", borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "#fcd34d" },
  adviceTitle: { color: "#92400e", fontWeight: "bold", marginBottom: 8, fontSize: 14 },
  resetBtn: { backgroundColor: Colors.border, borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 12 },
  resetText: { color: Colors.primary, fontWeight: "bold", fontSize: 15 },

  // ── Population ──
  compareHeroCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 22, marginBottom: 12, elevation: 3, alignItems: "center" },
  compareHeroTitle: { color: Colors.text, fontWeight: "bold", fontSize: 15, marginBottom: 16 },
  compareRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "100%" },
  compareItem: { alignItems: "center" },
  compareValue: { fontSize: 38, fontWeight: "bold" },
  compareItemLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  vsCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.border, alignItems: "center", justifyContent: "center" },
  vsText: { color: Colors.textMuted, fontWeight: "bold", fontSize: 13 },
  diffBadge: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, marginTop: 14 },
  statsGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: "center", elevation: 2 },
  statValue: { fontSize: 20, fontWeight: "bold", color: Colors.primary },
  statLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 4, textAlign: "center" },
  dualBarWrap: { height: 10, backgroundColor: Colors.border, borderRadius: 5, position: "relative", overflow: "visible" },
  dualBarFg: { height: 10, borderRadius: 5, position: "absolute" },
  dualBarAvg: { position: "absolute", width: 2, height: 16, backgroundColor: Colors.textMuted, top: -3, borderRadius: 1 },
  dualBarLegend: { flexDirection: "row", gap: 16, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: Colors.textMuted, fontSize: 12 },

  // ── FAB ──
  fabWrap: { position: "absolute", bottom: 30, right: 24 },
  fab: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 10 },
  fabIcon: { fontSize: 26 },
})