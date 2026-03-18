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

  if (loading && !analytics) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
      <Text style={{ fontSize: 48 }}>📊</Text>
      <Text style={{ color: Colors.primary, fontWeight: "bold", fontSize: 16, marginTop: 12 }}>กำลังโหลด...</Text>
    </View>
  )

  if (error) return (
    <View style={styles.center}>
      <Text style={{ color: Colors.danger }}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
        <Text style={{ color: Colors.white, fontWeight: "bold" }}>🔄 ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  )

  const segmentData = Object.entries(analytics?.segments ?? {}).map(([key, value], index) => ({
    name: `Segment ${key}`,
    population: value,
    color: ["#16A34A", "#22C55E", "#4ADE80", "#86EFAC"][index] ?? "#ccc",
    legendFontColor: Colors.text,
    legendFontSize: 13,
  }))

  const barData = {
    labels: ["Wellness", "Sleep"],
    datasets: [{ data: [analytics?.avg_wellness ?? 0, analytics?.avg_sleep ?? 0] }]
  }

  const lineData = {
    labels: ["S1", "S2", "S3", "S4"],
    datasets: [{
      data: Object.values(analytics?.segments ?? {}).map(Number),
      color: (opacity = 1) => `rgba(22,163,74,${opacity})`,
      strokeWidth: 2
    }]
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={[Colors.primary, "#15803D"]} style={styles.header}>
          <Text style={styles.greeting}>ภาพรวมทั้งหมด 📊</Text>
          <Text style={styles.headerTitle}>Population Analytics</Text>
        </LinearGradient>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{analytics?.total_users}</Text>
            <Text style={styles.summaryLabel}>Total Users</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{analytics?.avg_wellness?.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Avg Wellness</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{analytics?.avg_sleep?.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Avg Sleep</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 Average Health Scores</Text>
          <BarChart
            data={barData}
            width={screenWidth - 64}
            height={200}
            yAxisSuffix=""
            fromZero
            showValuesOnTopOfBars
            chartConfig={{
              backgroundGradientFrom: Colors.card,
              backgroundGradientTo: Colors.card,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(22,163,74,${opacity})`,
              labelColor: () => Colors.text,
              formatTopBarValue: (value) => value.toFixed(1),
            }}
            style={{ borderRadius: 16, marginTop: 8 }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🥧 User Segments</Text>
          <PieChart
            data={segmentData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{ color: (opacity = 1) => `rgba(22,163,74,${opacity})` }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="16"
            style={{ borderRadius: 16, marginTop: 8 }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📉 Segment Distribution</Text>
          <LineChart
            data={lineData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{
              backgroundGradientFrom: Colors.card,
              backgroundGradientTo: Colors.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(22,163,74,${opacity})`,
              labelColor: () => Colors.text,
              propsForDots: { r: "6", strokeWidth: "2", stroke: Colors.primary }
            }}
            bezier
            style={{ borderRadius: 16, marginTop: 8 }}
          />
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>💡 AI Insight</Text>
          <Text style={styles.insightText}>
            {analytics?.avg_wellness >= 70
              ? `ผู้ใช้ ${analytics?.total_users} คน มีสุขภาพโดยรวมดี คะแนนเฉลี่ย ${analytics?.avg_wellness?.toFixed(2)}/100`
              : `ผู้ใช้ส่วนใหญ่ควรปรับปรุงด้านการนอนและออกกำลังกายให้มากขึ้น`}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 24, paddingTop: 48, paddingBottom: 32 },
  greeting: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 4 },
  summaryRow: { flexDirection: "row", margin: 16, gap: 8 },
  summaryCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryValue: { fontSize: 22, fontWeight: "bold", color: Colors.primary },
  summaryLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 4, textAlign: "center" },
  card: { backgroundColor: Colors.card, margin: 16, marginTop: 0, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardTitle: { color: Colors.text, fontWeight: "bold", fontSize: 15 },
  insightCard: { marginHorizontal: 16, marginTop: 0, borderRadius: 20, padding: 20, backgroundColor: "rgba(22,163,74,0.1)", borderWidth: 1, borderColor: "rgba(22,163,74,0.3)" },
  insightTitle: { fontWeight: "bold", marginBottom: 6, color: Colors.primary },
  insightText: { color: Colors.text, lineHeight: 22 },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 12, marginTop: 12 },
})