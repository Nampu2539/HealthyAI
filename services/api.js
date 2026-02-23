import axios from "axios"

const BASE_URL = "https://healthy-ai.onrender.com"

export const getUser = async (userId) => {
  try {
    const res = await axios.get(`${BASE_URL}/user/${userId}`)
    return res.data
  } catch (error) {
    console.error("getUser error:", error)
    return null
  }
}

export const getRecommendations = async (userId) => {
  try {
    const res = await axios.get(`${BASE_URL}/recommend/${userId}`)
    return res.data
  } catch (error) {
    console.error("getRecommendations error:", error)
    return null
  }
}

export const getAnalytics = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/analytics`)
    return res.data
  } catch (error) {
    console.error("getAnalytics error:", error)
    return null
  }
}