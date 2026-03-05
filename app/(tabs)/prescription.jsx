import { useState } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../../constants/colors"

const MEDICATIONS = [
  {
    id: 1,
    name: "Lisinopril",
    dose: "10mg",
    frequency: "วันละครั้ง",
    time: "08:00",
    condition: "ความดันโลหิตสูง",
    remaining: 15,
    taken: true,
    doctor: "Dr. Sarah Johnson",
    warning: "ห้ามทานร่วมกับโพแทสเซียมสูง"
  },
  {
    id: 2,
    name: "Metformin",
    dose: "500mg",
    frequency: "วันละ 2 ครั้ง",
    time: "08:00 / 20:00",
    condition: "เบาหวานชนิดที่ 2",
    remaining: 28,
    taken: false,
    doctor: "Dr. Michael Chen",
    warning: "ทานพร้อมอาหาร ห้ามทานตอนท้องว่าง"
  },
  {
    id: 3,
    name: "Vitamin D3",
    dose: "1000 IU",
    frequency: "วันละครั้ง",
    time: "12:00",
    condition: "เสริมวิตามิน",
    remaining: 60,
    taken: false,
    doctor: "Dr. Sarah Johnson",
    warning: null
  },
]

const SCHEDULE = [
  { time: "08:00", meds: ["Lisinopril 10mg", "Metformin 500mg"], status: "taken" },
  { time: "12:00", meds: ["Vitamin D3 1000IU"], status: "upcoming" },
  { time: "20:00", meds: ["Metformin 500mg"], status: "upcoming" },
]

export default function Prescription() {
  const [tab, setTab] = useState("current")
  const [takenStatus, setTakenStatus] = useState({ 1: true, 2: false, 3: false })
  const [notifications, setNotifications] = useState(true)

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={[Colors.primary, "#15803D"]} style={styles.header}>
          <Text style={styles.greeting}>จัดการยา 💊</Text>
          <Text style={styles.headerTitle}>Smart Prescription</Text>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>3</Text>
            <Text style={styles.statLabel}>ยาทั้งหมด</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>1</Text>
            <Text style={styles.statLabel}>ทานแล้ววันนี้</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.warning }]}>2</Text>
            <Text style={styles.statLabel}>รอทาน</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {[
            { key: "current", label: "💊 ยาปัจจุบัน" },
            { key: "schedule", label: "⏰ ตารางเวลา" },
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

        {/* Current Medications */}
        {tab === "current" && MEDICATIONS.map((med) => (
          <View key={med.id} style={styles.medCard}>
            <View style={styles.medHeader}>
              <View>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDose}>{med.dose} • {med.frequency}</Text>
                <Text style={styles.medCondition}>{med.condition}</Text>
              </View>
              <TouchableOpacity
                style={[styles.takenBtn, takenStatus[med.id] && styles.takenBtnActive]}
                onPress={() => setTakenStatus(prev => ({ ...prev, [med.id]: !prev[med.id] }))}
              >
                <Text style={styles.takenText}>
                  {takenStatus[med.id] ? "✅ ทานแล้ว" : "ทานยา"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.medInfo}>
              <Text style={styles.medInfoText}>⏰ {med.time}</Text>
              <Text style={styles.medInfoText}>📦 เหลือ {med.remaining} วัน</Text>
            </View>

            <Text style={styles.medDoctor}>👨‍⚕️ {med.doctor}</Text>

            {med.warning && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>⚠️ {med.warning}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Schedule */}
        {tab === "schedule" && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📅 ตารางวันนี้</Text>
              {SCHEDULE.map((s, i) => (
                <View key={i} style={styles.scheduleItem}>
                  <View style={[styles.timeDot, s.status === "taken" && styles.timeDotTaken]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduleTime}>{s.time}</Text>
                    {s.meds.map((m, j) => (
                      <Text key={j} style={styles.schedMed}>• {m}</Text>
                    ))}
                  </View>
                  <Text style={[
                    styles.schedStatus,
                    { color: s.status === "taken" ? Colors.primary : Colors.warning }
                  ]}>
                    {s.status === "taken" ? "✅ ทานแล้ว" : "รอทาน"}
                  </Text>
                </View>
              ))}
            </View>

            {/* Notification Settings */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔔 การแจ้งเตือน</Text>
              <View style={styles.notifRow}>
                <Text style={styles.notifLabel}>เปิดการแจ้งเตือน</Text>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ true: Colors.primary }}
                />
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
  statsRow: { flexDirection: "row", margin: 16, gap: 8 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 16, alignItems: "center", elevation: 2 },
  statValue: { fontSize: 28, fontWeight: "bold" },
  statLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 4, textAlign: "center" },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, backgroundColor: Colors.border, borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: Colors.card, elevation: 2 },
  tabText: { color: Colors.textMuted, fontSize: 13, fontWeight: "500" },
  tabTextActive: { color: Colors.primary, fontWeight: "bold" },
  medCard: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 20, elevation: 2 },
  medHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  medName: { fontSize: 18, fontWeight: "bold", color: Colors.text },
  medDose: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  medCondition: { color: Colors.primary, fontSize: 12, marginTop: 4, fontWeight: "600" },
  takenBtn: { backgroundColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  takenBtnActive: { backgroundColor: "rgba(22,163,74,0.15)" },
  takenText: { color: Colors.primary, fontWeight: "bold", fontSize: 13 },
  medInfo: { flexDirection: "row", gap: 16, marginTop: 12 },
  medInfoText: { color: Colors.textMuted, fontSize: 13 },
  medDoctor: { color: Colors.textMuted, fontSize: 12, marginTop: 8 },
  warningBox: { backgroundColor: "#FEF3C7", borderRadius: 10, padding: 10, marginTop: 10 },
  warningText: { color: "#92400E", fontSize: 12 },
  card: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 20, elevation: 2 },
  cardTitle: { color: Colors.text, fontWeight: "bold", fontSize: 15, marginBottom: 16 },
  scheduleItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  timeDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.warning, marginTop: 4 },
  timeDotTaken: { backgroundColor: Colors.primary },
  scheduleTime: { color: Colors.text, fontWeight: "bold", fontSize: 15 },
  schedMed: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  schedStatus: { fontSize: 12, fontWeight: "600" },
  notifRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  notifLabel: { color: Colors.text, fontSize: 15 },
})