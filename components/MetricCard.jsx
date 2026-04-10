import { View, Text, StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

/**
 * MetricCard - Display individual health metric
 * Shows emoji, label, value, and progress bar
 */
export function MetricCard({ 
  emoji, 
  label, 
  value, 
  color, 
  bgColor,
  testID,
  accessible = true,
  accessibilityLabel
}) {
  if (typeof value !== "number" || isNaN(value)) {
    return null
  }

  return (
    <View 
      style={[styles.card, { borderTopWidth: 3, borderTopColor: color }]}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `${label}: ${value.toFixed(1)} out of 100`}
    >
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={styles.name}>{label}</Text>
      <Text style={[styles.val, { color }]}>{value.toFixed(1)}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFg, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emoji: {
    fontSize: 20,
  },
  name: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  val: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
    marginBottom: 10,
  },
  barBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  barFg: {
    height: 4,
    borderRadius: 2,
  },
})
