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

  const screenWidth = Dimensions.get("window").width
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(24)).current
  const animatedScore = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const tabAnim = useRef(new Animated.Value(0)).current

  const tabKeys = ["overview", "mystats", "population"]

  useEffect(() => { fetchData() }, [userId])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    if (user?.Overall_Wellness_Score) {
      Animated.timing(animatedScore, { toValue: user.Overall_Wellness_Score, duration: 1000, useNativeDriver: false }).start()
      const listener = animatedScore.addListener(({ value }) => setDisplayScore(value))
      return () => animatedScore.removeListener(listener)
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
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้")
    }
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
        body: JSON.stringify({
          age: Number(age), weight: Number(weight), height: Number(height),
          sleep_hours: Number(sleep_hours), activity_level: healthForm.activity_level, gender: healthForm.gender,
        }),
      })
      setHealthResult(await res.json())
      setFormSubmitted(true)
    } catch { setHealthError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่") }
    setHealthLoading(false)
  }

  const getScoreColor = (s) => s >= 70 ? Colors.success : s >= 50 ? Colors.warning : Colors.danger

  const rawScore = user?.Overall_Wellness_Score ?? 0
  const avgScore = analytics?.avg_wellness ?? 0
  const diff = rawScore - avgScore

  const metrics = [
    { label: "Sleep", emoji: "😴", key: "Sleep_Health_Score", color: Colors.primaryLight },
    { label: "Activity", emoji: "🏃", key: "Activity_Health_Score", color: Colors.warning },
    { label: "Cardio", emoji: "❤️", key: "Cardiovascular_Health_Score", color: Colors.danger },
    { label: "Mental", emoji: "🧠", key: "Mental_Health_Score", color: "#8b5cf6" },
  ]

  const activityLabels = { 1: "ไม่ค่อยขยับ", 2: "เดินบ้าง", 3: "ออกกำลังกายบ้าง", 4: "สม่ำเสมอ", 5: "หนักมาก" }

  const tabWidth = (screenWidth - 32) / 3

  if (loading && !user) return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIconWrap}>
        <Text style={{ fontSize: 40 }}>🏥</Text>
      </View>
      <Text style={styles.loadingText}>กำลังโหลด...</Text>
      <Text style={styles.loadingSubtext}>รอสักครู่นะครับ</Text>
    </View>
  )

  if (error) return (
    <View style={styles.loadingContainer}>
      <Text style={{ color: Colors.danger, fontSize: 16 }}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>🔄 ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  )

  const chartData = {
    labels: ["Sleep", "Activity", "Cardio", "Mental"],
    datasets: [{ data: metrics.map(m => user?.[m.key] ?? 0) }]
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        >
          {/* ── HERO ── */}
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.greeting}>สวัสดี 👋</Text>
                <Text style={styles.headerTitle}>HealthyAI</Text>
              </View>
              <View style={styles.userPill}>
                <TouchableOpacity onPress={() => setUserId(Math.max(0, userId - 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.pillArrow}>◀</Text>
                </TouchableOpacity>
                <Text style={styles.pillId}>#{userId}</Text>
                <TouchableOpacity onPress={() => setUserId(userId + 1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.pillArrow}>▶</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Score Ring */}
            <View style={styles.ringWrap}>
              <View style={[styles.ringOuter, { borderColor: rawScore >= 70 ? "#4ade80" : rawScore >= 50 ? "#fbbf24" : "#f87171" }]}>
                <View style={styles.ringInner}>
                  <Text style={styles.ringScore}>{displayScore.toFixed(1)}</Text>
                  <Text style={styles.ringLabel}>/ 100</Text>
                  <Text style={styles.ringName}>Wellness Score</Text>
                </View>
              </View>
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: diff >= 0 ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)" }]}>
                <Text style={styles.badgeText}>
                  {diff >= 0 ? `📈 +${diff.toFixed(1)} กว่าค่าเฉลี่ย` : `📉 ${diff.toFixed(1)} จากค่าเฉลี่ย`}
                </Text>
              </View>
              {analytics && (
                <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                  <Text style={styles.badgeText}>👥 {analytics.total_users} คน</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* ── TABS ── */}
          <View style={styles.tabWrap}>
            <View style={styles.tabBar}>
              <Animated.View style={[styles.tabIndicator, {
                width: tabWidth - 6,
                transform: [{ translateX: tabAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [3, tabWidth + 3, tabWidth * 2 + 3] }) }]
              }]} />
              {[
                { key: "overview", label: "📊 Overview" },
                { key: "mystats", label: "💚 My Stats" },
                { key: "population", label: "🌍 Compare" },
              ].map((t) => (
                <TouchableOpacity key={t.key} style={[styles.tab, { width: tabWidth }]} onPress={() => setActiveTab(t.key)}>
                  <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ════ OVERVIEW ════ */}
            {activeTab === "overview" && (
              <View style={styles.section}>
                {/* AI Insight */}
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

                {/* Metric Cards */}
                <Text style={styles.sectionTitle}>Health Metrics</Text>
                <View style={styles.metricsGrid}>
                  {metrics.map((m) => {
                    const val = user?.[m.key] ?? 0
                    return (
                      <View key={m.key} style={styles.metricCard}>
                        <Text style={styles.metricEmoji}>{m.emoji}</Text>
                        <Text style={styles.metricName}>{m.label}</Text>
                        <Text style={[styles.metricVal, { color: getScoreColor(val) }]}>{val.toFixed(1)}</Text>
                        <View style={styles.metricBarBg}>
                          <View style={[styles.metricBarFg, { width: `${val}%`, backgroundColor: getScoreColor(val) }]} />
                        </View>
                      </View>
                    )
                  })}
                </View>

                {/* Chart */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>📈 Health Overview</Text>
                  <BarChart
                    data={chartData}
                    width={screenWidth - 64}
                    height={200}
                    fromZero showValuesOnTopOfBars yAxisSuffix=""
                    chartConfig={{
                      backgroundGradientFrom: Colors.card, backgroundGradientTo: Colors.card,
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

            {/* ════ MY STATS ════ */}
            {activeTab === "mystats" && (
              <View style={styles.section}>
                {!formSubmitted ? (
                  <>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoText}>
                        กรอกข้อมูลของคุณ AI จะวิเคราะห์และเปรียบเทียบกับผู้ใช้กว่า{" "}
                        <Text style={{ fontWeight: "bold", color: Colors.primary }}>1,000 คน</Text>
                      </Text>
                    </View>

                    <View style={styles.card}>
                      <Text style={styles.cardTitle}>เพศ</Text>
                      <View style={styles.genderRow}>
                        {[{ key: "male", label: "👨 ชาย" }, { key: "female", label: "👩 หญิง" }].map((g) => (
                          <TouchableOpacity
                            key={g.key}
                            style={[styles.genderBtn, healthForm.gender === g.key && styles.genderBtnActive]}
                            onPress={() => setHealthForm({ ...healthForm, gender: g.key })}
                          >
                            <Text style={[styles.genderText, healthForm.gender === g.key && { color: Colors.primary }]}>{g.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.card}>
                      {[
                        { label: "อายุ (ปี)", key: "age", placeholder: "เช่น 25" },
                        { label: "น้ำหนัก (กก.)", key: "weight", placeholder: "เช่น 65" },
                        { label: "ส่วนสูง (ซม.)", key: "height", placeholder: "เช่น 170" },
                        { label: "ชั่วโมงนอนเฉลี่ยต่อคืน", key: "sleep_hours", placeholder: "เช่น 7" },
                      ].map((f, i) => (
                        <View key={f.key} style={i > 0 ? { marginTop: 14 } : {}}>
                          <Text style={styles.fieldLabel}>{f.label}</Text>
                          <TextInput
                            style={styles.input}
                            placeholder={f.placeholder}
                            placeholderTextColor={Colors.textMuted}
                            value={healthForm[f.key]}
                            onChangeText={(v) => setHealthForm({ ...healthForm, [f.key]: v })}
                            keyboardType="numeric"
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
                          >
                            <Text style={[styles.activityBtnText, healthForm.activity_level === lvl && { color: "#fff" }]}>{lvl}</Text>
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
                      onPress={handleHealthSubmit} disabled={healthLoading}
                    >
                      {healthLoading
                        ? <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.primaryBtnText}>AI กำลังวิเคราะห์...</Text>
                          </View>
                        : <Text style={styles.primaryBtnText}>🔍 วิเคราะห์สุขภาพของฉัน</Text>
                      }
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.resultScoreCard}>
                      <Text style={styles.resultLabel}>Overall Wellness Score</Text>
                      <Text style={[styles.resultBig, { color: getScoreColor(healthResult.overall_score) }]}>
                        {healthResult.overall_score}
                      </Text>
                      <Text style={styles.resultSub}>ดีกว่า {healthResult.percentile}% ของผู้ใช้ {healthResult.total_users} คน</Text>
                    </View>

                    <View style={styles.bmiRow}>
                      <View style={[styles.bmiCard, { flex: 1 }]}>
                        <Text style={styles.bmiLabel}>⚖️ BMI</Text>
                        <Text style={styles.bmiVal}>{healthResult.bmi}</Text>
                        <Text style={[styles.bmiCat, { color: healthResult.bmi_category === "ปกติ" ? Colors.success : Colors.warning }]}>{healthResult.bmi_category}</Text>
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
                        { label: "😴 Sleep", score: healthResult.sleep_score },
                        { label: "🏃 Activity", score: healthResult.activity_score },
                        { label: "❤️ Cardio", score: healthResult.cardiovascular_score },
                        { label: "🧠 Mental", score: healthResult.mental_score },
                      ].map((item) => (
                        <View key={item.label} style={{ marginBottom: 14 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                            <Text style={{ color: Colors.text, fontSize: 14 }}>{item.label}</Text>
                            <Text style={{ color: getScoreColor(item.score), fontWeight: "bold" }}>{item.score.toFixed(1)}</Text>
                          </View>
                          <View style={styles.barBg}>
                            <View style={[styles.barFg, { width: `${item.score}%`, backgroundColor: getScoreColor(item.score) }]} />
                          </View>
                        </View>
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
                        <Text style={{ color: Colors.text, lineHeight: 24, fontSize: 14 }}>{healthResult.advice}</Text>
                      </View>
                    )}

                    <TouchableOpacity style={styles.ghostBtn} onPress={() => { setFormSubmitted(false); setHealthResult(null) }}>
                      <Text style={styles.ghostBtnText}>🔄 กรอกข้อมูลใหม่</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* ════ POPULATION ════ */}
            {activeTab === "population" && (
              <View style={styles.section}>
                <View style={styles.compareCard}>
                  <Text style={styles.cardTitle}>เปรียบเทียบกับค่าเฉลี่ย</Text>
                  <View style={styles.compareRow}>
                    <View style={{ alignItems: "center" }}>
                      <Text style={[styles.compareVal, { color: Colors.primary }]}>{rawScore.toFixed(1)}</Text>
                      <Text style={styles.compareLabel}>คะแนนของคุณ</Text>
                    </View>
                    <View style={styles.vsCircle}><Text style={styles.vsText}>VS</Text></View>
                    <View style={{ alignItems: "center" }}>
                      <Text style={[styles.compareVal, { color: Colors.textMuted }]}>{avgScore.toFixed(1)}</Text>
                      <Text style={styles.compareLabel}>ค่าเฉลี่ยกลาง</Text>
                    </View>
                  </View>
                  <View style={[styles.diffPill, { backgroundColor: diff >= 0 ? "rgba(29,158,117,0.12)" : "rgba(163,45,45,0.1)" }]}>
                    <Text style={{ color: diff >= 0 ? Colors.success : Colors.danger, fontWeight: "bold" }}>
                      {diff >= 0 ? `📈 สูงกว่าค่าเฉลี่ย +${diff.toFixed(1)}` : `📉 ต่ำกว่าค่าเฉลี่ย ${diff.toFixed(1)}`}
                    </Text>
                  </View>
                </View>

                {analytics && (
                  <>
                    <Text style={styles.sectionTitle}>Population Stats</Text>
                    <View style={styles.statsRow}>
                      {[
                        { label: "Avg Wellness", val: analytics.avg_wellness?.toFixed(1) },
                        { label: "Avg Sleep", val: analytics.avg_sleep?.toFixed(1) },
                        { label: "Total Users", val: analytics.total_users },
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
                        const myVal = user?.[m.key] ?? 0
                        const avgVal = 60
                        return (
                          <View key={m.key} style={{ marginBottom: 16 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                              <Text style={{ color: Colors.text, fontSize: 14 }}>{m.emoji} {m.label}</Text>
                              <Text style={{ color: getScoreColor(myVal), fontWeight: "bold", fontSize: 13 }}>
                                {myVal.toFixed(1)} <Text style={{ color: Colors.textMuted, fontWeight: "normal" }}>/ avg {avgVal}</Text>
                              </Text>
                            </View>
                            <View style={styles.dualBar}>
                              <View style={[styles.dualBarFg, { width: `${myVal}%`, backgroundColor: getScoreColor(myVal) }]} />
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

        {/* FAB */}
        <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity style={styles.fab} onPress={() => router.push("/(tabs)/recommendations")}>
            <Text style={{ fontSize: 26 }}>🤖</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  loadingIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accentLight, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  loadingText: { color: Colors.primary, fontWeight: "bold", fontSize: 16 },
  loadingSubtext: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 12, marginTop: 12 },
  header: { padding: 24, paddingTop: 52, paddingBottom: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginTop: 2 },
  userPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  pillArrow: { color: "#fff", fontWeight: "bold" },
  pillId: { color: "#fff", fontWeight: "bold", fontSize: 15, minWidth: 30, textAlign: "center" },
  ringWrap: { alignItems: "center", marginTop: 24 },
  ringOuter: { width: 150, height: 150, borderRadius: 75, borderWidth: 5, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)" },
  ringInner: { alignItems: "center" },
  ringScore: { color: "#fff", fontSize: 42, fontWeight: "bold", lineHeight: 46 },
  ringLabel: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  ringName: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 4 },
  badgeRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 20 },
  badge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  tabWrap: { paddingHorizontal: 16, marginTop: -20 },
  tabBar: { flexDirection: "row", backgroundColor: Colors.card, borderRadius: 16, padding: 3, elevation: 6, shadowColor: Colors.primary, shadowOpacity: 0.1, shadowRadius: 12, position: "relative" },
  tabIndicator: { position: "absolute", height: "85%", top: "7.5%", backgroundColor: Colors.accentLight, borderRadius: 13, borderWidth: 1, borderColor: Colors.border },
  tab: { paddingVertical: 11, alignItems: "center" },
  tabText: { fontSize: 12, color: Colors.textMuted, fontWeight: "600" },
  tabTextActive: { color: Colors.primary },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { color: Colors.text, fontWeight: "bold", fontSize: 14, marginBottom: 10 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 18, marginBottom: 12, elevation: 2, borderWidth: 0.5, borderColor: Colors.border },
  cardTitle: { color: Colors.text, fontWeight: "bold", fontSize: 14, marginBottom: 4 },
  insightCard: { backgroundColor: Colors.accentLight, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  insightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryLight },
  insightTitle: { color: Colors.primary, fontWeight: "bold", fontSize: 13 },
  insightText: { color: Colors.text, fontSize: 13, lineHeight: 22 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  metricCard: { flex: 1, minWidth: "45%", backgroundColor: Colors.card, borderRadius: 14, padding: 14, elevation: 2, borderWidth: 0.5, borderColor: Colors.border },
  metricEmoji: { fontSize: 20 },
  metricName: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  metricVal: { fontSize: 22, fontWeight: "bold", marginTop: 2 },
  metricBarBg: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: 8 },
  metricBarFg: { height: 4, borderRadius: 2 },
  infoCard: { backgroundColor: Colors.accentLight, borderRadius: 14, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: Colors.primaryLight },
  infoText: { color: Colors.text, fontSize: 13, lineHeight: 22 },
  fieldLabel: { color: Colors.text, fontWeight: "600", marginBottom: 8, fontSize: 14 },
  input: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 15 },
  genderRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  genderBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: "center" },
  genderBtnActive: { borderColor: Colors.primaryLight, backgroundColor: Colors.accentLight },
  genderText: { color: Colors.textMuted, fontWeight: "600" },
  activitySelected: { color: Colors.primary, fontWeight: "bold", fontSize: 14, textAlign: "center", marginBottom: 12, marginTop: 4 },
  activityRow: { flexDirection: "row", gap: 8 },
  activityBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  activityBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  activityBtnText: { color: Colors.text, fontWeight: "bold" },
  errorCard: { backgroundColor: "#fde8e8", borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#f5c6c6" },
  errorText: { color: Colors.danger, fontSize: 13 },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, alignItems: "center", marginBottom: 12, elevation: 4 },
  primaryBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  ghostBtn: { backgroundColor: Colors.background, borderRadius: 16, padding: 16, alignItems: "center", marginBottom: 12, borderWidth: 1.5, borderColor: Colors.border },
  ghostBtnText: { color: Colors.primary, fontWeight: "bold", fontSize: 15 },
  resultScoreCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 28, alignItems: "center", marginBottom: 12, elevation: 4, borderWidth: 0.5, borderColor: Colors.border },
  resultLabel: { color: Colors.textMuted, fontSize: 13 },
  resultBig: { fontSize: 72, fontWeight: "bold", marginTop: 4 },
  resultSub: { color: Colors.textMuted, fontSize: 13, marginTop: 6, textAlign: "center" },
  bmiRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  bmiCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 18, alignItems: "center", elevation: 2, borderWidth: 0.5, borderColor: Colors.border },
  bmiLabel: { color: Colors.text, fontWeight: "bold", fontSize: 13 },
  bmiVal: { fontSize: 36, fontWeight: "bold", color: Colors.text, marginTop: 6 },
  bmiCat: { fontSize: 13, fontWeight: "bold", marginTop: 4 },
  barBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4 },
  barFg: { height: 8, borderRadius: 4 },
  adviceCard: { backgroundColor: "#FFFBEB", borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: "#FCD34D" },
  adviceTitle: { color: "#92400E", fontWeight: "bold", marginBottom: 8, fontSize: 14 },
  compareCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 22, marginBottom: 12, elevation: 3, alignItems: "center", borderWidth: 0.5, borderColor: Colors.border },
  compareRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "100%", marginVertical: 16 },
  compareVal: { fontSize: 42, fontWeight: "bold" },
  compareLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  vsCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  vsText: { color: Colors.textMuted, fontWeight: "bold", fontSize: 13 },
  diffPill: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: "center", elevation: 2, borderWidth: 0.5, borderColor: Colors.border },
  statVal: { fontSize: 20, fontWeight: "bold", color: Colors.primary },
  statLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 4, textAlign: "center" },
  dualBar: { height: 8, backgroundColor: Colors.border, borderRadius: 4, position: "relative", overflow: "visible" },
  dualBarFg: { height: 8, borderRadius: 4, position: "absolute" },
  dualBarMark: { position: "absolute", width: 2, height: 14, backgroundColor: Colors.textMuted, top: -3, borderRadius: 1 },
  fabWrap: { position: "absolute", bottom: 30, right: 24 },
  fab: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", elevation: 8 },
})