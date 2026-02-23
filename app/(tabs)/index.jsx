import { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native"
import { Colors } from "../../constants/colors"

const BASE_URL = "https://healthy-ai.onrender.com"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(0)

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [u, a] = await Promise.all([
        fetch(`${BASE_URL}/user/${userId}`).then(r => r.json()),
        fetch(`${BASE_URL}/analytics`).then(r => r.json())
      ])
      setUser(u)
      setAnalytics(a)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
    </View>
  )

  const score = user?.Overall_Wellness_Score?.toFixed(1)
  const getRiskColor = (s) => s >= 70 ? Colors.success : s >= 50 ? Colors.warning : Colors.danger
  const getRiskText = (s) => s >= 70 ? "✅ สุขภาพดี" : s >= 50 ? "⚠️ ควรระวัง" : "🚨 ต้องดูแล"

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>สวัสดี 👋</Text>
        <Text style={styles.headerTitle}>HealthyAI Dashboard</Text>
      </View>

      {/* User Selector */}
      <View style={styles.selectorCard}>
        <Text style={styles.selectorLabel}>เลือก User ID: {userId}</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={styles.selectorBtn}
            onPress={() => setUserId(Math.max(0, userId - 1))}
          >
            <Text style={styles.selectorBtnText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.selectorValue}>{userId}</Text>
          <TouchableOpacity
            style={styles.selectorBtn}
            onPress={() => setUserId(userId + 1)}
          >
            <Text style={styles.selectorBtnText}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Wellness Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Overall Wellness Score</Text>
        <Text style={[styles.bigScore, { color: getRiskColor(score) }]}>{score}</Text>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(score) + "20" }]}>
          <Text style={[styles.riskText, { color: getRiskColor(score) }]}>{getRiskText(score)}</Text>
        </View>
      </View>

      {/* Metrics */}
      <Text style={styles.sectionTitle}>📊 Health Metrics</Text>
      {[
        { label: "😴 Sleep", key: "Sleep_Health_Score", icon: "😴" },
        { label: "🏃 Activity", key: "Activity_Health_Score", icon: "🏃" },
        { label: "❤️ Cardio", key: "Cardiovascular_Health_Score", icon: "❤️" },
        { label: "🧠 Mental", key: "Mental_Health_Score", icon: "🧠" },
      ].map((item) => {
        const val = user?.[item.key] ?? 0
        return (
          <View key={item.key} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <View style={styles.metricBarBg}>
              <View style={[styles.metricBarFill, {
                width: `${val}%`,
                backgroundColor: val >= 70 ? Colors.primary : val >= 50 ? Colors.warning : Colors.danger
              }]} />
            </View>
            <Text style={styles.metricValue}>{val?.toFixed(1)}</Text>
          </View>
        )
      })}

      {/* Stats */}
      {analytics && (
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>🌍 Population Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.avg_wellness?.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Wellness</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.avg_sleep?.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Avg Sleep</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.total_users}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  loadingText: { color: Colors.textMuted, marginTop: 12 },
  header: { backgroundColor: Colors.primary, padding: 24, paddingTop: 48 },
  greeting: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: "bold", marginTop: 4 },
  selectorCard: { backgroundColor: Colors.card, margin: 16, borderRadius: 16, padding: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  selectorLabel: { color: Colors.textMuted, marginBottom: 8 },
  selectorRow: { flexDirection: "row", alignItems: "center", gap: 24 },
  selectorBtn: { backgroundColor: Colors.border, borderRadius: 10, padding: 10 },
  selectorBtnText: { color: Colors.primary, fontWeight: "bold", fontSize: 16 },
  selectorValue: { fontSize: 24, fontWeight: "bold", color: Colors.text, minWidth: 40, textAlign: "center" },
  scoreCard: { backgroundColor: Colors.card, margin: 16, marginTop: 0, borderRadius: 20, padding: 24, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  scoreLabel: { color: Colors.textMuted, fontSize: 14, marginBottom: 8 },
  bigScore: { fontSize: 72, fontWeight: "bold" },
  riskBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 8 },
  riskText: { fontWeight: "bold", fontSize: 14 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: "bold", marginHorizontal: 16, marginBottom: 8, marginTop: 8 },
  metricCard: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  metricLabel: { color: Colors.text, fontSize: 15, width: 100 },
  metricBarBg: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, marginHorizontal: 12 },
  metricBarFill: { height: 8, borderRadius: 4 },
  metricValue: { color: Colors.text, fontWeight: "bold", width: 40, textAlign: "right" },
  statsCard: { backgroundColor: Colors.card, margin: 16, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "bold", color: Colors.primary },
  statLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
})