import { useEffect, useState, useRef } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated, Dimensions,
  RefreshControl, ActivityIndicator, LayoutAnimation,
  Platform, UIManager, Modal, Pressable,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import { Colors } from "../../constants/colors"
import { fetchWithCache } from "../../services/cache"
import { BASE_URL } from "../../config/api"

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window")

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// ─── CLOCK HOOK ───────────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// ─── HERO STAT PILL ───────────────────────────────────────────────────────────
function HeroStatPill({ icon, label, value, color = "#fff", loading }) {
  return (
    <View style={hP.wrap}>
      <Text style={hP.icon}>{icon}</Text>
      <Text style={[hP.value, { color }]}>{loading ? "—" : value}</Text>
      <Text style={hP.label}>{label}</Text>
    </View>
  )
}
const hP = StyleSheet.create({
  wrap:  { flex: 1, alignItems: "center", paddingVertical: 14, paddingHorizontal: 8 },
  icon:  { fontSize: 20, marginBottom: 6 },
  value: { fontSize: 22, fontWeight: "800", lineHeight: 26 },
  label: { color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 3, fontWeight: "500", letterSpacing: 0.3 },
})

// ─── SUMMARY CARD ─────────────────────────────────────────────────────────────
function SummaryCard({ icon, title, value, sub, color, bgColor, loading }) {
  return (
    <View style={[sC.wrap, { borderTopColor: color, borderTopWidth: 2 }]}>
      <View style={[sC.iconBox, { backgroundColor: bgColor }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={sC.title}>{title}</Text>
      {loading
        ? <ActivityIndicator color={color} size="small" style={{ marginTop: 6 }} />
        : <Text style={[sC.value, { color }]}>{value}</Text>}
      <Text style={sC.sub}>{sub}</Text>
    </View>
  )
}
const sC = StyleSheet.create({
  wrap: {
    flex: 1, minWidth: "45%",
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#1a3a6b", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    borderWidth: 0.5, borderColor: "rgba(200,215,240,0.6)",
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  title:   { color: "#8899bb", fontSize: 10, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  value:   { fontSize: 28, fontWeight: "800", marginTop: 4, marginBottom: 4 },
  sub:     { color: "#aab4c8", fontSize: 11 },
})

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ title }) {
  return <Text style={sec.title}>{title}</Text>
}
const sec = StyleSheet.create({
  title: {
    color: "#8899bb", fontWeight: "700", fontSize: 11,
    marginBottom: 10, letterSpacing: 1, textTransform: "uppercase",
  },
})

// ─── METRIC MINI PILL ─────────────────────────────────────────────────────────
function MetricPill({ icon, value, color }) {
  return (
    <View style={[uL.pill, { backgroundColor: color + "15" }]}>
      <Text style={{ fontSize: 11 }}>{icon}</Text>
      <Text style={[uL.pillVal, { color }]}>{value.toFixed(0)}</Text>
    </View>
  )
}

// ─── USER DETAIL MODAL ────────────────────────────────────────────────────────
function UserDetailModal({ user, visible, onClose, getScoreColor }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (visible) {
      setActiveTab("overview")
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 18, stiffness: 180, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  if (!user) return null

  const score    = user.Overall_Wellness_Score          ?? 0
  const sleep    = user.Sleep_Health_Score              ?? 0
  const activity = user.Activity_Health_Score           ?? 0
  const cardio   = user.Cardiovascular_Health_Score     ?? 0
  const mental   = user.Mental_Health_Score             ?? 0
  const isAtRisk = score < 50
  const scoreColor = getScoreColor(score)

  const metrics = [
    { icon: "😴", label: "Sleep",    val: sleep,    color: getScoreColor(sleep) },
    { icon: "🏃", label: "Activity", val: activity, color: getScoreColor(activity) },
    { icon: "❤️", label: "Cardio",   val: cardio,   color: getScoreColor(cardio) },
    { icon: "🧠", label: "Mental",   val: mental,   color: getScoreColor(mental) },
  ]

  const tabs = [
    { key: "overview", label: "📊 ภาพรวม" },
    { key: "metrics",  label: "💪 Metrics" },
    { key: "actions",  label: "⚙️ Actions" },
  ]

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[mS.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[mS.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Handle bar */}
        <View style={mS.handle} />

        {/* ── Hero section ── */}
        <LinearGradient colors={["#0f2c5c", "#1a4a8a"]} style={mS.heroSection}>
          <View style={mS.heroRow}>
            {/* Avatar */}
            <View style={[mS.avatar, { borderColor: scoreColor + "80", backgroundColor: scoreColor + "20" }]}>
              <Text style={[mS.avatarText, { color: scoreColor }]}>#{user.id ?? "?"}</Text>
            </View>

            {/* Name + status */}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={mS.userName}>User #{user.id ?? "?"}</Text>
              <View style={mS.statusRow}>
                {isAtRisk ? (
                  <View style={mS.atRiskBadge}>
                    <Text style={mS.atRiskText}>⚠️ At-Risk</Text>
                  </View>
                ) : (
                  <View style={mS.goodBadge}>
                    <Text style={mS.goodText}>✅ สุขภาพดี</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Close btn */}
            <TouchableOpacity onPress={onClose} style={mS.closeBtn} activeOpacity={0.7}>
              <Text style={mS.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Big score */}
          <View style={mS.scoreBig}>
            <Text style={[mS.scoreBigNum, { color: scoreColor }]}>{score.toFixed(1)}</Text>
            <Text style={mS.scoreBigLabel}>Wellness Score</Text>
          </View>

          {/* Mini metric pills in hero */}
          <View style={mS.heroPills}>
            {metrics.map((m) => (
              <View key={m.label} style={[mS.heroPill, { backgroundColor: m.color + "25" }]}>
                <Text style={{ fontSize: 14 }}>{m.icon}</Text>
                <Text style={[mS.heroPillVal, { color: m.color }]}>{m.val.toFixed(0)}</Text>
                <Text style={mS.heroPillLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Tabs ── */}
        <View style={mS.tabRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[mS.tab, activeTab === t.key && mS.tabActive]}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[mS.tabText, activeTab === t.key && mS.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        <ScrollView style={mS.tabContent} showsVerticalScrollIndicator={false}>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <View style={{ gap: 12 }}>
              {/* Score breakdown bars */}
              <View style={mS.card}>
                <Text style={mS.cardTitle}>Health Score Breakdown</Text>
                {metrics.map((m) => (
                  <View key={m.label} style={mS.barRow}>
                    <Text style={mS.barLabel}>{m.icon} {m.label}</Text>
                    <View style={mS.barTrack}>
                      <View style={[mS.barFill, { width: `${m.val}%`, backgroundColor: m.color }]} />
                    </View>
                    <Text style={[mS.barVal, { color: m.color }]}>{m.val.toFixed(1)}</Text>
                  </View>
                ))}
              </View>

              {/* Quick stats */}
              <View style={mS.statsGrid}>
                {[
                  { label: "Wellness",  val: score.toFixed(1),    icon: "📊", color: scoreColor },
                  { label: "Sleep",     val: sleep.toFixed(1),    icon: "😴", color: getScoreColor(sleep) },
                  { label: "Activity",  val: activity.toFixed(1), icon: "🏃", color: getScoreColor(activity) },
                  { label: "Mental",    val: mental.toFixed(1),   icon: "🧠", color: getScoreColor(mental) },
                ].map((s) => (
                  <View key={s.label} style={[mS.statCell, { borderTopColor: s.color, borderTopWidth: 2 }]}>
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</Text>
                    <Text style={[mS.statVal, { color: s.color }]}>{s.val}</Text>
                    <Text style={mS.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* METRICS TAB */}
          {activeTab === "metrics" && (
            <View style={{ gap: 12 }}>
              {metrics.map((m) => {
                const level = m.val >= 70 ? "ดี" : m.val >= 50 ? "ปานกลาง" : "ต้องปรับปรุง"
                const levelColor = m.val >= 70 ? "#10b981" : m.val >= 50 ? "#f59e0b" : "#ef4444"
                return (
                  <View key={m.label} style={[mS.card, { borderLeftWidth: 3, borderLeftColor: m.color }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 24 }}>{m.icon}</Text>
                        <Text style={mS.cardTitle}>{m.label}</Text>
                      </View>
                      <View style={[mS.levelBadge, { backgroundColor: levelColor + "15" }]}>
                        <Text style={[mS.levelText, { color: levelColor }]}>{level}</Text>
                      </View>
                    </View>
                    {/* Big score */}
                    <Text style={[mS.metricBigScore, { color: m.color }]}>{m.val.toFixed(1)}</Text>
                    {/* Bar */}
                    <View style={[mS.barTrack, { height: 10, marginTop: 8 }]}>
                      <View style={[mS.barFill, { width: `${m.val}%`, backgroundColor: m.color, height: 10, borderRadius: 5 }]} />
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                      <Text style={{ color: "#aab4c8", fontSize: 10 }}>0</Text>
                      <Text style={{ color: "#aab4c8", fontSize: 10 }}>100</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* ACTIONS TAB */}
          {activeTab === "actions" && (
            <View style={{ gap: 10 }}>
              <View style={mS.card}>
                <Text style={mS.cardTitle}>จัดการผู้ใช้</Text>
                <Text style={{ color: "#8899bb", fontSize: 12, marginBottom: 14, lineHeight: 18 }}>
                  User #{user.id} • {isAtRisk ? "⚠️ ผู้ใช้กลุ่มเสี่ยง ควรติดตามเป็นพิเศษ" : "✅ ผู้ใช้สุขภาพดี"}
                </Text>
                {[
                  { icon: "🔔", label: "ส่ง Notification",        color: "#3b82f6", bg: "#eff6ff" },
                  { icon: "📋", label: "ดู Health Report",         color: "#10b981", bg: "#f0fdf4" },
                  { icon: "💬", label: "ส่งข้อความ AI Coach",      color: "#8b5cf6", bg: "#f5f3ff" },
                  { icon: "⚠️", label: "ตั้ง Flag At-Risk",        color: "#f59e0b", bg: "#fffbeb" },
                  { icon: "🚫", label: "ระงับบัญชีชั่วคราว",      color: "#ef4444", bg: "#fff1f2" },
                ].map((a) => (
                  <TouchableOpacity
                    key={a.label}
                    style={[mS.actionRow, { backgroundColor: a.bg, borderColor: a.color + "33" }]}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 18, marginRight: 12 }}>{a.icon}</Text>
                    <Text style={[mS.actionRowText, { color: a.color }]}>{a.label}</Text>
                    <Text style={{ color: a.color, marginLeft: "auto" }}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}

const mS = StyleSheet.create({
  // ── Backdrop ──
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,20,40,0.65)",
  },

  // ── Sheet ──
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: SCREEN_H * 0.88,
    backgroundColor: "#f0f4f8",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  handle: {
    alignSelf: "center",
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginTop: 10, marginBottom: -6,
    zIndex: 10,
  },

  // ── Hero ──
  heroSection:   { paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20 },
  heroRow:       { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatar: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2,
  },
  avatarText:    { fontSize: 12, fontWeight: "800" },
  userName:      { color: "#fff", fontSize: 18, fontWeight: "800" },
  statusRow:     { flexDirection: "row", marginTop: 6, gap: 8 },
  atRiskBadge:   { backgroundColor: "rgba(245,158,11,0.25)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  atRiskText:    { color: "#fbbf24", fontSize: 11, fontWeight: "700" },
  goodBadge:     { backgroundColor: "rgba(16,185,129,0.25)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  goodText:      { color: "#34d399", fontSize: 11, fontWeight: "700" },
  closeBtn:      { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  closeBtnText:  { color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: "600" },

  scoreBig:      { alignItems: "center", marginBottom: 16 },
  scoreBigNum:   { fontSize: 56, fontWeight: "900", lineHeight: 60 },
  scoreBigLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4, letterSpacing: 1 },

  heroPills:     { flexDirection: "row", gap: 8 },
  heroPill:      { flex: 1, alignItems: "center", borderRadius: 12, paddingVertical: 8, gap: 2 },
  heroPillVal:   { fontSize: 14, fontWeight: "800" },
  heroPillLabel: { color: "rgba(255,255,255,0.5)", fontSize: 9, fontWeight: "600" },

  // ── Tabs ──
  tabRow:       { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 0.5, borderBottomColor: "rgba(200,215,240,0.8)" },
  tab:          { flex: 1, paddingVertical: 13, alignItems: "center" },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText:      { color: "#aab4c8", fontSize: 12, fontWeight: "600" },
  tabTextActive:{ color: Colors.primary, fontWeight: "700" },

  // ── Tab Content ──
  tabContent: { flex: 1, padding: 16 },

  // ── Card ──
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#1a3a6b", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 0.5, borderColor: "rgba(200,215,240,0.6)",
  },
  cardTitle: { color: "#1e3a5f", fontWeight: "700", fontSize: 13, marginBottom: 12 },

  // ── Bar rows ──
  barRow:   { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  barLabel: { color: "#334155", fontSize: 12, fontWeight: "500", width: 76 },
  barTrack: { flex: 1, height: 7, backgroundColor: "rgba(180,195,220,0.25)", borderRadius: 4 },
  barFill:  { height: 7, borderRadius: 4 },
  barVal:   { fontSize: 12, fontWeight: "700", width: 34, textAlign: "right" },

  // ── Stats Grid ──
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCell: {
    flex: 1, minWidth: "45%", backgroundColor: "#fff", borderRadius: 14,
    padding: 14, alignItems: "center",
    shadowColor: "#1a3a6b", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    borderWidth: 0.5, borderColor: "rgba(200,215,240,0.6)",
  },
  statVal:   { fontSize: 24, fontWeight: "800", marginBottom: 2 },
  statLabel: { color: "#8899bb", fontSize: 10, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },

  // ── Metric big score ──
  metricBigScore: { fontSize: 48, fontWeight: "900", lineHeight: 52 },

  // ── Level badge ──
  levelBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  levelText:  { fontSize: 11, fontWeight: "700" },

  // ── Action rows ──
  actionRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1,
  },
  actionRowText: { fontSize: 13, fontWeight: "600" },
})

// ─── USER ROW (opens modal instead of expanding) ──────────────────────────────
function UserRow({ user, getScoreColor, onPress }) {
  const score    = user.Overall_Wellness_Score ?? 0
  const color    = getScoreColor(score)
  const isAtRisk = score < 50

  const metrics = [
    { icon: "😴", val: user.Sleep_Health_Score          ?? 0 },
    { icon: "🏃", val: user.Activity_Health_Score       ?? 0 },
    { icon: "❤️", val: user.Cardiovascular_Health_Score ?? 0 },
    { icon: "🧠", val: user.Mental_Health_Score         ?? 0 },
  ]

  return (
    <TouchableOpacity
      style={uL.row}
      onPress={() => onPress(user)}
      activeOpacity={0.75}
    >
      <View style={uL.rowMain}>
        <View style={[uL.avatar, { backgroundColor: color + "20", borderColor: color + "60" }]}>
          <Text style={[uL.avatarText, { color }]}>#{user.id ?? "?"}</Text>
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[uL.scoreText, { color }]}>{score.toFixed(1)}</Text>
            <Text style={uL.scoreSlash}>/ 100</Text>
            {isAtRisk && (
              <View style={uL.atRiskBadge}>
                <Text style={uL.atRiskText}>⚠️ At-Risk</Text>
              </View>
            )}
          </View>
          <View style={uL.pillRow}>
            {metrics.map((m, i) => (
              <MetricPill key={i} icon={m.icon} value={m.val} color={getScoreColor(m.val)} />
            ))}
          </View>
        </View>

        <Text style={uL.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  )
}

// ─── USER LIST SECTION ────────────────────────────────────────────────────────
function UserListSection({ totalUsers, getScoreColor, loading, onUsersLoaded }) {
  const [users, setUsers]             = useState([])
  const [listLoading, setListLoading] = useState(false)
  const [loadedCount, setLoadedCount] = useState(10)
  const [filter, setFilter]           = useState("all")
  const [selectedUser, setSelectedUser] = useState(null)   // ← NEW

  useEffect(() => {
    if (!totalUsers || totalUsers === 0) return
    const load = async () => {
      setListLoading(true)
      const ids     = Array.from({ length: Math.min(loadedCount, totalUsers) }, (_, i) => i)
      const results = await Promise.allSettled(
        ids.map((id) => fetchWithCache(`${BASE_URL}/user/${id}`, 60000))
      )
      const loaded = results
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r, i) => ({ ...r.value, id: ids[i] }))
      setUsers(loaded)
      onUsersLoaded?.(loaded)
      setListLoading(false)
    }
    load()
  }, [totalUsers, loadedCount])

  const filtered = users.filter((u) => {
    const s = u.Overall_Wellness_Score ?? 0
    if (filter === "at-risk") return s < 50
    if (filter === "good")    return s >= 70
    return true
  })

  const atRiskCount = users.filter((u) => (u.Overall_Wellness_Score ?? 0) < 50).length

  return (
    <View style={uL.wrap}>
      {/* Header */}
      <View style={uL.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={uL.headerTitle}>👤 รายชื่อผู้ใช้</Text>
          <View style={uL.countBadge}>
            <Text style={uL.countText}>{users.length}</Text>
          </View>
          {atRiskCount > 0 && (
            <View style={uL.riskBadge}>
              <Text style={uL.riskBadgeText}>⚠️ {atRiskCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={uL.filterRow}>
        {[
          { key: "all",     label: "ทั้งหมด" },
          { key: "at-risk", label: "⚠️ At-Risk" },
          { key: "good",    label: "✅ ดี" },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[uL.filterBtn, filter === f.key && uL.filterBtnActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[uL.filterText, filter === f.key && uL.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {listLoading && users.length === 0 ? (
        <View style={{ padding: 32, alignItems: "center" }}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={{ color: "#8899bb", marginTop: 10, fontSize: 13 }}>กำลังโหลด users...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <Text style={{ color: "#aab4c8", fontSize: 13 }}>ไม่มีผู้ใช้ในกลุ่มนี้</Text>
        </View>
      ) : (
        filtered.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            getScoreColor={getScoreColor}
            onPress={setSelectedUser}   // ← ส่ง handler เปิด modal
          />
        ))
      )}

      {/* Load more */}
      {loadedCount < totalUsers && (
        <TouchableOpacity
          style={uL.loadMoreBtn}
          onPress={() => setLoadedCount((c) => c + 10)}
          disabled={listLoading}
          activeOpacity={0.75}
        >
          {listLoading
            ? <ActivityIndicator color={Colors.primary} size="small" />
            : <Text style={uL.loadMoreText}>โหลดเพิ่ม ({totalUsers - loadedCount} คนที่เหลือ)</Text>}
        </TouchableOpacity>
      )}

      {/* ── User Detail Modal ── */}
      <UserDetailModal
        user={selectedUser}
        visible={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        getScoreColor={getScoreColor}
      />
    </View>
  )
}

const uL = StyleSheet.create({
  wrap: { marginBottom: 12 },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: { color: "#1e3a5f", fontWeight: "700", fontSize: 14 },
  countBadge:  { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  countText:   { color: "#fff", fontSize: 11, fontWeight: "700" },
  riskBadge:   { backgroundColor: "rgba(245,158,11,0.15)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  riskBadgeText: { color: "#f59e0b", fontSize: 11, fontWeight: "700" },

  filterRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "rgba(200,215,240,0.8)",
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText:      { color: "#8899bb", fontSize: 12, fontWeight: "600" },
  filterTextActive:{ color: "#fff", fontSize: 12, fontWeight: "700" },

  row: {
    backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 0.5, borderColor: "rgba(200,215,240,0.6)",
    shadowColor: "#1a3a6b", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  rowMain:  { flexDirection: "row", alignItems: "center" },

  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", borderWidth: 1.5 },
  avatarText: { fontSize: 11, fontWeight: "800" },

  scoreText:  { fontSize: 22, fontWeight: "800" },
  scoreSlash: { color: "#aab4c8", fontSize: 12 },
  atRiskBadge:{ backgroundColor: "rgba(245,158,11,0.12)", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  atRiskText: { color: "#f59e0b", fontSize: 10, fontWeight: "700" },

  pillRow: { flexDirection: "row", gap: 4, marginTop: 6 },
  pill:    { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  pillVal: { fontSize: 11, fontWeight: "700" },

  chevron: { color: "#aab4c8", fontSize: 20, marginLeft: 8 },

  loadMoreBtn: {
    borderRadius: 14, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(200,215,240,0.8)",
    backgroundColor: "#fff", marginTop: 4,
  },
  loadMoreText: { color: Colors.primary, fontWeight: "600", fontSize: 13 },
})

// ─── INSIGHTS SECTION ─────────────────────────────────────────────────────────
function InsightsSection({ users, analytics, getScoreColor }) {
  const good   = users.filter((u) => (u.Overall_Wellness_Score ?? 0) >= 70).length
  const mid    = users.filter((u) => { const s = u.Overall_Wellness_Score ?? 0; return s >= 50 && s < 70 }).length
  const risk   = users.filter((u) => (u.Overall_Wellness_Score ?? 0) < 50).length
  const total  = users.length || 1

  const distGroups = [
    { label: "ดี",      count: good, color: "#10b981", bg: "rgba(16,185,129,0.1)",  emoji: "✅" },
    { label: "ปานกลาง", count: mid,  color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  emoji: "🟡" },
    { label: "เสี่ยง",  count: risk, color: "#ef4444", bg: "rgba(239,68,68,0.1)",   emoji: "⚠️" },
  ]

  const metricKeys = [
    { key: "Sleep_Health_Score",          label: "Sleep",    icon: "😴" },
    { key: "Activity_Health_Score",       label: "Activity", icon: "🏃" },
    { key: "Cardiovascular_Health_Score", label: "Cardio",   icon: "❤️" },
    { key: "Mental_Health_Score",         label: "Mental",   icon: "🧠" },
  ]

  const metricAvgs = metricKeys.map((m) => {
    const vals = users.map((u) => u[m.key] ?? 0).filter((v) => v > 0)
    const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    return { ...m, avg }
  })

  const worstMetric = metricAvgs.reduce((a, b) => (a.avg < b.avg ? a : b), metricAvgs[0] ?? null)
  const trendVal  = analytics?.trend_delta ?? null
  const hasTrend  = trendVal !== null
  const trendUp   = trendVal >= 0
  const trendAbs  = Math.abs(trendVal ?? 0).toFixed(1)

  if (users.length === 0) return null

  return (
    <View style={iS.wrap}>
      <View style={iS.card}>
        <Text style={iS.cardTitle}>📊 Score Distribution</Text>
        <Text style={iS.cardSub}>{total} คนที่โหลดแล้ว</Text>
        {distGroups.map((g) => {
          const pct = Math.round((g.count / total) * 100)
          return (
            <View key={g.label} style={iS.distRow}>
              <View style={iS.distLabelWrap}>
                <Text style={{ fontSize: 13 }}>{g.emoji}</Text>
                <Text style={iS.distLabel}>{g.label}</Text>
                <View style={[iS.distBadge, { backgroundColor: g.bg }]}>
                  <Text style={[iS.distBadgeText, { color: g.color }]}>{g.count} คน</Text>
                </View>
              </View>
              <View style={iS.distTrackWrap}>
                <View style={iS.distTrack}>
                  <View style={[iS.distFill, { width: `${pct}%`, backgroundColor: g.color }]} />
                </View>
                <Text style={[iS.distPct, { color: g.color }]}>{pct}%</Text>
              </View>
            </View>
          )
        })}
      </View>

      {worstMetric && (
        <View style={[iS.card, iS.alertCard]}>
          <View style={iS.alertHeader}>
            <Text style={iS.alertIcon}>🔍</Text>
            <Text style={iS.alertTitle}>Metric ที่แย่ที่สุด</Text>
          </View>
          <View style={iS.alertBody}>
            <View style={iS.worstLeft}>
              <Text style={{ fontSize: 36 }}>{worstMetric.icon}</Text>
              <Text style={iS.worstLabel}>{worstMetric.label}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[iS.worstScore, { color: getScoreColor(worstMetric.avg) }]}>
                {worstMetric.avg.toFixed(1)}
              </Text>
              <Text style={iS.worstSub}>avg score</Text>
            </View>
          </View>
          <Text style={iS.alertTip}>
            💡 ผู้ใช้ส่วนใหญ่มีปัญหาด้าน{" "}
            <Text style={{ fontWeight: "700", color: "#1e3a5f" }}>{worstMetric.label}</Text>
            {" "}— ควรเพิ่ม content หรือ notification ด้านนี้
          </Text>
          <View style={{ marginTop: 14, gap: 8 }}>
            {metricAvgs.map((m) => {
              const c = getScoreColor(m.avg)
              return (
                <View key={m.key} style={iS.miniBarRow}>
                  <Text style={iS.miniBarLabel}>{m.icon} {m.label}</Text>
                  <View style={iS.miniBarTrack}>
                    <View style={[iS.miniBarFill, { width: `${m.avg}%`, backgroundColor: c }]} />
                  </View>
                  <Text style={[iS.miniBarVal, { color: c }]}>{m.avg.toFixed(1)}</Text>
                </View>
              )
            })}
          </View>
        </View>
      )}

      <View style={[iS.card, hasTrend ? (trendUp ? iS.trendUpCard : iS.trendDownCard) : iS.trendNaCard]}>
        <View style={iS.trendHeader}>
          <Text style={iS.cardTitle}>📅 Trend เดือนนี้ vs เดือนก่อน</Text>
        </View>
        {hasTrend ? (
          <View style={iS.trendBody}>
            <Text style={[iS.trendDelta, { color: trendUp ? "#10b981" : "#ef4444" }]}>
              {trendUp ? "📈 +" : "📉 "}{trendAbs}
            </Text>
            <Text style={iS.trendDesc}>
              {trendUp ? "ค่าเฉลี่ยสุขภาพดีขึ้นจากเดือนที่แล้ว" : "ค่าเฉลี่ยสุขภาพลดลงจากเดือนที่แล้ว"}
            </Text>
          </View>
        ) : (
          <View style={iS.trendNaBody}>
            <Text style={iS.trendNaText}>
              ยังไม่มีข้อมูล trend{"\n"}
              <Text style={{ color: "#aab4c8", fontSize: 11 }}>
                backend ต้องส่ง{" "}
                <Text style={{ fontFamily: "monospace", color: "#6366f1" }}>trend_delta</Text>
                {" "}ใน /analytics
              </Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const iS = StyleSheet.create({
  wrap: { marginBottom: 12 },
  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 18, marginBottom: 10,
    shadowColor: "#1a3a6b", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
    borderWidth: 0.5, borderColor: "rgba(200,215,240,0.5)",
  },
  cardTitle: { color: "#1e3a5f", fontWeight: "700", fontSize: 14, marginBottom: 2 },
  cardSub:   { color: "#aab4c8", fontSize: 11, marginBottom: 14 },

  distRow:       { marginBottom: 12 },
  distLabelWrap: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  distLabel:     { color: "#334155", fontSize: 13, fontWeight: "600", flex: 1 },
  distBadge:     { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  distBadgeText: { fontSize: 11, fontWeight: "700" },
  distTrackWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  distTrack:     { flex: 1, height: 10, backgroundColor: "rgba(180,195,220,0.2)", borderRadius: 5 },
  distFill:      { height: 10, borderRadius: 5 },
  distPct:       { fontSize: 12, fontWeight: "700", width: 36, textAlign: "right" },

  alertCard:   { borderLeftWidth: 3, borderLeftColor: "#f59e0b", backgroundColor: "#fffbeb" },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  alertIcon:   { fontSize: 16 },
  alertTitle:  { color: "#92400e", fontWeight: "700", fontSize: 14 },
  alertBody:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  worstLeft:   { alignItems: "center", gap: 4 },
  worstLabel:  { color: "#334155", fontWeight: "700", fontSize: 13 },
  worstScore:  { fontSize: 42, fontWeight: "800" },
  worstSub:    { color: "#aab4c8", fontSize: 11 },
  alertTip:    { color: "#78716c", fontSize: 12, lineHeight: 18, backgroundColor: "rgba(245,158,11,0.08)", borderRadius: 10, padding: 10 },

  miniBarRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  miniBarLabel: { color: "#334155", fontSize: 12, width: 72 },
  miniBarTrack: { flex: 1, height: 6, backgroundColor: "rgba(180,195,220,0.2)", borderRadius: 3 },
  miniBarFill:  { height: 6, borderRadius: 3 },
  miniBarVal:   { fontSize: 11, fontWeight: "700", width: 30, textAlign: "right" },

  trendUpCard:   { borderLeftWidth: 3, borderLeftColor: "#10b981", backgroundColor: "#f0fdf4" },
  trendDownCard: { borderLeftWidth: 3, borderLeftColor: "#ef4444", backgroundColor: "#fff1f2" },
  trendNaCard:   { borderLeftWidth: 3, borderLeftColor: "#e2e8f0" },
  trendHeader:   { marginBottom: 10 },
  trendBody:     { flexDirection: "row", alignItems: "center", gap: 14 },
  trendDelta:    { fontSize: 38, fontWeight: "800" },
  trendDesc:     { color: "#334155", fontSize: 13, flex: 1, lineHeight: 20 },
  trendNaBody:   { paddingVertical: 8 },
  trendNaText:   { color: "#8899bb", fontSize: 13, lineHeight: 22 },
})

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const router    = useRouter()
  const now       = useClock()
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  const [analytics, setAnalytics]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [error, setError]             = useState(null)
  const [loadedUsers, setLoadedUsers] = useState([])

  const dateStr = now.toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })
  const timeStr = now.toLocaleTimeString("th-TH", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })

  const fetchData = async () => {
    setError(null)
    try {
      const a = await fetchWithCache(`${BASE_URL}/analytics`, 60000)
      setAnalytics(a)
    } catch (err) {
      setError(`โหลดข้อมูลไม่ได้: ${err.message}`)
    }
    setLoading(false)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [])

  const totalUsers  = analytics?.total_users  ?? 0
  const avgWellness = analytics?.avg_wellness ?? 0
  const avgSleep    = analytics?.avg_sleep    ?? 0
  const getScoreColor = (s) => s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444"

  if (error) return (
    <View style={S.center}>
      <Text style={{ color: "#ef4444", fontSize: 15, marginBottom: 20 }}>{error}</Text>
      <TouchableOpacity onPress={fetchData} style={S.retryBtn}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>🔄 ลองใหม่</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: "#f0f4f8" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        <LinearGradient colors={["#0f2c5c", "#1a4a8a", "#1d6fb5"]} style={S.hero}>
          <View style={S.heroTopRow}>
            <View>
              <Text style={S.heroEyebrow}>Admin Panel 🛡️</Text>
              <Text style={S.heroTitle}>HealthyAI</Text>
            </View>
            <View style={S.timeBadge}>
              <Text style={S.timeBadgeTime}>{timeStr}</Text>
            </View>
          </View>
          <View style={S.datePill}>
            <Text style={S.datePillText}>📅 {dateStr}</Text>
          </View>
          <View style={S.heroDivider} />
          <View style={S.heroPillRow}>
            <HeroStatPill icon="👥" label="ผู้ใช้ทั้งหมด" value={totalUsers.toLocaleString()} color="#67e8f9" loading={loading} />
            <View style={S.heroPillSep} />
            <HeroStatPill icon="📊" label="Avg Wellness"  value={avgWellness.toFixed(1)}      color="#86efac" loading={loading} />
            <View style={S.heroPillSep} />
            <HeroStatPill icon="😴" label="Avg Sleep"     value={avgSleep.toFixed(1)}          color="#c4b5fd" loading={loading} />
          </View>
        </LinearGradient>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: 16, paddingTop: 20 }}>
          <SectionHeader title="ภาพรวมระบบ" />
          <View style={S.summaryGrid}>
            <SummaryCard icon="👥" title="Users ทั้งหมด"  value={totalUsers.toLocaleString()} sub="ในระบบ"      color="#3b82f6" bgColor="rgba(59,130,246,0.1)"  loading={loading} />
            <SummaryCard icon="📈" title="Avg Wellness"   value={avgWellness.toFixed(1)}      sub="คะแนนเฉลี่ย" color="#10b981" bgColor="rgba(16,185,129,0.1)"  loading={loading} />
            <SummaryCard icon="😴" title="Avg Sleep"      value={avgSleep.toFixed(1)}          sub="ชั่วโมง/คืน" color="#8b5cf6" bgColor="rgba(139,92,246,0.1)"  loading={loading} />
            <SummaryCard icon="⚠️" title="At-Risk Users"  value="—"                            sub="score < 50"  color="#f59e0b" bgColor="rgba(245,158,11,0.1)"  loading={false}   />
          </View>

          <SectionHeader title="จัดการ" />
          <View style={S.actionGrid}>
           {[
  { icon: "🏠", label: "Dashboard", color: "#3b82f6", bg: "#eff6ff", route: "/(tabs)/admin" },
  { icon: "📊", label: "Analytics",     color: "#10b981", bg: "#f0fdf4", route: "/(tabs)/analytics" },
  { icon: "💡", label: "AI Coach", color: "#f59e0b", bg: "#fffbeb", route: "/(tabs)/recommendations" },
  { icon: "👤", label: "Profile",      color: "#8b5cf6", bg: "#f5f3ff", route: "/(tabs)/profile" },
].map((a) => (
  <TouchableOpacity
    key={a.label}
    style={[S.actionBtn, { backgroundColor: a.bg, borderColor: a.color + "33" }]}
    onPress={() => router.push(a.route)}
    activeOpacity={0.75}
  >
                <Text style={{ fontSize: 24, marginBottom: 6 }}>{a.icon}</Text>
                <Text style={[S.actionLabel, { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <SectionHeader title="ข้อมูลเชิงลึก" />
          <InsightsSection users={loadedUsers} analytics={analytics} getScoreColor={getScoreColor} />

          <SectionHeader title="รายชื่อผู้ใช้" />
          <UserListSection
            totalUsers={totalUsers}
            getScoreColor={getScoreColor}
            loading={loading}
            onUsersLoaded={setLoadedUsers}
          />
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  )
}

const S = StyleSheet.create({
  center:   { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0f4f8" },
  retryBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 },

  hero:         { paddingTop: 56, paddingBottom: 32, paddingHorizontal: 24 },
  heroTopRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroEyebrow:  { color: "rgba(255,255,255,0.55)", fontSize: 12, letterSpacing: 0.5 },
  heroTitle:    { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 2 },
  timeBadge:    {
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.18)", alignItems: "center",
  },
  timeBadgeTime: { color: "#fff", fontWeight: "700", fontSize: 15 },
  datePill: {
    marginTop: 14, alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.15)",
  },
  datePillText: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "500" },
  heroDivider:  { height: 0.5, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 20 },
  heroPillRow:  {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.12)",
  },
  heroPillSep: { width: 0.5, backgroundColor: "rgba(255,255,255,0.12)" },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },

  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1, minWidth: "45%", borderRadius: 16, padding: 18,
    alignItems: "center", borderWidth: 1,
    shadowColor: "#1a3a6b", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionLabel: { fontSize: 12, fontWeight: "700" },
})