import { useEffect, useState, useRef } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Dimensions, RefreshControl
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BarChart } from "react-native-chart-kit"
import { useRouter } from "expo-router"
import { Colors } from "../../constants/colors"

const BASE_URL = "https://healthy-ai.onrender.com"

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [userId, setUserId] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)

  const screenWidth = Dimensions.get("window").width
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current
  const animatedScore = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  const theme = darkMode
    ? { bg: "#0F172A", card: "#1E293B", text: "#F1F5F9", muted: "#94A3B8" }
    : { bg: Colors.background, card: Colors.card, text: Colors.text, muted: Colors.textMuted }

  useEffect(() => { fetchData() }, [userId])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start()
  }, [])

  useEffect(() => {
    if (user?.Overall_Wellness_Score) {
      Animated.timing(animatedScore, {
        toValue: user.Overall_Wellness_Score,
        duration: 800,
        useNativeDriver: false,
      }).start()
      const listener = animatedScore.addListener(({ value }) => setDisplayScore(value))
      return () => animatedScore.removeListener(listener)
    }
  }, [user])

  const fetchData = async () => {
    setError(null)
    try {
      const [u, a] = await Promise.all([
        fetch(`${BASE_URL}/user/${userId}`).then(r => r.json()),
        fetch(`${BASE_URL}/analytics`).then(r => r.json())
      ])
      setUser(u)
      setAnalytics(a)
    } catch (e) {
      setError("ไม่สามารถโหลดข้อมูลได้")
    }
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  if (loading) return (
    <View style={[styles.container, { padding: 20, backgroundColor: theme.bg }]}>
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
      <View style={styles.skeletonCard} />
    </View>
  )

  if (error) return (
    <View style={styles.center}>
      <Text style={{ color: Colors.danger, fontSize: 16 }}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
        <Text style={{ color: Colors.white, fontWeight: "bold" }}>🔄 ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  )

  const rawScore = user?.Overall_Wellness_Score ?? 0
  const avgScore = analytics?.avg_wellness ?? 0
  const diff = rawScore - avgScore

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

  const metrics = [
    { label: "😴 Sleep", key: "Sleep_Health_Score" },
    { label: "🏃 Activity", key: "Activity_Health_Score" },
    { label: "❤️ Cardio", key: "Cardiovascular_Health_Score" },
    { label: "🧠 Mental", key: "Mental_Health_Score" },
  ]

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.bg }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={[Colors.primary, "#15803D"]} style={styles.header}>
          <Text style={styles.greeting}>สวัสดี 👋</Text>
          <Text style={styles.headerTitle}>HealthyAI Dashboard</Text>
          <TouchableOpacity onPress={() => setDarkMode(!darkMode)} style={styles.darkBtn}>
            <Text style={{ fontSize: 20 }}>{darkMode ? "🌙" : "☀️"}</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* User Selector */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.muted, marginBottom: 8, textAlign: "center" }}>เลือก User</Text>
            <View style={styles.selectorRow}>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setUserId(Math.max(0, userId - 1))}
              >
                <Text style={styles.selectorBtnText}>◀</Text>
              </TouchableOpacity>
              <Text style={[styles.selectorValue, { color: theme.text }]}>{userId}</Text>
              <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setUserId(userId + 1)}
              >
                <Text style={styles.selectorBtnText}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Score Card */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.muted, fontSize: 14 }}>Overall Wellness Score</Text>
            <Text style={[styles.bigScore, { color: Colors.primary }]}>
              {displayScore.toFixed(2)}
            </Text>
            <Text style={{ color: diff >= 0 ? Colors.success : Colors.danger, marginTop: 8 }}>
              {diff >= 0
                ? `📈 สูงกว่าค่าเฉลี่ย ${diff.toFixed(2)}`
                : `📉 ต่ำกว่าค่าเฉลี่ย ${Math.abs(diff).toFixed(2)}`}
            </Text>
          </View>

          {/* AI Insight */}
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>🤖 AI Insight</Text>
            <Text style={styles.aiText}>
              {rawScore >= 70
                ? "คุณมีสุขภาพดี รักษาพฤติกรรมนี้ต่อไปนะครับ 💪"
                : "ควรเพิ่มคุณภาพการนอนและกิจกรรมเพื่อเพิ่มคะแนนสุขภาพ"}
            </Text>
          </View>

          {/* Metric Bars */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.text, fontWeight: "bold", marginBottom: 16 }}>
              💪 Health Metrics
            </Text>
            {metrics.map((item) => {
              const val = user?.[item.key] ?? 0
              const barColor = val >= 70 ? Colors.primary : val >= 50 ? Colors.warning : Colors.danger
              return (
                <View key={item.key} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ color: theme.text, fontSize: 14 }}>{item.label}</Text>
                    <Text style={{ color: barColor, fontWeight: "bold" }}>{val?.toFixed(2)}</Text>
                  </View>
                  <View style={{ height: 10, backgroundColor: Colors.border, borderRadius: 5 }}>
                    <View style={{
                      height: 10,
                      width: `${val}%`,
                      backgroundColor: barColor,
                      borderRadius: 5
                    }} />
                  </View>
                </View>
              )
            })}
          </View>

          {/* Bar Chart */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.text, fontWeight: "bold", marginBottom: 8 }}>
              📊 Health Overview
            </Text>
            <BarChart
              data={chartData}
              width={screenWidth - 64}
              height={220}
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              chartConfig={{
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(22,163,74,${opacity})`,
                labelColor: () => theme.text,
                formatTopBarValue: (value) => value.toFixed(1),
              }}
              style={{ marginTop: 8, borderRadius: 16 }}
            />
          </View>

          {/* Stats */}
          {analytics && (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={{ color: theme.text, fontWeight: "bold", marginBottom: 12 }}>
                🌍 Population Stats
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>
                    {analytics.avg_wellness?.toFixed(2)}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 12 }}>Avg Wellness</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>
                    {analytics.avg_sleep?.toFixed(2)}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 12 }}>Avg Sleep</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>
                    {analytics.total_users}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 12 }}>Total Users</Text>
                </View>
              </View>
            </View>
          )}

        </Animated.View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/(tabs)/recommendations")}
        >
          <Text style={styles.fabText}>🤖</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 24, paddingTop: 48, paddingBottom: 32 },
  greeting: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 4 },
  darkBtn: { position: "absolute", right: 20, top: 48 },
  card: { margin: 16, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  bigScore: { fontSize: 72, fontWeight: "bold" },
  aiCard: { marginHorizontal: 16, marginTop: 0, borderRadius: 20, padding: 20, backgroundColor: "rgba(22,163,74,0.1)", borderWidth: 1, borderColor: "rgba(22,163,74,0.3)" },
  aiTitle: { fontWeight: "bold", marginBottom: 6, color: Colors.primary },
  aiText: { color: Colors.text, lineHeight: 22 },
  skeletonCard: { height: 120, backgroundColor: "#E2E8F0", borderRadius: 16, marginBottom: 16 },
  selectorRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 },
  selectorBtn: { backgroundColor: Colors.border, borderRadius: 10, padding: 10 },
  selectorBtnText: { color: Colors.primary, fontWeight: "bold", fontSize: 16 },
  selectorValue: { fontSize: 24, fontWeight: "bold", minWidth: 40, textAlign: "center" },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "bold" },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 12, marginTop: 12 },
  fabWrap: { position: "absolute", bottom: 30, right: 24 },
  fab: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: Colors.primary, shadowOpacity: 0.4, shadowRadius: 10 },
  fabText: { fontSize: 28 },
})