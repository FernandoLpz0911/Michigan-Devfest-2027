// The only place the front end talks to the back end. Shapes are in docs/contract.md.

async function call(method, path, body) {
  const options = { method, headers: {} }
  if (body instanceof FormData) options.body = body
  else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  let res
  try {
    res = await fetch(`/api${path}`, options)
  } catch {
    throw { message: "Couldn't reach the app's server.", fix: 'Check that it is running, then try again.' }
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw data?.error || { message: 'Something went wrong.', fix: 'Try again.' }
  }
  return data
}

function query(filters) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters || {})) {
    if (value !== null && value !== undefined && value !== '' && value !== false) params.set(key, value)
  }
  const text = params.toString()
  return text ? `?${text}` : ''
}

export const api = {
  uploadFile(file) {
    const form = new FormData()
    form.append('file', file)
    return call('POST', '/files', form)
  },
  listFiles: () => call('GET', '/files'),
  fileStatus: (fileId) => call('GET', `/files/${fileId}/status`),
  sendAnswers: (fileId, answers) => call('POST', `/files/${fileId}/answers`, { answers }),
  fileDetail: (fileId) => call('GET', `/files/${fileId}/detail`),
  graniteExchanges: (fileId) => call('GET', `/files/${fileId}/granite`),
  fileView: (fileId) => call('GET', `/files/${fileId}/view`),
  find: (text) => call('POST', '/find', { text }),
  draft: (lot, reading) => call('POST', '/draft', { lot, reading }),
  heldRows: () => call('GET', '/held'),
  records: (filters) => call('GET', `/records${query(filters)}`),
  recordsCsvUrl: (filters) => `/api/records.csv${query(filters)}`,
  timeline: (lot) => call('GET', `/timeline/${encodeURIComponent(lot)}`),
  askRecords: (question) => call('POST', '/records/ask', { question }),
  settings: () => call('GET', '/settings'),
  saveSettings: (settings) => call('PUT', '/settings', settings),
}
