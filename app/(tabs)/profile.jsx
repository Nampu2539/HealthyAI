import { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"

// ── Design Tokens ─────────────────────────────────────────────────────────────
const P = {
  navy:        "#0B1D3A",
  navyMid:     "#152D56",
  navyLight:   "#1E3F72",
  accent:      "#3B82F6",
  accentSoft:  "#EFF6FF",
  emerald:     "#10B981",
  emeraldSoft: "#ECFDF5",
  rose:        "#F43F5E",
  roseSoft:    "#FFF1F2",
  amber:       "#F59E0B",
  text:        "#0F172A",
  textMuted:   "#64748B",
  textLight:   "#94A3B8",
  border:      "rgba(15,23,42,0.07)",
  borderMed:   "rgba(15,23,42,0.12)",
  surface:     "#FFFFFF",
  bg:          "#F5F7FB",
}

const scoreColor = (v) =>
  v >= 70 ? P.emerald : v >= 50 ? P.amber : v > 0 ? P.rose : P.textLight

// ── Reusable: Avatar ──────────────────────────────────────────────────────────
function Avatar({ size = 88 }) {
  return (
    <View style={[avStyles.ring, { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 }]}>
      <LinearGradient
        colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.08)"]}
        style={[avStyles.inner, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Text style={{ fontSize: size * 0.42 }}>🌿</Text>
      </LinearGradient>
    </View>
  )
}
const avStyles = StyleSheet.create({
  ring:  { justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)" },
  inner: { justifyContent: "center", alignItems: "center" },
})

// ── Reusable: Score Gauge ─────────────────────────────────────────────────────
function ScoreGauge({ label, value, color }) {
  const hasData = value !== null && value !== undefined
  const display = hasData ? Number(value).toFixed(1) : "—"
  return (
    <View style={gaugeStyles.wrap}>
      <Text style={[gaugeStyles.val, { color: hasData ? color : P.textLight }]}>{display}</Text>
      <View style={[gaugeStyles.track, { marginTop: 6 }]}>
        <View style={[gaugeStyles.fill, { width: hasData ? `${Math.min(Number(value), 100)}%` : "0%", backgroundColor: color }]} />
      </View>
      <Text style={gaugeStyles.label}>{label}</Text>
    </View>
  )
}
const gaugeStyles = StyleSheet.create({
  wrap:  { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  val:   { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  track: { width: "100%", height: 3, backgroundColor: "rgba(148,163,184,0.2)", borderRadius: 2, overflow: "hidden" },
  fill:  { height: 3, borderRadius: 2 },
  label: { fontSize: 10, color: P.textLight, marginTop: 5, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },
})

// ── Reusable: Menu Row ────────────────────────────────────────────────────────
function MenuRow({ icon, label, sub, onPress, isLast, accent }) {
  return (
    <>
      <TouchableOpacity style={menuStyles.row} onPress={onPress} activeOpacity={0.65}>
        <View style={[menuStyles.iconBox, accent && { backgroundColor: accent + "15" }]}>
          <Text style={menuStyles.icon}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[menuStyles.label, accent && { color: accent }]}>{label}</Text>
          {sub ? <Text style={menuStyles.sub}>{sub}</Text> : null}
        </View>
        <Text style={[menuStyles.arrow, accent && { color: accent + "80" }]}>›</Text>
      </TouchableOpacity>
      {!isLast && <View style={menuStyles.sep} />}
    </>
  )
}
const menuStyles = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16, gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 11, backgroundColor: P.accentSoft, justifyContent: "center", alignItems: "center" },
  icon:    { fontSize: 16 },
  label:   { fontSize: 14, fontWeight: "600", color: P.text },
  sub:     { fontSize: 11, color: P.textLight, marginTop: 1 },
  arrow:   { fontSize: 20, color: P.textLight, fontWeight: "300" },
  sep:     { height: 0.5, backgroundColor: P.border, marginLeft: 66 },
})

// ── Reusable: Card ────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return <View style={[cardStyles.card, style]}>{children}</View>
}
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: P.surface, borderRadius: 18,
    borderWidth: 0.5, borderColor: P.border,
    shadowColor: P.navy, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    overflow: "hidden",
  },
})

