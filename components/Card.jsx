import { View, StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

/**
 * Card Component - Standard white card
 */
export function Card({ 
  children, 
  style,
  testID,
  accessible = true,
  accessibilityLabel
}) {
  return (
    <View 
      style={[styles.card, style]}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  )
}

/**
 * Card Component - Accent/highlight variant
 */
export function AccentCard({ 
  children, 
  style,
  testID,
  accessible = true,
  accessibilityLabel
}) {
  return (
    <View 
      style={[styles.accent, style]}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  )
}

/**
 * Card Component - Error/warning variant
 */
export function ErrorCard({ 
  children, 
  style,
  testID,
  accessible = true,
  accessibilityLabel
}) {
  return (
    <View 
      style={[styles.error, style]}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  )
}

/**
 * Card Component - Info/hint variant
 */
export function InfoCard({ 
  children, 
  style,
  testID,
  accessible = true,
  accessibilityLabel
}) {
  return (
    <View 
      style={[styles.info, style]}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  accent: {
    backgroundColor: Colors.accentLight,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  error: {
    backgroundColor: "#fde8e8",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#f5c6c6",
  },
  info: {
    backgroundColor: Colors.accentLight,
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
})
