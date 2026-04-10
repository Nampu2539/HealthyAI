# HealthyAI - Architecture Documentation

## 🏗️ Project Overview
HealthyAI เป็นแอปพลิเคชัน React Native (Expo) สำหรับติดตามและวิเคราะห์สุขภาพด้วย AI ที่ทำงานบน iOS, Android, และ Web

---

## 📁 Folder Structure

```
HealthyAI/
├── app/                          # Expo Router - ไฟล์หลัก
│   ├── _layout.jsx              # Root layout + Keep Alive service
│   ├── index.jsx                # Redirect → /(tabs)
│   └── (tabs)/                  # Tab navigation
│       ├── _layout.jsx          # Tab bar configuration
│       ├── index.jsx            # Dashboard (หน้าจอหลัก)
│       ├── analytics.jsx        # Analytics & Radar charts
│       ├── recommendations.jsx  # AI Chat Coach
│       ├── foodscan.jsx         # Food AI Scanner
│       └── profile.jsx          # User Profile
│
├── assets/                       # Static resources
│   └── images/
│
├── components/                   # Reusable components (empty)
│
├── constants/
│   └── colors.js                # Theme colors
│
├── context/
│   └── AuthContext.jsx          # Auth state management
│
├── services/
│   ├── cache.js                 # API caching with TTL
│   └── keepAlive.js             # Keep backend awake
│
├── index.js                      # Entry point
├── app.json                      # Expo config
└── package.json                  # Dependencies
```

---

## 🔌 Backend Integration

**Base URL**: `https://healthy-ai.onrender.com`

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/user/:id` | ดึงข้อมูล wellness score ของ user |
| `GET` | `/analytics` | ดึงสถิติประชากรโดยรวม |
| `POST` | `/calculate-wellness` | คำนวณ wellness score จากข้อมูล |
| `POST` | `/analyze-food` | วิเคราะห์อาหารจากภาพ (base64) |
| `POST` | `/chat` | AI Health Coach chat |
| `GET` | `/` | Keep alive ping |

---

## 🎨 UI Architecture

### Color System (`constants/colors.js`)
```javascript
{
  primary: "#1B3A6B",        // ปุ่ม, โฮเวอร์, highlight
  primaryLight: "#378ADD",   // accent
  primaryDark: "#0F2548",    // gradients
  background: "#F0F4F8",     // screen bg
  card: "#FFFFFF",           // card bg
  border: "#D6E0EF",         // borders, dividers
  text: "#1A2744",           // text หลัก
  textMuted: "#5A7096",      // text secondary
  success: "#1D9E75",        // ✓ score >= 70
  warning: "#BA7517",        // ⚠ score 50-70
  danger: "#A32D2D",         // ✗ score < 50
}
```

---

## 📊 Data Flow

### Dashboard (index.jsx)
```
1. Mount → AsyncStorage.getItem("healthForm", "healthResult")
2. fetchData() → GET /user/:id + GET /analytics
3. UI Render → 3 tabs (overview, mystats, population)
   - Overview: display score ring, metrics, chart
   - My Stats: submit health form → POST /calculate-wellness
   - Population: compare with population average
```

### Health Form Submission
```
User fills form (age, weight, height, sleep_hours, gender, activity_level)
    ↓
Validation (all fields required)
    ↓
POST /calculate-wellness
    ↓
Save healthForm + result → AsyncStorage
    ↓
Display result card with AI insights
```

### Analytics Page
```
GET /analytics → population stats
    ↓
Render Radar chart for metrics comparison
    ↓
Show BarChart/PieChart with segment breakdown
```

---

## 💾 Data Storage

### AsyncStorage (Persistent)
```javascript
"healthForm" = {
  age, gender, weight, height, sleep_hours, activity_level
}

"healthResult" = {
  overall_score, bmi, bmi_category, percentile,
  sleep_score, activity_score, cardiovascular_score, mental_score,
  summary, advice, total_users, avg_wellness
}
```

### Cache (In-Memory)
```javascript
cache[url] = { data, time: timestamp }
// TTL: 30s for user data, 60s for analytics
```

---

## 🎯 Component Hierarchy

### Dashboard (index.jsx)
- `ScoreRing` - SVG animated score display
- `FormProgress` - progress bar for form
- `MetricCard` - individual metric display
- `MetricBarRow` - metric with bar graph

### Tabs
- `_layout.jsx` - Base tabs container
- `index.jsx` - Main dashboard
- `analytics.jsx` - Analytics with radar chart
- `recommendations.jsx` - Chat interface
- `foodscan.jsx` - Image upload + analysis
- `profile.jsx` - User profile + settings

---

## 🔄 State Management

### Local State (useState)
- `activeTab` - current tab
- `user` - API user data
- `analytics` - population stats
- `healthForm` - form inputs
- `healthResult` - calculation results
- `loading`, `error` - UI states

### Context (AuthContext)
- `user` - logged in user info
- `login()`, `logout()` - auth actions

---

## 🎬 Animation System

### Animated Values (useRef)
| Variable | Purpose |
|----------|---------|
| `fadeAnim` | Fade in on mount |
| `slideAnim` | Slide up on mount |
| `scoreAnim` | Animate score number |
| `pulseAnim` | Pulse FAB button |
| `tabAnim` | Tab indicator movement |

---

## 📱 Key Libraries

| Package | Version | Usage |
|---------|---------|-------|
| `expo-router` | ~6.0.23 | File-based routing |
| `react-native` | 0.81.5 | UI framework |
| `react-native-chart-kit` | ^6.12.0 | Charts (Bar, Pie, Line) |
| `react-native-svg` | 15.12.1 | SVG rendering |
| `expo-linear-gradient` | ~15.0.8 | Gradient backgrounds |
| `@react-native-async-storage/async-storage` | ^2.2.0 | Persistent storage |
| `axios` | ^1.13.5 | HTTP client (optional, using fetch) |

---

## ⚡ Performance Optimization

1. **Caching**: API responses cached with TTL
2. **Keep Alive**: Periodic ping to backend (every 10 mins)
3. **Lazy Rendering**: Components render based on active tab
4. **Memory Cleanup**: useEffect cleanup for listeners

---

## 🐛 Known Issues / Technical Debt

1. **foodscan.jsx**: Uses `document.createElement()` (Web-only) - needs `expo-image-picker`
2. **Error Handling**: No response.ok check in fetchWithCache
3. **Error Messages**: Generic error text - missing specific API error details
4. **No Auth Flow**: AuthContext exists but not integrated
5. **Accessibility**: Limited a11y labels on buttons

---

## 🔐 Security Notes

- No API key validation visible
- AsyncStorage stores health data in cleartext
- Backend URL hardcoded (should use env vars)
- No encryption for sensitive data

---

## 📈 Scalability Considerations

- **Tab Structure**: Ready for additional tabs
- **Component Reusability**: MetricCard, MetricBarRow can be extracted
- **Color System**: Centralized and easy to theme
- **API Integration**: fetchWithCache pattern scalable

