export async function request(url, options = {}) {
  const response = await fetch(url, options)
  const contentType = response.headers.get('content-type') || ''
  let payload = null

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json()
    } catch {
      payload = null
    }
  } else {
    try {
      const text = await response.text()
      payload = text ? text : null
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    let message = 'Request failed'
    if (payload) {
      if (typeof payload === 'string') {
        message = payload
      } else if (payload.message) {
        message = payload.message
      } else if (payload.error) {
        message = payload.error
      }
    } else if (response.statusText) {
      message = response.statusText
    }
    throw new Error(message)
  }

  return payload
}
