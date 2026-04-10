import { useState, useRef } from "react"
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../../constants/colors"
import { BASE_URL } from "../../config/api"
import { validateChatReply } from "../../services/validation"

const QUICK_QUESTIONS = [
  { label: "💪 ออกกำลังกาย", text: "วิธีออกกำลังกายที่ดีสำหรับมือใหม่" },
  { label: "🥗 โภชนาการ", text: "อาหารที่ควรกินเพื่อสุขภาพดี" },
  { label: "😴 การนอน", text: "วิธีนอนหลับให้ดีขึ้น" },
  { label: "🧠 ลดเครียด", text: "วิธีลดความเครียด" },
  { label: "❤️ หัวใจ", text: "วิธีดูแลสุขภาพหัวใจ" },
  { label: "💊 วิตามิน", text: "วิตามินที่ควรทานประจำ" },
]

export default function AIChat() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    text: "สวัสดีครับ! 👋 ผมคือ AI Health Coach\nถามเรื่องสุขภาพได้เลยครับ ไม่ว่าจะเป็นการออกกำลังกาย โภชนาการ การนอน หรือสุขภาพจิต 💪"
  }])
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
      const res = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })) })
      })
      if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`)
      const data = await res.json()
      validateChatReply(data)
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: `❌ ${err.message || "ไม่สามารถเชื่อมต่อได้"}` }])
    }
    setLoading(false)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={80}>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>

        {/* Header */}
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.header}>
          <View style={styles.headerAvatarWrap}>
            <Text style={{ fontSize: 26 }}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Health Coach</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSub}>พร้อมช่วยเหลือคุณตลอด 24 ชม.</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <View style={styles.quickWrap}>
            <Text style={styles.quickTitle}>คำถามยอดนิยม</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
              {QUICK_QUESTIONS.map((q) => (
                <TouchableOpacity key={q.label} style={styles.quickBtn} onPress={() => sendMessage(q.text)}>
                  <Text style={styles.quickText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubbleWrap, m.role === "user" ? styles.bubbleWrapUser : styles.bubbleWrapAI]}>
              {m.role === "assistant" && (
                <View style={styles.aiAvatar}><Text style={{ fontSize: 14 }}>🤖</Text></View>
              )}
              <View style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.aiBubble]}>
                {m.role === "assistant" && <Text style={styles.aiLabel}>AI Coach</Text>}
                <Text style={[styles.bubbleText, m.role === "user" ? styles.userText : styles.aiText]}>{m.text}</Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={[styles.bubbleWrap, styles.bubbleWrapAI]}>
              <View style={styles.aiAvatar}><Text style={{ fontSize: 14 }}>🤖</Text></View>
              <View style={styles.aiBubble}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color={Colors.primaryLight} />
                  <Text style={{ color: Colors.textMuted, fontSize: 13 }}>กำลังคิด...</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputWrap}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="ถามเรื่องสุขภาพ..."
              placeholderTextColor={Colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>⚠️ ข้อมูลนี้ไม่ใช่คำแนะนำทางการแพทย์ โปรดปรึกษาแพทย์เมื่อมีอาการรุนแรง</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 14, padding: 20, paddingTop: 52, paddingBottom: 20 },
  headerAvatarWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ade80" },
  headerSub: { color: "rgba(255,255,255,0.75)", fontSize: 12 },
  quickWrap: { paddingTop: 14, paddingBottom: 8 },
  quickTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: "600", paddingHorizontal: 16, marginBottom: 8 },
  quickBtn: { backgroundColor: Colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 0.5, borderColor: Colors.border, elevation: 1 },
  quickText: { color: Colors.primary, fontSize: 13, fontWeight: "600" },
  chatArea: { flex: 1 },
  bubbleWrap: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end", gap: 8 },
  bubbleWrapUser: { justifyContent: "flex-end" },
  bubbleWrapAI: { justifyContent: "flex-start" },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.accentLight, justifyContent: "center", alignItems: "center", borderWidth: 0.5, borderColor: Colors.border },
  bubble: { maxWidth: "78%", padding: 14, borderRadius: 18 },
  userBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: Colors.card, borderBottomLeftRadius: 4, elevation: 2, borderWidth: 0.5, borderColor: Colors.border },
  aiLabel: { color: Colors.primaryLight, fontSize: 10, fontWeight: "bold", marginBottom: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#fff" },
  aiText: { color: Colors.text },
  inputWrap: { backgroundColor: Colors.card, borderTopWidth: 0.5, borderTopColor: Colors.border },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: 12, gap: 10 },
  input: { flex: 1, backgroundColor: Colors.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border, maxHeight: 100 },
  sendBtn: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendIcon: { color: "#fff", fontSize: 16 },
  disclaimer: { textAlign: "center", color: Colors.textMuted, fontSize: 11, paddingHorizontal: 16, paddingBottom: 10 },
})