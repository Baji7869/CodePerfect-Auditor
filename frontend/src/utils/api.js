import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: `${BASE}/api`, timeout: 300000 }) // 5 min timeout
api.interceptors.response.use(r => r, e => Promise.reject(new Error(e.response?.data?.detail || e.message)))

export const auditAPI = {
  submitUpload: (fd) => api.post('/audit/upload', fd),
  submitDemo: (fd) => api.post('/audit/demo', fd),
  getStatus: (id) => api.get(`/audit/${id}/status`),
  getReport: (id) => api.get(`/audit/${id}/report`),
  listCases: (skip=0, limit=50) => api.get(`/cases?skip=${skip}&limit=${limit}`),
  deleteCase: (caseId) => api.delete(`/cases/${caseId}`),
  getDashboard: () => api.get('/dashboard'),
  getDemoCharts: () => api.get('/demo/charts'),
}

export function createAuditWebSocket(caseId, onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = window.location.host
  const ws = new WebSocket(`${protocol}://${host}/ws/audit/${caseId}`)
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)) } catch {}
  }
  ws.onerror = () => {}
  ws.onclose = () => {}
  return ws
}

export async function pollForReport(caseId, onProgress, maxWaitMs = 600000) {
  const start = Date.now()
  let lastStep = 0
  while (Date.now() - start < maxWaitMs) {
    try {
      const { data } = await auditAPI.getStatus(caseId)
      onProgress?.(data)
      if (data.status === 'completed') {
        const { data: report } = await auditAPI.getReport(caseId)
        return report
      }
      if (data.status === 'error') throw new Error('Audit processing failed')
    } catch(e) {
      if (e.message === 'Audit processing failed') throw e
      // ignore network errors during polling
    }
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('Audit timed out')
}

export default api
