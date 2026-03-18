import { useState } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, ActivityIndicator
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../../constants/colors"

const BASE_URL = "https://healthy-ai.onrender.com"

export default function FoodScan() {
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pickImage = async () => {
    try {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = async (ev) => {
          const base64 = ev.target.result
          const base64Data = base64.split(",")[1]
          setImage(base64)
          await analyzeFood(base64Data)
        }
        reader.readAsDataURL(file)
      }
      input.click()
    } catch (e) {
      setError("ไม่สามารถเลือกรูปได้")
    }
  }

  const analyzeFood = async (base64Data) => {
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}/analyze-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data })
      })
      const data = await res.json()
      setResult(data.result)
    } catch (e) {
      setError("ไม่สามารถวิเคราะห์ได้ กรุณาลองใหม่")
    }
    setLoading(false)
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <LinearGradient colors={[Colors.primary, "#15803D"]} style={styles.header}>
          <Text style={styles.greeting}>สแกนอาหาร 🍽️</Text>
          <Text style={styles.headerTitle}>Food AI Scanner</Text>
        </LinearGradient>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            📸 ถ่ายหรือเลือกรูปอาหาร AI จะวิเคราะห์แคลอรี่และสารอาหารให้ทันทีครับ
          </Text>
        </View>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Text style={styles.uploadIcon}>📷</Text>
          <Text style={styles.uploadText}>เลือกรูปอาหาร</Text>
          <Text style={styles.uploadSub}>รองรับ JPG, PNG</Text>
        </TouchableOpacity>

        {image && (
          <View style={styles.previewCard}>
            <Image
              source={{ uri: image }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>
        )}

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>🤖 AI กำลังวิเคราะห์อาหาร...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultCard}>
            <LinearGradient colors={[Colors.primary, "#15803D"]} style={styles.resultHeader}>
              <Text style={styles.resultHeaderText}>🍽️ ผลการวิเคราะห์</Text>
            </LinearGradient>
            <Text style={styles.resultText}>{result}</Text>
            <TouchableOpacity style={styles.rescanBtn} onPress={pickImage}>
              <Text style={styles.rescanText}>📷 สแกนอาหารใหม่</Text>
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
  uploadBtn: { backgroundColor: Colors.card, margin: 16, marginTop: 0, borderRadius: 20, padding: 32, alignItems: "center", borderWidth: 2, borderColor: Colors.border, borderStyle: "dashed" },
  uploadIcon: { fontSize: 48, marginBottom: 12 },
  uploadText: { color: Colors.primary, fontWeight: "bold", fontSize: 18 },
  uploadSub: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  previewCard: { margin: 16, marginTop: 0, borderRadius: 20, overflow: "hidden" },
  previewImage: { width: "100%", height: 250 },
  loadingCard: { margin: 16, backgroundColor: Colors.card, borderRadius: 20, padding: 32, alignItems: "center" },
  loadingText: { color: Colors.textMuted, fontSize: 14, marginTop: 12 },
  errorCard: { backgroundColor: "#FEE2E2", margin: 16, borderRadius: 12, padding: 14 },
  errorText: { color: Colors.danger, fontSize: 13 },
  resultCard: { margin: 16, borderRadius: 20, overflow: "hidden", elevation: 4 },
  resultHeader: { padding: 16 },
  resultHeaderText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  resultText: { backgroundColor: Colors.card, padding: 20, color: Colors.text, fontSize: 15, lineHeight: 28 },
  rescanBtn: { backgroundColor: Colors.primary, padding: 16, alignItems: "center" },
  rescanText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
})