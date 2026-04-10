# HealthyAI - Bug Fix & Improvement Plan

## 📋 Overview
Plan to fix identified issues and improve code quality

---

## 🔴 Priority 1: Critical Bugs (Must Fix)

### 1.1 Food Scanner Image Picker Issue
**File**: `app/(tabs)/foodscan.jsx` (line 20-35)
**Problem**: Uses `document.createElement('input')` which doesn't exist in React Native
**Impact**: foodscan page will crash on mobile devices
**Solution**: Replace with `expo-image-picker`
**Effort**: Medium (requires new dependency + logic rewrite)
**Status**: ⏳ Pending

```javascript
// CURRENT (❌ Won't work on mobile)
const input = document.createElement("input")

// SHOULD BE (✅ Works everywhere)
import * as ImagePicker from 'expo-image-picker'
await ImagePicker.launchImageLibraryAsync()
```

---

### 1.2 Missing Error Response Validation
**File**: `services/cache.js`
**Problem**: No check for `res.ok` before parsing JSON
**Impact**: If API returns error (404, 500, etc), will throw confusing error
**Solution**: Add response status check
**Effort**: Low (simple null-safety)
**Status**: ⏳ Pending

```javascript
// CURRENT (⚠️ Risky)
const data = await res.json()

// SHOULD BE (✅ Safe)
if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
const data = await res.json()
```

---

### 1.3 Missing Error Response Check in Dashboard
**File**: `app/(tabs)/index.jsx` (line 244)
**Problem**: POST request doesn't check response status
**Impact**: Invalid API responses silently fail
**Solution**: Add error checking for `calculate-wellness` endpoint
**Effort**: Low
**Status**: ⏳ Pending

---

## 🟡 Priority 2: Improvements (Should Fix)

### 2.1 Environment Variables
**File**: Multiple (BASE_URL hardcoded)
**Problem**: API URL hardcoded in 5 different places
**Impact**: Hard to switch environments (dev/prod)
**Solution**: Create `.env` file + use single source of truth
**Effort**: Medium
**Status**: ⏳ Pending

```javascript
// Create: config/api.js
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 
  "https://healthy-ai.onrender.com"
```

---

### 2.2 Error Message Context
**File**: `app/(tabs)/index.jsx` + other files
**Problem**: Generic error messages like "ไม่สามารถโหลดข้อมูลได้"
**Impact**: Users don't know what went wrong
**Solution**: Include error.message from API responses
**Effort**: Low
**Status**: ⏳ Pending

---

### 2.3 AuthContext Not Used
**File**: `context/AuthContext.jsx`
**Problem**: AuthContext exists but never integrated
**Impact**: No actual authentication flow
**Solution**: Start using in RootLayout or remove if not needed
**Effort**: Medium
**Status**: ⏳ Pending

---

### 2.4 Missing Loading State in Recommendations
**File**: `app/(tabs)/recommendations.jsx`
**Problem**: Chat might feel unresponsive if API is slow
**Impact**: Users don't know if message was sent
**Solution**: Already has loading state but verify it works
**Effort**: Low (maybe just testing)
**Status**: ⏳ Pending

---

## 🟢 Priority 3: Nice-to-Have Enhancements

### 3.1 Extract Reusable Components
**Files**: Multiple
**Problem**: Inline styling + component logic scattered
**Solution**: Extract to `components/` folder
**Examples**:
- `MetricCard` → separate file
- `Button` variants (primary, ghost)
- `Card` wrapper
**Effort**: Medium
**Status**: ⏳ Pending

---

### 3.2 Add Error Boundary
**Problem**: App crashes silently if any component errors
**Solution**: Wrap RootLayout with error boundary
**Effort**: Low
**Status**: ⏳ Pending

---

### 3.3 Accessibility Improvements
**Problem**: No accessibility labels on interactive elements
**Solution**: Add testID, accessible, accessibilityLabel
**Effort**: Medium
**Status**: ⏳ Pending

---

### 3.4 Data Validation
**Problem**: Food analysis result assumed to have content
**Solution**: Validate API responses have required fields
**Effort**: Low
**Status**: ⏳ Pending

---

## 📊 Implementation Order

```
Phase 1: Fix Critical Issues (Days 1-2)
├─ Fix foodscan image picker
├─ Add response validation in cache.js
├─ Add error checking in index.jsx POST

Phase 2: Improve Architecture (Day 3)
├─ Create environment config
├─ Centralize error handling
├─ Extract reusable components

Phase 3: Polish (Day 4+)
├─ Auth integration
├─ Error boundaries
├─ Accessibility
```

---

## 🧪 Testing Checklist

After fixes, verify:
- [ ] App loads without console errors
- [ ] foodscan page opens on device
- [ ] File picker works (image selection)
- [ ] Form submission succeeds & stores data
- [ ] AsyncStorage persists after app close
- [ ] API errors display user-friendly messages
- [ ] Tab switching is smooth
- [ ] Charts render correctly
- [ ] All links/navigation work

---

## 📝 Code Quality Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Error Handling Coverage | ~40% | 90% |
| Response Validation | 0% | 100% |
| Component Reusability | Low | High |
| Accessibility | None | WCAG AA |

---

## 🎯 Success Criteria

✅ All Priority 1 bugs fixed
✅ Zero runtime crashes on mobile
✅ Clear error messages for users
✅ Code organized and maintainable
✅ Ready for production testing

