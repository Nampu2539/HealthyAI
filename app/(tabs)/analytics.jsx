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

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
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

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false) }

  if (loading && !analytics) return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIconWrap}><Text style={{ fontSize: 36 }}>📊</Text></View>
      <Text style={styles.loadingText}>กำลังโหลด...</Text>
    </View>
  )

  if (error) return (
    <View style={styles.loadingContainer}>
      <Text style={{ color: Colors.danger }}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>🔄 ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  )

  const segmentData = Object.entries(analytics?.segments ?? {}).map(([key, value], i) => ({
    name: `Seg ${key}`,
    population: value,
    color: [Colors.primary, Colors.primaryLight, Colors.success, "#8b5cf6"][i] ?? "#ccc",
    legendFontColor: Colors.text,
    legendFontSize: 12,
  }))

  const barData = {
    labels: ["Wellness", "Sleep"],
    datasets: [{ data: [analytics?.avg_wellness ?? 0, analytics?.avg_sleep ?? 0] }]
  }

  const lineData = {
    labels: ["S1", "S2", "S3", "S4"],
    datasets: [{
      data: Object.values(analytics?.segments ?? {}).map(Number),
      color: (opacity = 1) => `rgba(27,58,107,${opacity})`,
      strokeWidth: 2,
    }]
  }

  const summaryItems = [
    { label: "Total Users", value: analytics?.total_users, emoji: "👥" },
    { label: "Avg Wellness", value: analytics?.avg_wellness?.toFixed(1), emoji: "💚" },
    { label: "Avg Sleep", value: analytics?.avg_sleep?.toFixed(1), emoji: "😴" },
  ]

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
          <Text style={styles.greeting}>ภาพรวมทั้งหมด</Text>
          <Text style={styles.headerTitle}>Population Analytics</Text>
          <Text style={styles.headerSub}>ข้อมูลจากผู้ใช้ {analytics?.total_users ?? "—"} คน</Text>
        </LinearGradient>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {summaryItems.map((s) => (
            <View key={s.label} style={styles.summaryCard}>
              <Text style={styles.summaryEmoji}>{s.emoji}</Text>
              <Text style={styles.summaryValue}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 Average Health Scores</Text>
          <BarChart
            data={barData}
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

        {/* Pie Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🥧 User Segments</Text>
          <PieChart
            data={segmentData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{ color: (o = 1) => `rgba(27,58,107,${o})` }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="16"
            style={{ borderRadius: 12, marginTop: 8 }}
          />
        </View>

        {/* Line Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📉 Segment Distribution</Text>
          <LineChart
            data={lineData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{
              backgroundGradientFrom: Colors.card, backgroundGradientTo: Colors.card,
              decimalPlaces: 0,
              color: (o = 1) => `rgba(27,58,107,${o})`,
              labelColor: () => Colors.text,
              propsForDots: { r: "5", strokeWidth: "2", stroke: Colors.primary },
            }}
            bezier
            style={{ borderRadius: 12, marginTop: 8 }}
          />
        </View>

        {/* AI Insight */}
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
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background },
  loadingIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.accentLight, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  loadingText: { color: Colors.primary, fontWeight: "bold", fontSize: 15 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 12, marginTop: 12 },
  header: { padding: 24, paddingTop: 52, paddingBottom: 36 },
  greeting: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginTop: 2 },
  headerSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 },
  summaryRow: { flexDirection: "row", margin: 16, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 14, alignItems: "center", elevation: 3, borderWidth: 0.5, borderColor: Colors.border },
  summaryEmoji: { fontSize: 22, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: "bold", color: Colors.primary },
  summaryLabel: { color: Colors.textMuted, fontSize: 10, marginTop: 3, textAlign: "center" },
  card: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 18, elevation: 2, borderWidth: 0.5, borderColor: Colors.border },
  cardTitle: { color: Colors.text, fontWeight: "bold", fontSize: 14 },
  insightCard: { backgroundColor: Colors.accentLight, marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.border },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  insightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryLight },
  insightTitle: { color: Colors.primary, fontWeight: "bold", fontSize: 13 },
  insightText: { color: Colors.text, lineHeight: 22, fontSize: 13 },
})