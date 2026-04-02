import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../../constants/colors"

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: {
        backgroundColor: Colors.white,
        borderTopColor: Colors.border,
        borderTopWidth: 0.5,
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
      <Tabs.Screen name="foodscan" options={{
        title: "Food AI",
        tabBarIcon: ({ color }) => <Ionicons name="camera" size={22} color={color} />
      }} />
      <Tabs.Screen name="myhealth" options={{
        title: "My Health",
        tabBarIcon: ({ color }) => <Ionicons name="heart" size={22} color={color} />
      }} />
      <Tabs.Screen name="profile" options={{
        title: "Profile",
        tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />
      }} />
      <Tabs.Screen name="symptom" options={{ href: null }} />
      <Tabs.Screen name="prescription" options={{ href: null }} />
      <Tabs.Screen name="monitoring" options={{ href: null }} />
    </Tabs>
  )
}