import { useState } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../../constants/colors"

const BASE_URL = "https://healthy-ai.onrender.com"

const COMMON_SYMPTOMS = [
  "ปวดหัว", "ไข้", "ไอ", "เจ็บคอ",
  "คลื่นไส้", "ปวดท้อง", "อ่อนเพลีย", "วิงเวียน"
]

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("")
  const [age, setAge] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addSymptom = (s) => {
    setSymptoms(prev => prev ? `${prev}, ${s}` : s)
  }

  const checkSymptoms = async () => {
    if (!symptoms.trim()) return setError("กรุณากรอกอาการก่อน")
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`${BASE_URL}/symptom-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms, age: age || "ไม่ระบุ" })
      })
      const data = await res.json()
      setResult(data.result)
    } catch (e) {
      setError("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่")
    }
    setLoading(false)
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={[Colors.primary, "#15803D"]} style={styles.header}>
          <Text style={styles.greeting}>ตรวจสอบอาการ 🩺</Text>
          <Text style={styles.headerTitle}>AI Symptom Checker</Text>
        </LinearGradient>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            ⚠️ ระบบนี้ใช้สำหรับการประเมินเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์
          </Text>
        </View>

        {/* Age Input */}
        <View style={styles.card}>
          <Text style={styles.label}>อายุ (ปี)</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น 25"
            placeholderTextColor={Colors.textMuted}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        </View>

        {/* Symptom Input */}
        <View style={styles.card}>
          <Text style={styles.label}>อาการที่มี</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="เช่น ปวดหัว มีไข้ อ่อนเพลีย..."
            placeholderTextColor={Colors.textMuted}
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={3}
          />

          {/* Quick Tags */}
          <Text style={[styles.label, { marginTop: 12 }]}>อาการที่พบบ่อย</Text>
          <View style={styles.tagRow}>
            {COMMON_SYMPTOMS.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.tag}
                onPress={() => addSymptom(s)}
              >
                <Text style={styles.tagText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Button */}
        <TouchableOpacity
          style={[styles.button, loading && { backgroundColor: Colors.textMuted }]}
          onPress={checkSymptoms}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>🔍 วิเคราะห์อาการ</Text>
          }
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingText}>🤖 AI กำลังวิเคราะห์อาการของคุณ...</Text>
        )}

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            <LinearGradient colors={[Colors.primary, "#15803D"]} style={styles.resultHeader}>
              <Text style={styles.resultHeaderText}>🩺 ผลการวิเคราะห์</Text>
            </LinearGradient>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}

        {/* Emergency */}
        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>🚨 กรณีฉุกเฉิน</Text>
          <Text style={styles.emergencyText}>โทร 1669 (EMS) หรือ 1724 (สายด่วนสุขภาพ)</Text>
        </View>

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
  warningCard: { backgroundColor: "#FEF3C7", margin: 16, borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: Colors.warning },
  warningText: { color: "#92400E", fontSize: 13, lineHeight: 20 },
  card: { backgroundColor: Colors.card, margin: 16, marginTop: 0, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  label: { color: Colors.text, fontWeight: "600", marginBottom: 8 },
  input: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 15 },
  textArea: { height: 80, textAlignVertical: "top" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  tag: { backgroundColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  tagText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
  errorCard: { backgroundColor: "#FEE2E2", marginHorizontal: 16, borderRadius: 12, padding: 12 },
  errorText: { color: Colors.danger, fontSize: 13 },
  button: { backgroundColor: Colors.primary, margin: 16, borderRadius: 16, padding: 18, alignItems: "center", shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  loadingText: { color: Colors.textMuted, textAlign: "center", marginTop: 4, fontSize: 13 },
  resultCard: { margin: 16, borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  resultHeader: { padding: 16 },
  resultHeaderText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  resultText: { backgroundColor: Colors.card, padding: 20, color: Colors.text, fontSize: 15, lineHeight: 28 },
  emergencyCard: { backgroundColor: "#FEE2E2", margin: 16, borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: Colors.danger },
  emergencyTitle: { color: Colors.danger, fontWeight: "bold", marginBottom: 4 },
  emergencyText: { color: Colors.danger, fontSize: 13 },
})