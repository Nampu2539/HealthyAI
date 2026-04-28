import { Stack } from "expo-router"
import { useEffect, useState, useRef } from "react"
import { View, Text, Animated, StyleSheet, Dimensions } from "react-native"
import { startKeepAlive } from "../services/keepAlive"
import { ErrorBoundary } from "../components/ErrorBoundary"
import { AuthProvider } from "../context/AuthContext"
import Svg, { Circle, Line, Ellipse } from "react-native-svg"

const { width, height } = Dimensions.get("window")
const GROUND_Y = height * 0.58
const TARGET_X = width / 2 - 22

const RUN_FRAMES = [
  { la: [-8, 28], ra: [8, 28],   ll: [-12, 52], rl: [12, 52] },
  { la: [-12, 26], ra: [4, 30],  ll: [-6, 52],  rl: [14, 50] },
  { la: [-8, 28], ra: [8, 28],   ll: [12, 52],  rl: [-12, 52] },
  { la: [4, 30],  ra: [-12, 26], ll: [14, 50],  rl: [-6, 52] },
]

function StickFigure({ frameIndex, shadowScale = 1 }) {
  const tilt = frameIndex % 2 === 0 ? "2deg" : "-2deg"
  return (
    <View style={{ alignItems: "center", overflow: "visible" }}>
      <View style={{ overflow: "visible", width: 50, height: 50, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 36, transform: [{ rotate: tilt }, { scaleX: -1 }] }}>
          🏃
        </Text>
      </View>
      <Svg width={44} height={10} viewBox="0 0 44 10" style={{ marginTop: 2 }}>
        <Ellipse
          cx="22" cy="5"
          rx={14 * shadowScale}
          ry={3 * shadowScale}
          fill="rgba(0,0,0,0.35)"
        />
      </Svg>
    </View>
  )
}

