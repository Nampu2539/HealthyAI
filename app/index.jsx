import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native"
import { useRouter } from "expo-router"
import { Colors } from "../constants/colors"

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoBox}>
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.appName}>HealthyAI</Text>
        <Text style={styles.tagline}>AI-Powered Health Coach</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.buttonText}>เข้าสู่ระบบ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerBtn}>
          <Text style={styles.registerText}>ยังไม่มีบัญชี? <Text style={styles.registerLink}>สมัครสมาชิก</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: "center", padding: 24 },
  logoBox: { alignItems: "center", marginBottom: 48 },
  logo: { fontSize: 64 },
  appName: { fontSize: 32, fontWeight: "bold", color: Colors.primary, marginTop: 8 },
  tagline: { color: Colors.textMuted, marginTop: 4 },
  form: { backgroundColor: Colors.card, borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 20, elevation: 4 },
  label: { color: Colors.text, fontWeight: "600", marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 15 },
  button: { backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 24 },
  buttonText: { color: Colors.white, fontWeight: "bold", fontSize: 16 },
  registerBtn: { alignItems: "center", marginTop: 16 },
  registerText: { color: Colors.textMuted },
  registerLink: { color: Colors.primary, fontWeight: "bold" },
})