// ── Reusable: Section Label ───────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <Text style={secStyles.label}>{text}</Text>
  )
}
const secStyles = StyleSheet.create({
  label: {
    fontSize: 11, fontWeight: "700", color: P.textLight,
    textTransform: "uppercase", letterSpacing: 1,
    paddingHorizontal: 4, marginBottom: 8,
  },
})

// ── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ emoji, value, label }) {
  return (
    <View style={statStyles.pill}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={statStyles.val}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  )
}
const statStyles = StyleSheet.create({
  pill:  { flex: 1, alignItems: "center", paddingVertical: 14 },
  emoji: { fontSize: 18, marginBottom: 5 },
  val:   { color: "#fff", fontSize: 19, fontWeight: "800", letterSpacing: -0.3 },
  label: { color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 3, fontWeight: "500" },
})

// ── Main ──────────────────────────────────────────────────────────────────────
const MENU_SECTIONS = [
  {
    title: "บัญชีของฉัน",
    items: [
      { icon: "👤", label: "ข้อมูลส่วนตัว",  sub: "แก้ไขชื่อและรูปโปรไฟล์",       action: "personal"      },
      { icon: "🎯", label: "เป้าหมายสุขภาพ", sub: "ตั้งเป้าหมายการออกกำลังกาย",   action: "goals"         },
      { icon: "🔔", label: "การแจ้งเตือน",   sub: "จัดการการแจ้งเตือนทั้งหมด",    action: "notifications" },
    ],
  },
  {
    title: "ความปลอดภัย",
    items: [
      { icon: "🔒", label: "ความเป็นส่วนตัว", sub: "การจัดการข้อมูลส่วนตัว",      action: "privacy"  },
      { icon: "🛡️", label: "ความปลอดภัย",    sub: "รหัสผ่านและการยืนยันตัวตน",   action: "security" },
    ],
  },
  {
    title: "ทั่วไป",
    items: [
      { icon: "❓", label: "ช่วยเหลือ",       sub: "คำถามที่พบบ่อย",              action: "help"    },
      { icon: "⭐", label: "ให้คะแนนแอป",    sub: "บอกเราว่าคุณชอบอะไร",          action: "rate"    },
      { icon: "📋", label: "เวอร์ชัน 1.0.0",  sub: "ข้อมูลแอปพลิเคชัน",           action: "version" },
    ],
  },
]

const showAlert = (title, msg, buttons) =>
  Alert.alert(title, msg, buttons ?? [{ text: "ตกลง" }])

