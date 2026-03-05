import { useState, useEffect, useRef } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { Colors } from "../../constants/colors"

const screenWidth = Dimensions.get("window").width

export default function Monitoring() {
  const [tab, setTab] = useState("vitals")
  const [heartRate, setHeartRate] = useState(72)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Simulate real-time heart rate
    const interval = setInterval(() => {
      setHeartRate(prev => {
        const change = Math.floor(Math.random() * 5) - 2
        return Math.max(60, Math.min(100, prev + change))
      })
    }, 2000)

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start()

    return () => clearInterval(interval)
  }, [])

  const heartData = {
    labels: ["1m", "2m", "3m", "4m", "5m", "now"],
    datasets: [{
      data: [68, 72, 75, 71, 74, heartRate],
      color: (opacity = 1) => `rgba(239,68,68,${opacity})`,
      strokeWidth: 2
    }]
  }

  const bpData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [{
      data: [120, 118, 122, 119, 121, 120],
      color: (opacity = 1) => `rgba(59,130,246,${opacity})`,
      strokeWidth: 2
    }]
  }

  const chartConfig = {
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(22,163,74,${opacity})`,
    labelColor: () => Colors.textMuted,
    propsForDots: { r: "4", strokeWidth: "2" }
  }

  const VITALS = [
    { icon: "❤️", label: "Heart Rate", value: `${heartRate}`, unit: "bpm", status: "normal", live: true },
    { icon: "🩺", label: "Blood Pressure", value: "120/80", unit: "mmHg", status: "normal", live: false },
    { icon: "🌡️", label: "Temperature", value: "36.6", unit: "°C", status: "normal", live: false },
    { icon: "💨", label: "Blood Oxygen", value: "98", unit: "%", status: "normal", live: false },
  ]

  const FITNESS = [
    { icon: "👣", label: "Steps", value: "8,542", goal: "10,000", percent: 85 },
    { icon: "🔥", label: "Calories", value: "1,847", goal: "2,200", percent: 84 },
    { icon: "📍", label: "Distance", value: "4.2 km", goal: "5.0 km", percent: 84 },
    { icon: "⏱️", label: "Active Time", value: "67 min", goal: "90 min", percent: 74 },
  ]

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={[Colors.primary, "#15803D"]} style={styles.header}>
          <Text style={styles.greeting}>ติดตามสุขภาพ 📊</Text>
          <Text style={styles.headerTitle}>Health Monitoring</Text>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[
            { key: "vitals", label: "❤️ Vitals" },
            { key: "fitness", label: "🏃 Fitness" },
            { key: "sleep", label: "😴 Sleep" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vitals Tab */}
        {tab === "vitals" && (
          <View>
            {VITALS.map((v, i) => (
              <View key={i} style={styles.vitalCard}>
                <View style={styles.vitalLeft}>
                  <Text style={styles.vitalIcon}>{v.icon}</Text>
                  <View>
                    <Text style={styles.vitalLabel}>{v.label}</Text>
                    {v.live && (
                      <View style={styles.liveRow}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>Live</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.vitalRight}>
                  {v.live ? (
                    <Animated.Text style={[styles.vitalValue, { transform: [{ scale: pulseAnim }] }]}>
                      {v.value}
                    </Animated.Text>
                  ) : (
                    <Text style={styles.vitalValue}>{v.value}</Text>
                  )}
                  <Text style={styles.vitalUnit}>{v.unit}</Text>
                  <View style={styles.normalBadge}>
                    <Text style={styles.normalText}>✓ ปกติ</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Heart Rate Chart */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>❤️ Heart Rate (5 นาทีล่าสุด)</Text>
              <LineChart
                data={heartData}
                width={screenWidth - 64}
                height={160}
                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(239,68,68,${opacity})` }}
                bezier
                style={{ borderRadius: 12, marginTop: 8 }}
              />
            </View>

            {/* BP Chart */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🩺 Blood Pressure (7 วัน)</Text>
              <LineChart
                data={bpData}
                width={screenWidth - 64}
                height={160}
                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(59,130,246,${opacity})` }}
                bezier
                style={{ borderRadius: 12, marginTop: 8 }}
              />
            </View>
          </View>
        )}

        {/* Fitness Tab */}
        {tab === "fitness" && (
          <View>
            <View style={styles.fitnessGrid}>
              {FITNESS.map((f, i) => (
                <View key={i} style={styles.fitnessCard}>
                  <Text style={styles.fitnessIcon}>{f.icon}</Text>
                  <Text style={styles.fitnessValue}>{f.value}</Text>
                  <Text style={styles.fitnessGoal}>/ {f.goal}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${f.percent}%` }]} />
                  </View>
                  <Text style={styles.fitnessLabel}>{f.label}</Text>
                  <Text style={styles.fitnessPercent}>{f.percent}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sleep Tab */}
        {tab === "sleep" && (
          <View>
            <View style={styles.sleepCard}>
              <Text style={styles.sleepTitle}>7h 23m</Text>
              <Text style={styles.sleepSub}>การนอนคืนที่ผ่านมา</Text>
              <View style={styles.sleepBadge}>
                <Text style={styles.sleepBadgeText}>ดี 😊</Text>
              </View>
              <View style={styles.sleepGrid}>
                {[
                  { label: "Deep Sleep", value: "2h 15m", color: "#6366F1" },
                  { label: "Light Sleep", value: "4h 32m", color: "#8B5CF6" },
                  { label: "REM Sleep", value: "56m", color: "#A78BFA" },
                  { label: "Awake", value: "40m", color: Colors.textMuted },
                ].map((s, i) => (
                  <View key={i} style={styles.sleepItem}>
                    <Text style={[styles.sleepValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.sleepLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingTop: 48, paddingBottom: 32 },
  greeting: { color: "rgba(255,255,255,0.8)", fontSize: 14 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 4 },
  tabRow: { flexDirection: "row", margin: 16, backgroundColor: Colors.border, borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: Colors.card, elevation: 2 },
  tabText: { color: Colors.textMuted, fontSize: 13 },
  tabTextActive: { color: Colors.primary, fontWeight: "bold" },
  vitalCard: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", elevation: 2 },
  vitalLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  vitalIcon: { fontSize: 28 },
  vitalLabel: { color: Colors.text, fontWeight: "600", fontSize: 15 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" },
  liveText: { color: "#EF4444", fontSize: 11, fontWeight: "bold" },
  vitalRight: { alignItems: "flex-end" },
  vitalValue: { fontSize: 24, fontWeight: "bold", color: Colors.text },
  vitalUnit: { color: Colors.textMuted, fontSize: 12 },
  normalBadge: { backgroundColor: "rgba(22,163,74,0.1)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  normalText: { color: Colors.primary, fontSize: 11, fontWeight: "600" },
  card: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 20, elevation: 2 },
  cardTitle: { color: Colors.text, fontWeight: "bold", fontSize: 15 },
  fitnessGrid: { flexDirection: "row", flexWrap: "wrap", margin: 8 },
  fitnessCard: { width: "46%", backgroundColor: Colors.card, margin: "2%", borderRadius: 16, padding: 16, elevation: 2 },
  fitnessIcon: { fontSize: 28, marginBottom: 8 },
  fitnessValue: { fontSize: 22, fontWeight: "bold", color: Colors.text },
  fitnessGoal: { color: Colors.textMuted, fontSize: 12 },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginVertical: 8 },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  fitnessLabel: { color: Colors.textMuted, fontSize: 12 },
  fitnessPercent: { color: Colors.primary, fontWeight: "bold", fontSize: 13 },
  sleepCard: { backgroundColor: Colors.card, margin: 16, borderRadius: 20, padding: 24, alignItems: "center", elevation: 2 },
  sleepTitle: { fontSize: 48, fontWeight: "bold", color: Colors.text },
  sleepSub: { color: Colors.textMuted, marginTop: 4 },
  sleepBadge: { backgroundColor: "rgba(22,163,74,0.1)", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 8 },
  sleepBadgeText: { color: Colors.primary, fontWeight: "bold" },
  sleepGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 20, gap: 16 },
  sleepItem: { width: "45%", alignItems: "center" },
  sleepValue: { fontSize: 20, fontWeight: "bold" },
  sleepLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
})