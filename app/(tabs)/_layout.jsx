import { Tabs, useRouter } from "expo-router"
import { useEffect } from "react"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../../constants/colors"
import { useAuth } from "../../context/AuthContext"

export default function TabLayout() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace("/")
    }
  }, [user])

  if (!user) return null

  return (
    <Tabs screenOptions={{
      tabBarStyle: {
        backgroundColor: Colors.white,
        borderTopColor: Colors.border,
        height: 60,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      headerShown: false,
    }}>
      <Tabs.Screen name="index" options={{
        title: "Dashboard",
        tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />
      }} />
      <Tabs.Screen name="recommendations" options={{
        title: "AI Coach",
        tabBarIcon: ({ color }) => <Ionicons name="bulb" size={22} color={color} />
      }} />
      <Tabs.Screen name="analytics" options={{
        title: "Analytics",
        tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={22} color={color} />
      }} />
      <Tabs.Screen name="profile" options={{
        title: "Profile",
        tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />
      }} />
    </Tabs>
  )
}