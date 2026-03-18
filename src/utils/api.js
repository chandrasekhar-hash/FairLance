// Centralized API configuration
// During development, this points to localhost:3001
// In production, this should point to your deployed backend URL

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default API_BASE_URL;

export const fetchWithTimeout = async (url, options, timeoutMs = 30000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        })

        clearTimeout(timeoutId)
        return response

    } catch (error) {
        clearTimeout(timeoutId)

        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.')
        }

        throw error
    }
}
