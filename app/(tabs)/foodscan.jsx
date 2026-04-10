import { useState } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, ActivityIndicator
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../../constants/colors"
import { BASE_URL } from "../../config/api"
import { validateFoodResult } from "../../services/validation"

export default function FoodScan() {
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      })
      if (result.cancelled || !result.assets?.[0]) return
      const base64 = result.assets[0].base64
      setImage(`data:image/jpeg;base64,${base64}`)
      await analyzeFood(base64)
    } catch (err) {
      setError(`ไม่สามารถเลือกรูปได้: ${err.message}`)
    }
  }

  const analyzeFood = async (base64Data, retryCount = 0) => {
    const MAX_RETRIES = 3
    const BASE_DELAY = 2000 // 2 seconds
    
    setLoading(true); setResult(null); setError(null)
    try {
      const res = await fetch(`${BASE_URL}/analyze-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Data }),
      })
      
      if (!res.ok) {
        // If 503 (Google API overloaded) and we haven't maxed retries, retry with backoff
        if (res.status === 503 && retryCount < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCount) // Exponential backoff
          setError(`AI ยุ่งอยู่ (ครั้งที่ ${retryCount + 1}/${MAX_RETRIES})... รอสักครู่`)
          setTimeout(() => analyzeFood(base64Data, retryCount + 1), delay)
          return
        }
        throw new Error(`Server error: ${res.status} ${res.statusText}`)
      }
      
      const data = await res.json()
      validateFoodResult(data)
      setResult(data.result)
      setError(null)
    } catch (err) {
      setError(`ไม่สามารถวิเคราะห์ได้: ${err.message}`)
    }
    setLoading(false)
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
          <Text style={styles.greeting}>สแกนอาหาร</Text>
          <Text style={styles.headerTitle}>Food AI Scanner</Text>
          <Text style={styles.headerSub}>วิเคราะห์แคลอรี่และสารอาหารด้วย AI</Text>
        </LinearGradient>

        <View style={styles.body}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}><Text style={{ fontSize: 20 }}>📸</Text></View>
              <Text style={styles.infoText}>ถ่ายหรือเลือกรูปอาหาร AI จะวิเคราะห์แคลอรี่และสารอาหารให้ทันทีครับ</Text>
            </View>
          </View>

          {/* Upload Button */}
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.8}>
            <View style={styles.uploadIconCircle}>
              <Text style={{ fontSize: 32 }}>📷</Text>
            </View>
            <Text style={styles.uploadTitle}>เลือกรูปอาหาร</Text>
            <Text style={styles.uploadSub}>รองรับ JPG, PNG</Text>
          </TouchableOpacity>

          {/* Image Preview */}
          {image && (
            <View style={styles.previewCard}>
              <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity style={styles.rescanOverlay} onPress={pickImage}>
                <Text style={styles.rescanOverlayText}>🔄 เลือกรูปใหม่</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading */}
          {loading && (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={Colors.primaryLight} />
              <Text style={styles.loadingTitle}>🤖 AI กำลังวิเคราะห์...</Text>
              <Text style={styles.loadingSubtext}>รอสักครู่นะครับ</Text>
            </View>
          )}

          {/* Error */}
          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Result */}
          {result && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.resultHeaderIcon}><Text style={{ fontSize: 22 }}>🍽️</Text></View>
                <View>
                  <Text style={styles.resultHeaderTitle}>ผลการวิเคราะห์</Text>
                  <Text style={styles.resultHeaderSub}>โดย AI Health Coach</Text>
                </View>
              </View>
              <View style={styles.resultDivider} />
              <Text style={styles.resultText}>{result}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={pickImage}>
                <Text style={styles.primaryBtnText}>📷 สแกนอาหารใหม่</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 24, paddingTop: 52, paddingBottom: 36 },
  greeting: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", marginTop: 2 },
  headerSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 },
  body: { padding: 16 },
  infoCard: { backgroundColor: Colors.accentLight, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center", elevation: 1 },
  infoText: { flex: 1, color: Colors.text, fontSize: 13, lineHeight: 20 },
  uploadBtn: { backgroundColor: Colors.card, borderRadius: 20, padding: 36, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border, borderStyle: "dashed", marginBottom: 16 },
  uploadIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accentLight, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  uploadTitle: { color: Colors.primary, fontWeight: "bold", fontSize: 18 },
  uploadSub: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  previewCard: { borderRadius: 20, overflow: "hidden", marginBottom: 16, position: "relative" },
  previewImage: { width: "100%", height: 260 },
  rescanOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(27,58,107,0.7)", padding: 12, alignItems: "center" },
  rescanOverlayText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  loadingCard: { backgroundColor: Colors.card, borderRadius: 20, padding: 36, alignItems: "center", marginBottom: 16, borderWidth: 0.5, borderColor: Colors.border },
  loadingTitle: { color: Colors.text, fontWeight: "bold", fontSize: 15, marginTop: 14 },
  loadingSubtext: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  errorCard: { backgroundColor: "#fde8e8", borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#f5c6c6" },
  errorText: { color: Colors.danger, fontSize: 13 },
  resultCard: { backgroundColor: Colors.card, borderRadius: 20, marginBottom: 16, overflow: "hidden", elevation: 4, borderWidth: 0.5, borderColor: Colors.border },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18, backgroundColor: Colors.accentLight },
  resultHeaderIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center" },
  resultHeaderTitle: { color: Colors.primary, fontWeight: "bold", fontSize: 15 },
  resultHeaderSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  resultDivider: { height: 1, backgroundColor: Colors.border },
  resultText: { padding: 20, color: Colors.text, fontSize: 15, lineHeight: 28 },
  primaryBtn: { backgroundColor: Colors.primary, margin: 16, marginTop: 4, borderRadius: 14, padding: 15, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
})