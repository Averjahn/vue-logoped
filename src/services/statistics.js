const STATISTICS_ENDPOINT = import.meta.env.VITE_STATISTICS_URL || '/api/statistics'

export const sendAnswerStat = async (payload) => {
  try {
    await fetch(STATISTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Failed to send statistics', error)
  }
}

