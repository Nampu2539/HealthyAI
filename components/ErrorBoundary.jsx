import React from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native"
import { Colors } from "../constants/colors"

/**
 * Error Boundary - Catches errors from child components
 * Prevents entire app from crashing
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>⚠️</Text>
            </View>

            <Text style={styles.title}>เกิดข้อผิดพลาด</Text>
            <Text style={styles.subtitle}>
              แอปพลิเคชันพบปัญหาที่ไม่คาดคิด
            </Text>

            {this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            {__DEV__ && this.state.errorInfo && (
              <View style={styles.debugBox}>
                <Text style={styles.debugTitle}>Debug Info (Dev Only):</Text>
                <Text style={styles.debugText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>🔄 ลองใหม่</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => {
                // Could navigate to home screen
                console.log("Navigate to home")
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonTextSecondary}>🏠 กลับหน้าแรก</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 44,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  errorBox: {
    backgroundColor: "#fde8e8",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "#f5c6c6",
  },
  errorTitle: {
    color: Colors.danger,
    fontWeight: "700",
    fontSize: 12,
    marginBottom: 6,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "monospace",
  },
  debugBox: {
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  debugTitle: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 11,
    marginBottom: 6,
  },
  debugText: {
    color: Colors.primary,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  buttonSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonTextSecondary: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
})
