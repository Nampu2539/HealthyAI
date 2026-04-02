import { useState } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../../constants/colors"

const BASE_URL = "https://healthy-ai.onrender.com"

export default function MyHealth() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    age: "",
    gender: "male",
    weight: "",
    height: "",
    sleep_hours: "",
    activity_level: 3,
  })

  const activityLabels = {
    1: "🛋️ ไม่ค่อยขยับ",
    2: "🚶 เดินบ้างเล็กน้อย",
    3: "🏃 ออกกำลังกายบ้าง",
    4: "💪 ออกกำลังกายสม่ำเสมอ",
    5: "🏋️ ออกกำลังกายหนักมาก",
  }

  const handleSubmit = async () => {
    if (!form.age || !form.weight || !form.height || !form.sleep_hours) {
      setError("กรุณากรอกข้อมูลให้ครบครับ")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/calculate-wellness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: Number(form.age),
          weight: Number(form.weight),
          height: Number(form.height),
          sleep_hours: Number(form.sleep_hours),
          activity_level: form.activity_level,
          gender: form.gender,
        })
      })
      const data = await res.json()
      setResult(data)
      setStep(2)
    } catch (e) {
      setError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่")
    }
    setLoading(false)
  }

  const getScoreColor = (score) => {
    if (score >= 70) return Colors.primary
    if (score >= 50) return Colors.warning
    return Colors.danger
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <LinearGradient colors={[Colors.primary, "#15803D"]} style={styles.header}>
          <Text style={styles.greeting}>สุขภาพของฉัน 💚</Text>
          <Text style={styles.headerTitle}>My Health Check</Text>
        </LinearGradient>

        {step === 1 && (
          <View>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                กรอกข้อมูลของคุณ AI จะวิเคราะห์สุขภาพและเปรียบเทียบกับผู้ใช้กว่า{" "}
                <Text style={{ fontWeight: "bold", color: Colors.primary }}>{" "}1,000 คน</Text> ครับ
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>เพศ</Text>
              <View style={styles.genderRow}>
                {[{ key: "male", label: "👨 ชาย" }, { key: "female", label: "👩 หญิง" }].map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    style={[styles.genderBtn, form.gender === g.key && styles.genderBtnActive]}
                    onPress={() => setForm({ ...form, gender: g.key })}
                  >
                    <Text style={[styles.genderText, form.gender === g.key && styles.genderTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>อายุ (ปี)</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น 25"
                placeholderTextColor={Colors.textMuted}
                value={form.age}
                onChangeText={(v) => setForm({ ...form, age: v })}
                keyboardType="numeric"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>น้ำหนัก (กก.)</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น 65"
                placeholderTextColor={Colors.textMuted}
                value={form.weight}
                onChangeText={(v) => setForm({ ...form, weight: v })}
                keyboardType="numeric"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>ส่วนสูง (ซม.)</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น 170"
                placeholderTextColor={Colors.textMuted}
                value={form.height}
                onChangeText={(v) => setForm({ ...form, height: v })}
                keyboardType="numeric"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>ชั่วโมงนอนเฉลี่ยต่อคืน</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น 7"
                placeholderTextColor={Colors.textMuted}
                value={form.sleep_hours}
                onChangeText={(v) => setForm({ ...form, sleep_hours: v })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>ระดับการออกกำลังกาย</Text>
              <Text style={styles.activityValue}>{activityLabels[form.activity_level]}</Text>
              <View style={styles.activityRow}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.activityBtn, form.activity_level === level && styles.activityBtnActive]}
                    onPress={() => setForm({ ...form, activity_level: level })}
                  >
                    <Text style={[styles.activityBtnText, form.activity_level === level && { color: "#fff" }]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {error && (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, loading && { backgroundColor: Colors.textMuted }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={{ alignItems: "center", gap: 8 }}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.submitText}>🤖 AI กำลังวิเคราะห์สุขภาพ...</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>🔍 วิเคราะห์สุขภาพของฉัน</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && result && (
          <View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Overall Wellness Score</Text>
              <Text style={[styles.bigScore, { color: getScoreColor(result.overall_score) }]}>
                {result.overall_score}
              </Text>
              <Text style={styles.percentileText}>
                ดีกว่า {result.percentile}% ของผู้ใช้ทั้งหมด {result.total_users} คน
              </Text>
            </View>

            <View style={styles.bmiCard}>
              <Text style={styles.bmiTitle}>⚖️ BMI ของคุณ</Text>
              <Text style={styles.bmiValue}>{result.bmi}</Text>
              <Text style={[styles.bmiCategory, {
                color: result.bmi_category === "ปกติ" ? Colors.primary : Colors.warning
              }]}>
                {result.bmi_category}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>💪 Health Metrics</Text>
              {[
                { label: "😴 Sleep", score: result.sleep_score },
                { label: "🏃 Activity", score: result.activity_score },
                { label: "❤️ Cardio", score: result.cardiovascular_score },
                { label: "🧠 Mental", score: result.mental_score },
              ].map((item) => (
                <View key={item.label} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ color: Colors.text, fontSize: 14 }}>{item.label}</Text>
                    <Text style={{ color: getScoreColor(item.score), fontWeight: "bold" }}>
                      {item.score.toFixed(1)}
                    </Text>
                  </View>
                  <View style={{ height: 10, backgroundColor: Colors.border, borderRadius: 5 }}>
                    <View style={{
                      height: 10,
                      width: `${item.score}%`,
                      backgroundColor: getScoreColor(item.score),
                      borderRadius: 5
                    }} />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.compareCard}>
              <Text style={styles.compareTitle}>📊 เปรียบเทียบกับค่าเฉลี่ย</Text>
              <View style={styles.compareRow}>
                <View style={styles.compareItem}>
                  <Text style={[styles.compareValue, { color: Colors.primary }]}>{result.overall_score}</Text>
                  <Text style={styles.compareLabel}>คะแนนของคุณ</Text>
                </View>
                <Text style={styles.compareVs}>VS</Text>
                <View style={styles.compareItem}>
                  <Text style={[styles.compareValue, { color: Colors.textMuted }]}>{result.avg_wellness}</Text>
                  <Text style={styles.compareLabel}>ค่าเฉลี่ย</Text>
                </View>
              </View>
            </View>

            {result.summary && (
              <View style={styles.aiCard}>
                <Text style={styles.aiTitle}>🤖 AI วิเคราะห์</Text>
                <Text style={styles.aiText}>{result.summary}</Text>
              </View>
            )}

            {result.advice && (
              <View style={styles.adviceCard}>
                <Text style={styles.adviceTitle}>💡 คำแนะนำ</Text>
                <Text style={styles.aiText}>{result.advice}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.retryBtn} onPress={() => { setStep(1); setResult(null) }}>
              <Text style={styles.retryText}>🔄 กรอกข้อมูลใหม่</Text>
            </TouchableOpacity>
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
  infoCard: { backgroundColor: "rgba(22,163,74,0.1)", margin: 16, borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  infoText: { color: Colors.text, fontSize: 14, lineHeight: 22 },
  card: { backgroundColor: Colors.card, margin: 16, marginTop: 0, borderRadius: 20, padding: 20, elevation: 2, marginBottom: 12 },
  cardTitle: { color: Colors.text, fontWeight: "bold", fontSize: 15, marginBottom: 16 },
  label: { color: Colors.text, fontWeight: "600", marginBottom: 8 },
  input: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 15 },
  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: "center" },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: "rgba(22,163,74,0.1)" },
  genderText: { color: Colors.textMuted, fontWeight: "600" },
  genderTextActive: { color: Colors.primary },
  activityValue: { color: Colors.primary, fontWeight: "bold", fontSize: 16, marginBottom: 12, textAlign: "center" },
  activityRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  activityBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: Colors.border, alignItems: "center" },
  activityBtnActive: { backgroundColor: Colors.primary },
  activityBtnText: { color: Colors.text, fontWeight: "bold" },
  errorCard: { backgroundColor: "#FEE2E2", margin: 16, borderRadius: 12, padding: 14, marginTop: 0 },
  errorText: { color: Colors.danger, fontSize: 13 },
  submitBtn: { backgroundColor: Colors.primary, margin: 16, borderRadius: 16, padding: 18, alignItems: "center", elevation: 4 },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  scoreCard: { backgroundColor: Colors.card, margin: 16, borderRadius: 20, padding: 24, alignItems: "center", elevation: 4 },
  scoreLabel: { color: Colors.textMuted, fontSize: 14 },
  bigScore: { fontSize: 72, fontWeight: "bold", marginTop: 8 },
  percentileText: { color: Colors.textMuted, fontSize: 13, marginTop: 8, textAlign: "center" },
  bmiCard: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 20, alignItems: "center", elevation: 2 },
  bmiTitle: { color: Colors.text, fontWeight: "bold", fontSize: 15 },
  bmiValue: { fontSize: 48, fontWeight: "bold", color: Colors.text, marginTop: 8 },
  bmiCategory: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  compareCard: { backgroundColor: Colors.card, marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 20, elevation: 2 },
  compareTitle: { color: Colors.text, fontWeight: "bold", fontSize: 15, marginBottom: 16 },
  compareRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  compareItem: { alignItems: "center" },
  compareValue: { fontSize: 32, fontWeight: "bold" },
  compareLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  compareVs: { color: Colors.textMuted, fontWeight: "bold", fontSize: 18 },
  aiCard: { backgroundColor: "rgba(22,163,74,0.1)", marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(22,163,74,0.3)" },
  adviceCard: { backgroundColor: "#FEF3C7", marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#FCD34D" },
  aiTitle: { color: Colors.primary, fontWeight: "bold", marginBottom: 8 },
  adviceTitle: { color: "#92400E", fontWeight: "bold", marginBottom: 8 },
  aiText: { color: Colors.text, lineHeight: 24, fontSize: 14 },
  retryBtn: { backgroundColor: Colors.border, margin: 16, borderRadius: 16, padding: 16, alignItems: "center" },
  retryText: { color: Colors.primary, fontWeight: "bold", fontSize: 15 },
})