import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native"
import { useRouter } from "expo-router"
import { Colors } from "../constants/colors"
import { useAuth } from "../context/AuthContext"

export default function Login() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError("")
    if (!email) return setError("กรุณากรอก Email")
    if (!password) return setError("กรุณากรอกรหัสผ่าน")
    if (!email.includes("@")) return setError("รูปแบบ Email ไม่ถูกต้อง")
    if (password.length < 6) return setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัว")

    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    login(email)
    setLoading(false)
    router.replace("/(tabs)")
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.logoBox}>
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.appName}>HealthyAI</Text>
        <Text style={styles.tagline}>AI-Powered Health Coach</Text>
      </View>

      <View style={styles.form}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={(t) => { setEmail(t); setError("") }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>รหัสผ่าน</Text>
        <View style={styles.passRow}>
          <TextInput
            style={styles.passInput}
            placeholder="กรอกรหัสผ่าน"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={(t) => { setPassword(t); setError("") }}
            secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Text>{showPass ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonLoading]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>หรือ</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.registerBtn}>
          <Text style={styles.registerText}>
            ยังไม่มีบัญชี? <Text style={styles.registerLink}>สมัครสมาชิกฟรี</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: "center", padding: 24 },
  logoBox: { alignItems: "center", marginBottom: 32 },
  logo: { fontSize: 64 },
  appName: { fontSize: 32, fontWeight: "bold", color: Colors.primary, marginTop: 8 },
  tagline: { color: Colors.textMuted, marginTop: 4 },
  form: { backgroundColor: Colors.card, borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: Colors.danger, fontSize: 13 },
  label: { color: Colors.text, fontWeight: "600", marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 15 },
  passRow: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  passInput: { flex: 1, padding: 14, color: Colors.text, fontSize: 15 },
  eyeBtn: { padding: 14 },
  forgotBtn: { alignItems: "flex-end", marginTop: 8 },
  forgotText: { color: Colors.primary, fontSize: 13 },
  button: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 20 },
  buttonLoading: { backgroundColor: Colors.textMuted },
  buttonText: { color: Colors.white, fontWeight: "bold", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, marginHorizontal: 12, fontSize: 13 },
  registerBtn: { alignItems: "center" },
  registerText: { color: Colors.textMuted },
  registerLink: { color: Colors.primary, fontWeight: "bold" },
})