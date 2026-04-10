import { TouchableOpacity, Text, StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

/**
 * Button Component - Primary variant
 */
export function PrimaryButton({ 
  label, 
  onPress, 
  loading = false, 
  disabled = false,
  testID,
  accessible = true,
  accessibilityLabel
}) {
  return (
    <TouchableOpacity
      style={[styles.primary, (loading || disabled) && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </TouchableOpacity>
  )
}

/**
 * Button Component - Ghost variant (outlined)
 */
export function GhostButton({ 
  label, 
  onPress, 
  disabled = false,
  testID,
  accessible = true,
  accessibilityLabel
}) {
  return (
    <TouchableOpacity
      style={[styles.ghost, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text style={styles.ghostText}>{label}</Text>
    </TouchableOpacity>
  )
}

/**
 * Button Component - Secondary variant
 */
export function SecondaryButton({ 
  label, 
  onPress, 
  disabled = false,
  testID,
  accessible = true,
  accessibilityLabel
}) {
  return (
    <TouchableOpacity
      style={[styles.secondary, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text style={styles.secondaryText}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  ghost: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  ghostText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  secondary: {
    backgroundColor: Colors.accentLight,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  secondaryText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
})