function Particles({ visible, cx, cy }) {
  const anims = useRef(Array.from({ length: 10 }, () => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    op: new Animated.Value(1),
    scale: new Animated.Value(1),
  }))).current

  useEffect(() => {
    if (!visible) return
    const angles = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2)
    angles.forEach((angle, i) => {
      const dist = 40 + Math.random() * 40
      Animated.parallel([
        Animated.timing(anims[i].x,     { toValue: Math.cos(angle) * dist, duration: 500, useNativeDriver: true }),
        Animated.timing(anims[i].y,     { toValue: Math.sin(angle) * dist - 20, duration: 500, useNativeDriver: true }),
        Animated.timing(anims[i].op,    { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(anims[i].scale, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]).start()
    })
  }, [visible])

  if (!visible) return null
  const colors = ["#e53e3e", "#fff", "#fbbf24", "#38bdf8", "#34d399"]
  return (
    <>
      {anims.map((a, i) => (
        <Animated.View key={i} style={{
          position: "absolute",
          left: cx - 5, top: cy - 5,
          width: 10, height: 10, borderRadius: 5,
          backgroundColor: colors[i % colors.length],
          opacity: a.op,
          transform: [{ translateX: a.x }, { translateY: a.y }, { scale: a.scale }],
        }} />
      ))}
    </>
  )
}

function SplashScreen({ onFinish }) {
  const fadeOut     = useRef(new Animated.Value(1)).current
  const textSlide   = useRef(new Animated.Value(20)).current
  const logoScale   = useRef(new Animated.Value(0)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const pulseAnim   = useRef(new Animated.Value(1)).current
  const ringAnim    = useRef(new Animated.Value(1)).current
  const ringOpacity = useRef(new Animated.Value(0.6)).current
  const crossFlyY   = useRef(new Animated.Value(0)).current
  const crossFlyOp  = useRef(new Animated.Value(0)).current

  const [figX, setFigX]               = useState(-60)
  const [figVisible, setFigVisible]   = useState(true)
  const [frameIdx, setFrameIdx]       = useState(0)
  const [bounceY, setBounceY]         = useState(0)
  const [shadowScale, setShadowScale] = useState(1)
  const [phase, setPhase]             = useState("run")
  const [showParticles, setShowParticles] = useState(false)

  useEffect(() => {
    if (phase !== "run") return
    const interval = setInterval(() => {
      setFrameIdx(f => f + 1)
      setFigX(x => {
        const next = x + 14
        if (next >= TARGET_X) {
          clearInterval(interval)
          setPhase("jump")
          return TARGET_X
        }
        return next
      })
    }, 40)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (phase !== "jump") return
    let y = 0, vy = -22, bounces = 0
    const jumpInterval = setInterval(() => {
      vy += 2.5
      y += vy
      setShadowScale(Math.max(0.3, 1 - Math.abs(y) / 80))
      if (y >= 0) {
        y = 0
        bounces++
        if (bounces >= 1) {
          clearInterval(jumpInterval)
          setFigVisible(false)
          setShowParticles(true)
          Animated.sequence([
            Animated.parallel([
              Animated.timing(crossFlyY,  { toValue: -120, duration: 400, useNativeDriver: true }),
              Animated.timing(crossFlyOp, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(crossFlyY,  { toValue: 0, duration: 400, useNativeDriver: true }),
              Animated.timing(crossFlyOp, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ]).start(() => setPhase("logo"))
          return
        }
        vy = vy * -0.5
      }
      setBounceY(y)
    }, 30)
    return () => clearInterval(jumpInterval)
  }, [phase])

  useEffect(() => {
    if (phase !== "logo") return
    Animated.parallel([
      Animated.spring(logoScale,   { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(textSlide,   { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.spring(pulseAnim,   { toValue: 1.18, tension: 120, friction: 4, useNativeDriver: true }),
            Animated.timing(ringAnim,    { toValue: 1.6, duration: 300, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(pulseAnim,   { toValue: 1.0, tension: 120, friction: 4, useNativeDriver: true }),
            Animated.timing(ringAnim,    { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
          Animated.delay(150),
          Animated.parallel([
            Animated.spring(pulseAnim,   { toValue: 1.10, tension: 120, friction: 4, useNativeDriver: true }),
            Animated.timing(ringAnim,    { toValue: 1.35, duration: 200, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(pulseAnim,   { toValue: 1.0, tension: 120, friction: 4, useNativeDriver: true }),
            Animated.timing(ringAnim,    { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(ringOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          ]),
          Animated.delay(800),
        ])
      ).start()

      setTimeout(() => {
        Animated.timing(fadeOut, { toValue: 0, duration: 600, useNativeDriver: true }).start(onFinish)
      }, 2000)
    })
  }, [phase])

  const logoX = width / 2
  const logoY = GROUND_Y - 50

  return (
    <Animated.View style={[styles.splash, { opacity: fadeOut }]}>

      {/* version — โชว์พร้อม logo */}
      <Animated.Text style={[styles.version, { opacity: logoOpacity }]}>
        v1.0.0
      </Animated.Text>

      {figVisible && (
        <View style={{
          position: "absolute",
          left: figX,
          top: GROUND_Y - 74,
          transform: [{ translateY: bounceY }],
        }}>
          <StickFigure frameIndex={frameIdx} shadowScale={shadowScale} />
        </View>
      )}

      <Animated.View style={{
        position: "absolute",
        left: logoX - 22, top: logoY - 22,
        opacity: crossFlyOp,
        transform: [{ translateY: crossFlyY }],
      }}>
        <View style={styles.crossMini}>
          <View style={styles.crossMiniV} />
          <View style={styles.crossMiniH} />
        </View>
      </Animated.View>

      <Particles visible={showParticles} cx={logoX} cy={logoY} />

      <Animated.View style={{
        position: "absolute",
        left: logoX - 60, top: logoY - 60,
        opacity: logoOpacity,
        transform: [{ scale: logoScale }],
        alignItems: "center",
      }}>
        <View style={{ width: 120, height: 120, justifyContent: "center", alignItems: "center" }}>
          <Animated.View style={[styles.ring,      { transform: [{ scale: ringAnim }], opacity: ringOpacity }]} />
          <Animated.View style={[styles.ringOuter, { transform: [{ scale: ringAnim }], opacity: ringOpacity }]} />
          <Animated.View style={[styles.iconWrap,  { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.crossV} />
            <View style={styles.crossH} />
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View style={{
        position: "absolute",
        top: logoY + 80, left: 0, right: 0,
        alignItems: "center",
        opacity: logoOpacity,
        transform: [{ translateY: textSlide }],
      }}>
        <Text style={styles.title}>HealthyAI</Text>
        <Text style={styles.subtitle}>ติดตามสุขภาพ · วิเคราะห์โดย AI</Text>
        <View style={styles.dotRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, i === 1 && { backgroundColor: "#e53e3e", width: 10, height: 10 }]} />
          ))}
        </View>
      </Animated.View>

    </Animated.View>
  )
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0f2c5c",
    zIndex: 999,
  },
  ring: {
    position: "absolute",
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2.5, borderColor: "rgba(229,62,62,0.7)",
  },
  ringOuter: {
    position: "absolute",
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 1, borderColor: "rgba(229,62,62,0.3)",
  },
  iconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#e53e3e",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
  },
  crossV:     { width: 14, height: 44, backgroundColor: "#fff", borderRadius: 4, position: "absolute" },
  crossH:     { width: 44, height: 14, backgroundColor: "#fff", borderRadius: 4, position: "absolute" },
  crossMini:  { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  crossMiniV: { width: 10, height: 32, backgroundColor: "#fff", borderRadius: 3, position: "absolute" },
  crossMiniH: { width: 32, height: 10, backgroundColor: "#fff", borderRadius: 3, position: "absolute" },
  title:      { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: 0.5 },
  subtitle:   { color: "rgba(255,255,255,0.55)", fontSize: 14, marginTop: 8 },
  dotRow:     { flexDirection: "row", gap: 6, marginTop: 20, alignItems: "center" },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" },
  version:    { position: "absolute", bottom: 24, right: 20, color: "rgba(255,255,255,0.3)", fontSize: 11 },
})

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => { startKeepAlive() }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      </AuthProvider>
    </ErrorBoundary>
  )
}