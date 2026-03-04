import { useState, useRef } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../../constants/colors"

const BASE_URL = "https://healthy-ai.onrender.com"

const QUICK_QUESTIONS = [
  "💪 วิธีออกกำลังกายที่ดี",
  "🥗 อาหารที่ควรกิน",
  "😴 วิธีนอนหลับให้ดีขึ้น",
  "🧠 ลดความเครียด",
  "❤️ ดูแลสุขภาพหัวใจ",
  "💊 วิตามินที่ควรทาน",
]

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "สวัสดีครับ! 👋 ผมคือ AI Health Coach ของคุณ\nถามเรื่องสุขภาพได้เลยครับ ไม่ว่าจะเป็นการออกกำลังกาย โภชนาการ การนอน หรือสุขภาพจิต 💪"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  const sendMessage = async (text) => {
    const msg = text || input.trim()
    if (!msg) return

    setInput("")
    const newMessages = [...messages, { role: "user", text: msg }]
    setMessages(newMessages)
    setLoading(true)

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const history = newMessages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text
      }))

      const res = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", text: "❌ ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่ครับ" }])
    }

    setLoading(false)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <View style={{ flex: 1, backgroundColor: Colors.background }}>

        {/* Header */}
        <LinearGradient colors={[Colors.primary, "#15803D"]} style={styles.header}>
          <Text style={styles.headerEmoji}>🤖</Text>
          <View>
            <Text style={styles.headerTitle}>AI Health Coach</Text>
            <Text style={styles.headerSub}>พร้อมช่วยเหลือคุณตลอด 24 ชม.</Text>
          </View>
        </LinearGradient>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                m.role === "user" ? styles.userBubble : styles.aiBubble
              ]}
            >
              {m.role === "assistant" && (
                <Text style={styles.aiLabel}>🤖 AI Coach</Text>
              )}
              <Text style={[
                styles.bubbleText,
                m.role === "user" ? styles.userText : styles.aiText
              ]}>
                {m.text}
              </Text>
            </View>
          ))}

          {loading && (
            <View style={styles.aiBubble}>
              <Text style={styles.aiLabel}>🤖 AI Coach</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={{ color: Colors.textMuted, fontSize: 13 }}>กำลังคิด...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickRow}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.quickBtn}
                onPress={() => sendMessage(q)}
              >
                <Text style={styles.quickText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="ถามเรื่องสุขภาพ..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && { backgroundColor: Colors.border }]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          ⚠️ ข้อมูลนี้ไม่ใช่คำแนะนำทางการแพทย์ โปรดปรึกษาแพทย์เมื่อมีอาการรุนแรง
        </Text>

      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20, paddingTop: 48 },
  headerEmoji: { fontSize: 36 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  chatArea: { flex: 1 },
  bubble: { marginBottom: 12, maxWidth: "80%" },
  userBubble: { alignSelf: "flex-end", backgroundColor: Colors.primary, borderRadius: 18, borderBottomRightRadius: 4, padding: 14 },
  aiBubble: { alignSelf: "flex-start", backgroundColor: Colors.card, borderRadius: 18, borderBottomLeftRadius: 4, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  aiLabel: { color: Colors.primary, fontSize: 11, fontWeight: "bold", marginBottom: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#fff" },
  aiText: { color: Colors.text },
  quickRow: { maxHeight: 50, marginBottom: 8 },
  quickBtn: { backgroundColor: Colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  quickText: { color: Colors.primary, fontSize: 13, fontWeight: "500" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: 12, paddingTop: 8, backgroundColor: Colors.card, gap: 8 },
  input: { flex: 1, backgroundColor: Colors.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border, maxHeight: 100 },
  sendBtn: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  sendText: { color: "#fff", fontSize: 16 },
  disclaimer: { textAlign: "center", color: Colors.textMuted, fontSize: 11, padding: 8, backgroundColor: Colors.card },
})