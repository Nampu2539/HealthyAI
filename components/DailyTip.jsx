import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useState } from "react"

const TIPS = [
  { icon: "💧", title: "ดื่มน้ำให้เพียงพอ", body: "ควรดื่มน้ำอย่างน้อย 8 แก้วต่อวัน เพื่อให้ร่างกายทำงานได้เต็มประสิทธิภาพ" },
  { icon: "😴", title: "นอนหลับให้ครบ", body: "การนอนหลับ 7-8 ชั่วโมงต่อคืนช่วยฟื้นฟูร่างกายและเพิ่มสมาธิในวันถัดไป" },
  { icon: "🏃", title: "ออกกำลังกายสม่ำเสมอ", body: "เพียงแค่เดิน 30 นาทีต่อวัน ช่วยลดความเสี่ยงโรคหัวใจและเพิ่มอารมณ์ดี" },
  { icon: "🥗", title: "กินผักผลไม้ให้หลากหลาย", body: "เลือกกินผักและผลไม้หลากสีเพื่อให้ได้รับวิตามินและแร่ธาตุครบถ้วน" },
  { icon: "🧘", title: "ลดความเครียด", body: "ลองทำสมาธิ 10 นาทีต่อวัน ช่วยลดฮอร์โมนความเครียดและเพิ่มความผ่อนคลาย" },
  { icon: "☀️", title: "รับแสงแดดช่วงเช้า", body: "แสงแดดช่วงเช้า 15-20 นาที ช่วยให้ร่างกายสังเคราะห์วิตามิน D และปรับนาฬิกาชีวิต" },
]

export default function DailyTip() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * TIPS.length))
  const tip = TIPS[idx]

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Text style={s.headerText}>💡 เคล็ดลับวันนี้</Text>
        <TouchableOpacity onPress={() => setIdx((idx + 1) % TIPS.length)} activeOpacity={0.7}>
          <Text style={s.next}>ถัดไป →</Text>
        </TouchableOpacity>
      </View>
      <View style={s.body}>
        <Text style={s.icon}>{tip.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{tip.title}</Text>
          <Text style={s.desc}>{tip.body}</Text>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: "#eff6ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.2)",
    borderLeftWidth: 3,
    borderLeftColor: "#1a4a8a",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  headerText: { color: "#1a4a8a", fontWeight: "700", fontSize: 13 },
  next: { color: "#1a4a8a", fontSize: 12, fontWeight: "600" },
  body: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  icon: { fontSize: 28, marginTop: 2 },
  title: { color: "#1e3a5f", fontWeight: "700", fontSize: 14, marginBottom: 4 },
  desc: { color: "#334155", fontSize: 13, lineHeight: 20 },
})