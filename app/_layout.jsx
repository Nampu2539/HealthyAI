import { Stack } from "expo-router"
import { AuthProvider } from "../context/AuthContext"
import { startKeepAlive } from "../services/keepAlive"
import { useEffect } from "react"

export default function RootLayout() {
  useEffect(() => {
    startKeepAlive()
  }, [])

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  )
}