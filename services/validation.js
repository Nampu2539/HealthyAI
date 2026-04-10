/**
 * Data Validation Utilities
 * Ensures API responses have required fields
 */

/**
 * Validate food analysis response
 */
export function validateFoodResult(data) {
  if (!data) {
    throw new Error("ได้รับ response ว่างเปล่า")
  }
  
  if (!data.result || typeof data.result !== "string") {
    throw new Error("ข้อมูลวิเคราะห์อาหารไม่ถูกต้อง")
  }
  
  return data
}

/**
 * Validate chat response
 */
export function validateChatReply(data) {
  if (!data) {
    throw new Error("ได้รับ response ว่างเปล่า")
  }
  
  if (!data.reply || typeof data.reply !== "string") {
    throw new Error("ไม่ได้รับคำตอบจาก AI")
  }
  
  return data
}

/**
 * Validate wellness calculation response
 */
export function validateWellnessResult(data) {
  if (!data) {
    throw new Error("ได้รับ response ว่างเปล่า")
  }

  const requiredFields = [
    "overall_score",
    "bmi",
    "bmi_category",
    "percentile",
    "sleep_score",
    "activity_score",
    "cardiovascular_score",
    "mental_score",
    "total_users",
    "avg_wellness",
  ]

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`ข้อมูล "${field}" หายไป`)
    }
  }

  return data
}

/**
 * Validate user data
 */
export function validateUserData(data) {
  if (!data) {
    throw new Error("ไม่สามารถโหลด user data ได้")
  }

  if (typeof data.Overall_Wellness_Score !== "number") {
    throw new Error("ข้อมูล wellness score ไม่ถูกต้อง")
  }

  return data
}

/**
 * Validate analytics data
 */
export function validateAnalyticsData(data) {
  if (!data) {
    throw new Error("ไม่สามารถโหลด analytics data ได้")
  }

  if (typeof data.avg_wellness !== "number") {
    throw new Error("ข้อมูล analytics ไม่ถูกต้อง")
  }

  return data
}
