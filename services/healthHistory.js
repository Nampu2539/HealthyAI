import AsyncStorage from "@react-native-async-storage/async-storage"

const HISTORY_KEY = "health_history"

// ─── SAVE ─────────────────────────────────────────────────────────────────────
export async function saveHealthRecord(form, result) {
  try {
    const existing = await getHealthHistory()
    const record = {
      id: "h" + Date.now(),
      date: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }),
      scores: {
        overall:  result.overall_score         ?? 0,
        sleep:    result.sleep_score           ?? 0,
        activity: result.activity_score        ?? 0,
        cardio:   result.cardiovascular_score  ?? 0,
        mental:   result.mental_score          ?? 0,
      },
      form: {
        age:         form.age,
        weight:      form.weight,
        height:      form.height,
        sleep_hours: form.sleep_hours,
        gender:      form.gender,
        activity_level: form.activity_level,
      },
      bmi:          result.bmi          ?? null,
      bmi_category: result.bmi_category ?? null,
    }
    const updated = [record, ...existing].slice(0, 50)
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    return record
  } catch (err) {
    console.error("saveHealthRecord error:", err)
    return null
  }
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export async function getHealthHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error("getHealthHistory error:", err)
    return []
  }
}

// ─── DELETE ONE ───────────────────────────────────────────────────────────────
export async function deleteHealthRecord(id) {
  try {
    const existing = await getHealthHistory()
    const updated = existing.filter((r) => r.id !== id)
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error("deleteHealthRecord error:", err)
  }
}

// ─── CLEAR ALL ────────────────────────────────────────────────────────────────
export async function clearHealthHistory() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY)
  } catch (err) {
    console.error("clearHealthHistory error:", err)
  }
}

// ─── MONTHLY SUMMARY ──────────────────────────────────────────────────────────
export async function getMonthlySummary(months = 2) {
  try {
    const history = await getHealthHistory()
    if (!history.length) return []

    const grouped = {}
    history.forEach((rec) => {
      const d = new Date(rec.date)
      const key = isNaN(d) ? "unknown" : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(rec)
    })

    const sorted = Object.keys(grouped).sort().reverse().slice(0, months)
    return sorted.map((key) => {
      const recs = grouped[key]
      const avg = (field) => recs.reduce((s, r) => s + (r.scores[field] ?? 0), 0) / recs.length
      const [year, month] = key.split("-")
      const monthNames = ["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."]
      return {
        month:    `${monthNames[Number(month)]} ${year}`,
        overall:  +avg("overall").toFixed(1),
        sleep:    +avg("sleep").toFixed(1),
        activity: +avg("activity").toFixed(1),
        cardio:   +avg("cardio").toFixed(1),
        mental:   +avg("mental").toFixed(1),
        count:    recs.length,
      }
    })
  } catch (err) {
    console.error("getMonthlySummary error:", err)
    return []
  }
}

// ─── SCORE TREND ──────────────────────────────────────────────────────────────
export async function getScoreTrend(field = "overall", limit = 7) {
  try {
    const history = await getHealthHistory()
    return history
      .slice(0, limit)
      .map((r) => ({ date: r.date, value: r.scores[field] ?? 0 }))
      .reverse()
  } catch (err) {
    console.error("getScoreTrend error:", err)
    return []
  }
}