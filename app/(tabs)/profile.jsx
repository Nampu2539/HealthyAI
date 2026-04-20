import { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { Colors } from "../../constants/colors"

const MENU_SECTIONS = [
  {
    title: "บัญชีของฉัน",
    items: [
      { icon: "👤", label: "ข้อมูลส่วนตัว", sub: "แก้ไขชื่อและรูปโปรไฟล์" },
      { icon: "🎯", label: "เป้าหมายสุขภาพ", sub: "ตั้งเป้าหมายการออกกำลังกาย" },
      { icon: "🔔", label: "การแจ้งเตือน", sub: "จัดการการแจ้งเตือนทั้งหมด" },
    ]
  },
  {
    title: "ความปลอดภัย",
    items: [
      { icon: "🔒", label: "ความเป็นส่วนตัว", sub: "การจัดการข้อมูลส่วนตัว" },
      { icon: "🛡️", label: "ความปลอดภัย", sub: "รหัสผ่านและการยืนยันตัวตน" },
    ]
  },
  {
    title: "ทั่วไป",
    items: [
      { icon: "❓", label: "ช่วยเหลือ", sub: "คำถามที่พบบ่อย" },
      { icon: "⭐", label: "ให้คะแนนแอป", sub: "บอกเราว่าคุณชอบอะไร" },
      { icon: "📋", label: "เวอร์ชัน 1.0.0", sub: "ข้อมูลแอปพลิเคชัน" },
    ]
  },
]

export default function Profile() {
  const router = useRouter()
  const [healthResult, setHealthResult] = useState(null)
  const [healthForm, setHealthForm] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const savedResult = await AsyncStorage.getItem("healthResult")
        const savedForm   = await AsyncStorage.getItem("healthForm")
        if (savedResult) setHealthResult(JSON.parse(savedResult))
        if (savedForm)   setHealthForm(JSON.parse(savedForm))
      } catch (err) {
        console.error("Profile: ไม่สามารถโหลดข้อมูลได้", err)
      }
    }
    load()
  }, [])

  const handleLogout = async () => {
    Alert.alert(
      "ออกจากระบบ",
      "คุณต้องการล้างข้อมูลสุขภาพและออกจากระบบใช่ไหมครับ?",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ออกจากระบบ",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(["healthForm", "healthResult"])
              router.replace("/")
            } catch (err) {
              console.error("Logout error:", err)
            }
          }
        }
      ]
    )
  }

  const wellnessScore = healthResult?.overall_score ?? null
  const sleepScore    = healthResult?.sleep_score   ?? null
  const activityScore = healthResult?.activity_score ?? null
  const mentalScore   = healthResult?.mental_score  ?? null

  const fmt = (v) => (v !== null ? Number(v).toFixed(1) : "—")

  const stats = [
    { label: "อายุ (ปี)", value: healthForm?.age ?? "—", emoji: "📅" },
    { label: "เพศ", value: healthForm?.gender === "male" ? "ชาย" : healthForm?.gender === "female" ? "หญิง" : "—", emoji: "👤" },
    { label: "คะแนน", value: wellnessScore !== null ? Math.round(wellnessScore) : "—", emoji: "🏆" },
  ]

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
          <View style={styles.avatarWrap}>
            <Text style={{ fontSize: 40 }}>🌿</Text>
          </View>
          <Text style={styles.name}>HealthyAI User</Text>
          <Text style={styles.subtitle}>
            {healthResult ? "ข้อมูลสุขภาพล่าสุด" : "ยังไม่มีข้อมูลสุขภาพ"}
          </Text>

          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <View key={s.label} style={[
                styles.statItem,
                i < stats.length - 1 && { borderRightWidth: 0.5, borderRightColor: "rgba(255,255,255,0.2)" }
              ]}>
                <Text style={styles.statEmoji}>{s.emoji}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Health Summary Card */}
        <View style={styles.healthCard}>
          <View style={styles.insightHeader}>
            <View style={styles.insightDot} />
            <Text style={styles.insightTitle}>สรุปสุขภาพของคุณ</Text>
          </View>
          {healthResult ? (
            <View style={styles.healthRow}>
              {[
                { label: "Wellness",  value: fmt(wellnessScore),  color: Colors.success },
                { label: "Sleep",     value: fmt(sleepScore),     color: Colors.primaryLight },
                { label: "Activity",  value: fmt(activityScore),  color: Colors.warning },
                { label: "Mental",    value: fmt(mentalScore),    color: "#8b5cf6" },
              ].map((item) => (
                <View key={item.label} style={styles.healthItem}>
                  <Text style={[styles.healthValue, { color: item.color }]}>{item.value}</Text>
                  <Text style={styles.healthLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyHealth}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
              <Text style={{ color: Colors.textMuted, fontSize: 13, textAlign: "center" }}>
                ยังไม่มีข้อมูล
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 4 }}>
                กรอกข้อมูลสุขภาพใน Dashboard ก่อนครับ
              </Text>
            </View>
          )}
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, i) => (
                <View key={item.label}>
                  <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                    <View style={styles.menuIconWrap}>
                      <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuSub}>{item.sub}</Text>
                    </View>
                    <Text style={styles.menuArrow}>›</Text>
                  </TouchableOpacity>
                  {i < section.items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Clear Health Data */}
        {healthResult && (
          <TouchableOpacity
            style={styles.clearBtn}
            activeOpacity={0.8}
            onPress={async () => {
              Alert.alert(
                "ล้างข้อมูลสุขภาพ",
                "ต้องการล้างข้อมูลสุขภาพที่บันทึกไว้ใช่ไหมครับ?",
                [
                  { text: "ยกเลิก", style: "cancel" },
                  {
                    text: "ล้างข้อมูล",
                    style: "destructive",
                    onPress: async () => {
                      await AsyncStorage.multiRemove(["healthForm", "healthResult"])
                      setHealthResult(null)
                      setHealthForm(null)
                    }
                  }
                ]
              )
            }}
          >
            <Text style={styles.clearText}>🗑️ ล้างข้อมูลสุขภาพ</Text>
          </TouchableOpacity>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>🚪 ออกจากระบบ</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingTop: 52, paddingBottom: 32, alignItems: "center" },
  avatarWrap: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
    marginBottom: 12, borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
  },
  name:     { color: "#fff", fontSize: 22, fontWeight: "bold" },
  subtitle: { color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: "row", marginTop: 24, width: "100%" },
  statItem: { flex: 1, alignItems: "center" },
  statEmoji: { fontSize: 18, marginBottom: 4 },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  statLabel: { color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2, textAlign: "center" },

  healthCard: {
    backgroundColor: Colors.card, marginHorizontal: 16, marginTop: -16,
    borderRadius: 20, padding: 18, elevation: 6,
    borderWidth: 0.5, borderColor: Colors.border, marginBottom: 8,
  },
  insightHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  insightDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryLight },
  insightTitle:  { color: Colors.primary, fontWeight: "bold", fontSize: 13 },
  healthRow:     { flexDirection: "row", justifyContent: "space-between" },
  healthItem:    { alignItems: "center" },
  healthValue:   { fontSize: 20, fontWeight: "bold" },
  healthLabel:   { color: Colors.textMuted, fontSize: 10, marginTop: 3 },
  emptyHealth:   { alignItems: "center", paddingVertical: 12 },

  sectionWrap:  { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: {
    color: Colors.textMuted, fontSize: 12, fontWeight: "600",
    marginBottom: 8, paddingLeft: 4,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: Colors.card, borderRadius: 16,
    overflow: "hidden", borderWidth: 0.5, borderColor: Colors.border, elevation: 2,
  },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.accentLight,
    justifyContent: "center", alignItems: "center",
  },
  menuLabel: { color: Colors.text, fontSize: 15, fontWeight: "500" },
  menuSub:   { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  menuArrow: { color: Colors.textMuted, fontSize: 22 },
  divider:   { height: 0.5, backgroundColor: Colors.border, marginLeft: 68 },

  clearBtn: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 16, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  clearText: { color: Colors.textMuted, fontWeight: "600", fontSize: 14 },

  logoutBtn: {
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: Colors.card, borderRadius: 16,
    padding: 16, alignItems: "center",
    borderWidth: 1, borderColor: "#f5c6c6",
  },
  logoutText: { color: Colors.danger, fontWeight: "bold", fontSize: 15 },
})