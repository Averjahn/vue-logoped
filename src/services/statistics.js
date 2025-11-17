const STATISTICS_ENDPOINT = import.meta.env.VITE_STATISTICS_URL || '/api/statistics'
const START_ENDPOINT = import.meta.env.VITE_PLATFORM_START_URL || STATISTICS_ENDPOINT

let authToken = import.meta.env.VITE_PLATFORM_TOKEN || null
let sessionId = null

const buildHeaders = () => {
  const headers = { 'Content-Type': 'application/json' }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }
  if (sessionId) {
    headers['session-id'] = sessionId
  }
  return headers
}

const postJson = async (url, payload) => {
  try {
    await fetch(url, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Failed to send statistics', error)
  }
}

export const setAuthToken = (token) => {
  authToken = token
}

export const setSessionId = (session) => {
  sessionId = session
}

export const sendAnswerStat = (payload) => postJson(STATISTICS_ENDPOINT, payload)

export const sendPlatformStartEvent = ({ courseId, testId, startDate }) =>
  postJson(START_ENDPOINT, {
    test_id: Number(testId),
    course_id: Number(courseId) || null,
    body: {
      startDate,
    },
  })

export const sendPlatformAnswerEvent = ({ courseId, testId, body }) =>
  postJson(STATISTICS_ENDPOINT, {
    test_id: Number(testId),
    course_id: Number(courseId) || null,
    body,
  })

