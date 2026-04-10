import { View, Text, StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

/**
 * MetricBarRow - Display metric with horizontal bar and score
 * Used in result cards and comparisons
 */
export function MetricBarRow({ 
  label, 
  score, 
  getColor,
  testID,
  accessible = true,
  accessibilityLabel
}) {
  if (typeof score !== "number" || isNaN(score)) {
    return null
  }

  const color = getColor?.(score) || Colors.primary
  const displayScore = Math.min(Math.max(score, 0), 100)

  return (
    <View 
      style={{ marginBottom: 16 }}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || `${label}: ${displayScore.toFixed(1)} out of 100`}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }}>
        <Text style={{ color: Colors.text, fontSize: 14 }}>{label}</Text>
        <Text style={{ color, fontWeight: "700", fontSize: 14 }}>
          {displayScore.toFixed(1)}
        </Text>
      </View>
      <View style={styles.barBg}>
        <View 
          style={[
            styles.barFg, 
            { 
              width: `${displayScore}%`, 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  barBg: {
    height: 7,
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
  barFg: {
    height: 7,
    borderRadius: 4,
  },
})
