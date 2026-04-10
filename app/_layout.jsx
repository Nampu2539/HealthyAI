import { Stack } from "expo-router"
import { useEffect } from "react"
import { startKeepAlive } from "../services/keepAlive"
import { ErrorBoundary } from "../components/ErrorBoundary"

export default function RootLayout() {
  useEffect(() => {
    startKeepAlive()
  }, [])

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ErrorBoundary>
  )
}