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

// Upload responses kept for this browser session, so Check can open from the file list.
const uploadResults = new Map()
const KEY = (id) => `dw.result.${id}`

function store(fn) {
  try { return fn() } catch { return null }
}

export const api = {
  async uploadFile(file) {
    const form = new FormData()
    form.append('file', file)
    const result = await call('POST', '/files', form)
    if (result?.file_id) {
      uploadResults.set(result.file_id, result)
      store(() => sessionStorage.setItem(KEY(result.file_id), JSON.stringify(result)))
    }
    return result
  },
  uploadResult: (fileId) =>
    uploadResults.get(fileId) || store(() => JSON.parse(sessionStorage.getItem(KEY(fileId)))) || null,
  listFiles: () => call('GET', '/files'),
  async deleteFile(fileId) {
    const done = await call('DELETE', `/files/${fileId}`)
    uploadResults.delete(fileId)
    store(() => sessionStorage.removeItem(KEY(fileId)))
    return done
  },
  fileStatus: (fileId) => call('GET', `/files/${fileId}/status`),
  async sendAnswers(fileId, answers) {
    const saved = await call('POST', `/files/${fileId}/answers`, { answers })
    uploadResults.delete(fileId)
    store(() => sessionStorage.removeItem(KEY(fileId)))
    return saved
  },
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
