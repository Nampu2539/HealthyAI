import { View, Text, StyleSheet } from "react-native"
import Svg, { Polyline, Circle } from "react-native-svg"

// ─── HEALTH TREND CARD ────────────────────────────────────────────────────────
export function HealthTrendCard({ title, score, history = [], icon, color, change }) {
  const w = 80
  const h = 36
  const max = Math.max(...history, 1)
  const min = Math.min(...history, 0)
  const range = max - min || 1

  const points = history.map((v, i) => {
    const x = (i / Math.max(history.length - 1, 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(" ")

  const isUp = change >= 0
  const changeColor = isUp ? "#10b981" : "#ef4444"

  return (
    <View style={tw.card}>
      <View style={tw.left}>
        <View style={[tw.iconBox, { backgroundColor: color + "18" }]}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View>
          <Text style={tw.label}>{title}</Text>
          <Text style={[tw.score, { color }]}>{score.toFixed(1)}</Text>
          <View style={[tw.changeBadge, { backgroundColor: changeColor + "15" }]}>
            <Text style={[tw.changeText, { color: changeColor }]}>
              {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
      {history.length >= 2 && (
        <Svg width={w} height={h} style={{ marginLeft: "auto" }}>
          <Polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {history.map((v, i) => {
            const x = (i / Math.max(history.length - 1, 1)) * w
            const y = h - ((v - min) / range) * h
            return i === history.length - 1 ? (
              <Circle key={i} cx={x} cy={y} r="3" fill={color} />
            ) : null
          })}
        </Svg>
      )}
    </View>
  )
}

const tw = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(200,215,240,0.5)",
    shadowColor: "#1a3a6b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  label: { color: "#8899bb", fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  score: { fontSize: 24, fontWeight: "800", marginTop: 2 },
  changeBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  changeText: { fontSize: 11, fontWeight: "700" },
})

// ─── MONTH COMPARISON CARD ────────────────────────────────────────────────────
export function MonthComparisonCard({ currentMonth, previousMonth }) {
  if (!currentMonth) return null

  const metrics = [
    { label: "Overall", key: "overall", icon: "⭐" },
    { label: "Sleep",   key: "sleep",   icon: "😴" },
    { label: "Activity",key: "activity",icon: "🏃" },
    { label: "Mental",  key: "mental",  icon: "🧠" },
  ]

  const getColor = (s) => s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444"

  return (
    <View style={mc.card}>
      <Text style={mc.title}>📅 เปรียบเทียบรายเดือน</Text>
      <View style={mc.headerRow}>
        <Text style={[mc.colHead, { flex: 2 }]} />
        <Text style={mc.colHead}>{currentMonth.month ?? "เดือนนี้"}</Text>
        {previousMonth && <Text style={mc.colHead}>{previousMonth.month ?? "เดือนที่แล้ว"}</Text>}
        {previousMonth && <Text style={mc.colHead}>เปลี่ยน</Text>}
      </View>
      {metrics.map((m) => {
        const cur = currentMonth[m.key] ?? 0
        const prev = previousMonth ? (previousMonth[m.key] ?? 0) : null
        const diff = prev !== null ? cur - prev : null
        const diffColor = diff === null ? "#8899bb" : diff >= 0 ? "#10b981" : "#ef4444"
        return (
          <View key={m.key} style={mc.row}>
            <View style={[mc.metaCell, { flex: 2 }]}>
              <Text style={{ fontSize: 14 }}>{m.icon}</Text>
              <Text style={mc.metaLabel}>{m.label}</Text>
            </View>
            <Text style={[mc.val, { color: getColor(cur) }]}>{cur.toFixed(1)}</Text>
            {prev !== null && <Text style={[mc.val, { color: getColor(prev) }]}>{prev.toFixed(1)}</Text>}
            {diff !== null && (
              <Text style={[mc.val, { color: diffColor, fontWeight: "700" }]}>
                {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
              </Text>
            )}
          </View>
        )
      })}
    </View>
  )
}

const mc = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "rgba(200,215,240,0.5)",
    shadowColor: "#1a3a6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  title:   { color: "#1e3a5f", fontWeight: "700", fontSize: 14, marginBottom: 14 },
  headerRow: { flexDirection: "row", marginBottom: 8, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(200,215,240,0.5)" },
  colHead: { flex: 1, color: "#8899bb", fontSize: 11, fontWeight: "600", textAlign: "center" },
  row:     { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "rgba(200,215,240,0.2)" },
  metaCell:{ flexDirection: "row", alignItems: "center", gap: 6 },
  metaLabel:{ color: "#334155", fontSize: 13, fontWeight: "500" },
  val:     { flex: 1, textAlign: "center", fontSize: 13, color: "#334155" },
})