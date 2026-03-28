import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: `${BASE}/api`, timeout: 300000 })

// Attach JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('cp_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Handle 401 — redirect to login
api.interceptors.response.use(
  r => r,
  e => {
    if (e.response?.status === 401) {
      localStorage.removeItem('cp_token')
      localStorage.removeItem('cp_user')
      window.location.href = '/login'
    }
    return Promise.reject(new Error(e.response?.data?.detail || e.message))
  }
)

export const auditAPI = {
  submitUpload:   (fd)   => api.post('/audit/upload', fd),
  submitDemo:     (fd)   => api.post('/audit/demo', fd),
  getStatus:      (id)   => api.get(`/audit/${id}/status`),
  getReport:      (id)   => api.get(`/audit/${id}/report`),
  listCases:      (skip=0, limit=50) => api.get(`/cases?skip=${skip}&limit=${limit}`),
  deleteCase:     (caseId) => api.delete(`/cases/${caseId}`),
  getDashboard:   ()     => api.get('/dashboard'),
  getDemoCharts:  ()     => api.get('/demo/charts'),
}

export const authAPI = {
  login:          (username, password) => api.post('/auth/login', { username, password }),
  logout:         ()     => api.post('/auth/logout'),
  me:             ()     => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
  listUsers:      ()     => api.get('/auth/users'),
  createUser:     (data) => api.post('/auth/users', data),
  deleteUser:     (username) => api.delete(`/auth/users/${username}`),
  getRoles:       ()     => api.get('/auth/roles'),
}

export function createAuditWebSocket(caseId, onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = window.location.host
  const token = localStorage.getItem('cp_token') || ''
  const ws = new WebSocket(`${protocol}://${host}/ws/audit/${caseId}?token=${token}`)
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)) } catch {}
  }
  ws.onerror = () => {}
  ws.onclose = () => {}
  return ws
}

export async function pollForReport(caseId, onProgress, maxWaitMs = 600000) {
  const start = Date.now()
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
    }
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('Audit timed out')
}

export default api