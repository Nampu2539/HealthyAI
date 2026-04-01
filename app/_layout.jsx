import { Stack } from "expo-router"
import { useEffect } from "react"
import { startKeepAlive } from "../services/keepAlive"

export default function RootLayout() {
  useEffect(() => {
    startKeepAlive()
  }, [])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}