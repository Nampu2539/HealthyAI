import { useState } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native"
import { Colors } from "../../constants/colors"

const BASE_URL = "https://healthy-ai.onrender.com"

export default function Recommendations() {
  const [rec, setRec] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userId] = useState(0)

  const getAIRecommendation = async () => {
    setLoading(true)
    setRec(null)
    try {
      const res = await fetch(`${BASE_URL}/ai-recommend/${userId}`, { method: "POST" })
      const data = await res.json()
      setRec(data.recommendation)
    } catch (e) {
      setRec("❌ ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่")
    }
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI Health Coach</Text>
        <Text style={styles.headerSub}>powered by Groq AI (Llama 3.3)</Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>วิธีใช้งาน</Text>
        <Text style={styles.infoText}>AI จะวิเคราะห์ข้อมูลสุขภาพของคุณและให้คำแนะนำเฉพาะบุคคลแบบ Real-time</Text>
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={getAIRecommendation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>✨ รับคำแนะนำจาก AI</Text>
        )}
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>🧠 AI กำลังวิเคราะห์สุขภาพของคุณ...</Text>
        </View>
      )}

      {rec && !loading && (
        <View style={styles.recCard}>
          <View style={styles.recHeader}>
            <Text style={styles.recHeaderText}>💡 คำแนะนำส่วนตัวของคุณ</Text>
          </View>
          <Text style={styles.recText}>{rec}</Text>
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, padding: 24, paddingTop: 48 },
  headerTitle: { color: Colors.white, fontSize: 22, fontWeight: "bold" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 4 },
  infoCard: { backgroundColor: Colors.card, margin: 16, borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  infoTitle: { color: Colors.text, fontWeight: "bold", marginBottom: 4 },
  infoText: { color: Colors.textMuted, lineHeight: 20 },
  button: { backgroundColor: Colors.primary, margin: 16, borderRadius: 16, padding: 18, alignItems: "center", shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  buttonDisabled: { backgroundColor: Colors.textMuted },
  buttonText: { color: Colors.white, fontWeight: "bold", fontSize: 16 },
  loadingBox: { alignItems: "center", padding: 20 },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  recCard: { backgroundColor: Colors.card, margin: 16, borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  recHeader: { backgroundColor: Colors.primary, padding: 16 },
  recHeaderText: { color: Colors.white, fontWeight: "bold", fontSize: 15 },
  recText: { color: Colors.text, fontSize: 15, lineHeight: 28, padding: 20 },
})