export default function Profile() {
  const router = useRouter()
  const [healthResult, setHealthResult] = useState(null)
  const [healthForm,   setHealthForm]   = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [r, f] = await Promise.all([
          AsyncStorage.getItem("healthResult"),
          AsyncStorage.getItem("healthForm"),
        ])
        if (active && r) setHealthResult(JSON.parse(r))
        if (active && f) setHealthForm(JSON.parse(f))
      } catch (err) {
        console.error("Profile: load error", err)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const handleMenuPress = (action) => {
    switch (action) {
      case "personal":
        showAlert(
          "ข้อมูลส่วนตัว",
          healthForm
            ? `อายุ: ${healthForm.age} ปี\nเพศ: ${healthForm.gender === "male" ? "ชาย" : "หญิง"}\nน้ำหนัก: ${healthForm.weight} กก.\nส่วนสูง: ${healthForm.height} ซม.`
            : "ยังไม่มีข้อมูล กรุณากรอกข้อมูลใน Dashboard ก่อนครับ"
        ); break
      case "goals":
        showAlert("เป้าหมายสุขภาพ", "ฟีเจอร์นี้กำลังพัฒนาครับ\n\nเร็วๆ นี้จะสามารถตั้งเป้าหมายได้ เช่น\n• น้ำหนักเป้าหมาย\n• ชั่วโมงนอนที่ต้องการ\n• ระดับการออกกำลังกาย"); break
      case "notifications":
        showAlert("การแจ้งเตือน", "ฟีเจอร์นี้กำลังพัฒนาครับ\n\nเร็วๆ นี้จะสามารถตั้งค่าการแจ้งเตือนได้ เช่น\n• แจ้งเตือนเวลานอน\n• แจ้งเตือนออกกำลังกาย"); break
      case "privacy":
        showAlert("ความเป็นส่วนตัว", "🔐 ข้อมูลของคุณปลอดภัย\n\nข้อมูลสุขภาพทั้งหมดถูกเก็บไว้ในเครื่องของคุณเท่านั้น"); break
      case "security":
        showAlert("ความปลอดภัย", "🛡️ ฟีเจอร์กำลังพัฒนาครับ\n\n• ล็อกด้วย PIN\n• ยืนยันตัวตนด้วย Biometric"); break
      case "help":
        showAlert("ช่วยเหลือ — FAQ", "Q: วิธีดูคะแนนสุขภาพ?\nA: ไปที่ Dashboard แล้วกรอกข้อมูลใน My Stats\n\nQ: ข้อมูลหายไปไหน?\nA: ล้าง Cache ของแอปอาจทำให้ข้อมูลหายได้ครับ"); break
      case "rate":
        showAlert("ให้คะแนนแอป ⭐", "ขอบคุณที่ใช้งาน HealthyAI ครับ!\nความคิดเห็นของคุณช่วยให้เราพัฒนาแอปได้ดีขึ้น 🙏", [
          { text: "ภายหลัง", style: "cancel" },
          { text: "ให้คะแนน ⭐", onPress: () => {} },
        ]); break
      case "version":
        showAlert("HealthyAI", "📱 เวอร์ชัน: 1.0.0\n\nพัฒนาด้วย\n• React Native + Expo\n• AI Wellness Analysis\n• AsyncStorage\n\n© 2026 HealthyAI Team"); break
      default: break
    }
  }

  const handleLogout = () => {
    Alert.alert("ออกจากระบบ", "ต้องการล้างข้อมูลสุขภาพและออกจากระบบใช่ไหมครับ?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ออกจากระบบ", style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove(["healthForm", "healthResult"])
            router.replace("/")
          } catch (err) { console.error("Logout error:", err) }
        },
      },
    ])
  }

  const handleClearData = () => {
    Alert.alert("ล้างข้อมูลสุขภาพ", "ต้องการล้างข้อมูลสุขภาพที่บันทึกไว้ใช่ไหมครับ?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ล้างข้อมูล", style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["healthForm", "healthResult"])
          setHealthResult(null)
          setHealthForm(null)
        },
      },
    ])
  }

  const fmt    = (v) => (v !== null && v !== undefined ? Number(v).toFixed(1) : null)
  const scores = [
    { label: "Wellness",  value: fmt(healthResult?.overall_score),  color: scoreColor(healthResult?.overall_score  ?? 0) },
    { label: "Sleep",     value: fmt(healthResult?.sleep_score),     color: scoreColor(healthResult?.sleep_score    ?? 0) },
    { label: "Activity",  value: fmt(healthResult?.activity_score),  color: scoreColor(healthResult?.activity_score ?? 0) },
    { label: "Mental",    value: fmt(healthResult?.mental_score),    color: scoreColor(healthResult?.mental_score   ?? 0) },
  ]
  const hasData = !!healthResult

  return (
    <View style={S.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <LinearGradient
          colors={[P.navy, P.navyMid, P.navyLight]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={S.hero}
        >
          {/* eyebrow */}
          <Text style={S.eyebrow}>MY PROFILE</Text>

          {/* avatar + name */}
          <View style={S.avatarBlock}>
            <Avatar size={84} />
            <View style={{ marginTop: 14 }}>
              <Text style={S.heroName}>HealthyAI User</Text>
              <View style={S.statusRow}>
                <View style={[S.statusDot, { backgroundColor: hasData ? P.emerald : P.textLight }]} />
                <Text style={S.statusText}>
                  {hasData ? "ข้อมูลสุขภาพล่าสุด" : "ยังไม่มีข้อมูลสุขภาพ"}
                </Text>
              </View>
            </View>
          </View>

          {/* stat strip */}
          <View style={S.statStrip}>
            {[
              { emoji: "📅", value: healthForm?.age ?? "—",  label: "อายุ (ปี)" },
              { emoji: "👤", value: healthForm?.gender === "male" ? "ชาย" : healthForm?.gender === "female" ? "หญิง" : "—", label: "เพศ" },
              { emoji: "🏆", value: healthResult ? Math.round(healthResult.overall_score) : "—", label: "คะแนน" },
            ].map((s, i) => (
              <View key={s.label} style={[S.statCell, i > 0 && S.statDivider]}>
                <StatPill emoji={s.emoji} value={s.value} label={s.label} />
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Health Summary (floats over hero) ── */}
        <View style={S.summaryLift}>
          <Card>
            <View style={S.summaryInner}>
              <View style={S.summaryHeader}>
                <View style={S.summaryDot} />
                <Text style={S.summaryTitle}>สรุปสุขภาพของคุณ</Text>
                {hasData && (
                  <View style={S.goodBadge}>
                    <Text style={S.goodBadgeText}>
                      {(healthResult?.overall_score ?? 0) >= 70 ? "ดีมาก" : "ต้องพัฒนา"}
                    </Text>
                  </View>
                )}
              </View>

              {hasData ? (
                <View style={S.gaugeRow}>
                  {scores.map(s => (
                    <ScoreGauge key={s.label} label={s.label} value={s.value} color={s.color} />
                  ))}
                </View>
              ) : (
                <View style={S.emptyBox}>
                  <Text style={S.emptyIcon}>📋</Text>
                  <Text style={S.emptyTitle}>ยังไม่มีข้อมูล</Text>
                  <Text style={S.emptySub}>กรอกข้อมูลสุขภาพใน Dashboard ก่อนครับ</Text>
                </View>
              )}
            </View>
          </Card>
        </View>

        {/* ── Menu Sections ── */}
        <View style={S.body}>
          {MENU_SECTIONS.map((sec) => (
            <View key={sec.title} style={S.section}>
              <SectionLabel text={sec.title} />
              <Card>
                {sec.items.map((item, i) => (
                  <MenuRow
                    key={item.action}
                    icon={item.icon}
                    label={item.label}
                    sub={item.sub}
                    onPress={() => handleMenuPress(item.action)}
                    isLast={i === sec.items.length - 1}
                  />
                ))}
              </Card>
            </View>
          ))}

          {/* ── Danger Zone ── */}
          <View style={S.section}>
            <SectionLabel text="จัดการข้อมูล" />
            <Card>
              {hasData && (
                <MenuRow
                  icon="🗑️"
                  label="ล้างข้อมูลสุขภาพ"
                  sub="ลบข้อมูลที่บันทึกไว้ทั้งหมด"
                  onPress={handleClearData}
                  isLast={false}
                  accent={P.amber}
                />
              )}
              <MenuRow
                icon="🚪"
                label="ออกจากระบบ"
                sub="ล้างข้อมูลและกลับหน้าแรก"
                onPress={handleLogout}
                isLast
                accent={P.rose}
              />
            </Card>
          </View>

          {/* version tag */}
          <Text style={S.versionTag}>HealthyAI · v1.0.0 · © 2026</Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  )
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.bg },

  // Hero
  hero:       { paddingTop: 54, paddingBottom: 48, paddingHorizontal: 24 },
  eyebrow:    { color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 2, fontWeight: "700", marginBottom: 20 },
  avatarBlock:{ alignItems: "center" },
  heroName:   { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", letterSpacing: -0.4, marginTop: 2 },
  statusRow:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "500" },
  statStrip:  { flexDirection: "row", marginTop: 28, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" },
  statCell:   { flex: 1 },
  statDivider:{ borderLeftWidth: 0.5, borderLeftColor: "rgba(255,255,255,0.12)" },

  // Summary card (lifted)
  summaryLift: { marginHorizontal: 16, marginTop: -22, zIndex: 10 },
  summaryInner:{ padding: 18 },
  summaryHeader:{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  summaryDot:   { width: 7, height: 7, borderRadius: 3.5, backgroundColor: P.accent },
  summaryTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: P.text },
  goodBadge:    { backgroundColor: P.emeraldSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  goodBadgeText:{ fontSize: 11, fontWeight: "700", color: P.emerald },
  gaugeRow:     { flexDirection: "row", gap: 4 },

  // Empty state
  emptyBox:  { alignItems: "center", paddingVertical: 16 },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  emptyTitle:{ fontSize: 14, fontWeight: "600", color: P.textMuted },
  emptySub:  { fontSize: 12, color: P.textLight, marginTop: 4, textAlign: "center" },

  // Body
  body:    { paddingHorizontal: 16, paddingTop: 20 },
  section: { marginBottom: 20 },

  // Version
  versionTag: {
    textAlign: "center", fontSize: 11,
    color: P.textLight, marginTop: 4, marginBottom: 8,
    fontWeight: "500", letterSpacing: 0.3,
  },
})
