import { Stack } from "expo-router"
import { useEffect } from "react"
import { startKeepAlive } from "../services/keepAlive"
import { ErrorBoundary } from "../components/ErrorBoundary"
import { AuthProvider } from "../context/AuthContext"

export default function RootLayout() {
  useEffect(() => {
    startKeepAlive()
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  )
}