/**
 * Centralized API Configuration
 * Use this file for all backend API URLs
 */

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://healthy-ai.onrender.com"

export const BASE_URL = API_URL

export const API_ENDPOINTS = {
  // User endpoints
  getUser: (userId) => `${API_URL}/user/${userId}`,
  
  // Analytics endpoints
  getAnalytics: () => `${API_URL}/analytics`,
  
  // Health calculation
  calculateWellness: () => `${API_URL}/calculate-wellness`,
  
  // Food analysis
  analyzeFood: () => `${API_URL}/analyze-food`,
  
  // AI Chat
  chat: () => `${API_URL}/chat`,
  
  // Health check (keep alive)
  healthCheck: () => `${API_URL}/`,
}

export default {
  BASE_URL,
  API_ENDPOINTS,
}
