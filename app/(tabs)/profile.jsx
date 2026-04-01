import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native"
import { Colors } from "../../constants/colors"

export default function Profile() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🌿</Text>
        </View>
        <Text style={styles.name}>HealthyAI User</Text>
      </View>

      {[
        { icon: "⚙️", label: "ตั้งค่าบัญชี" },
        { icon: "🔔", label: "การแจ้งเตือน" },
        { icon: "🔒", label: "ความเป็นส่วนตัว" },
        { icon: "❓", label: "ช่วยเหลือ" },
      ].map((item) => (
        <TouchableOpacity key={item.label} style={styles.menuItem}>
          <Text style={styles.menuIcon}>{item.icon}</Text>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.primary, padding: 32, alignItems: "center", paddingTop: 48 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 36 },
  name: { color: Colors.white, fontSize: 22, fontWeight: "bold" },
  menuItem: { backgroundColor: Colors.card, marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, flexDirection: "row", alignItems: "center" },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, color: Colors.text, fontSize: 15 },
  menuArrow: { color: Colors.textMuted, fontSize: 20 },
})