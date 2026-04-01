import axios from 'axios'
import {
  mockRecords, mockRecordsSummary, mockMonthly,
  mockInvoices, mockReimbursements, mockReimbSummary,
} from './mockData.js'

const BASE_URL = 'https://financial-records-production.up.railway.app'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request: attach token ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response: mock fallback on network error ─────────────────────
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    // Backend unreachable / timeout → fall back to mock
    if (!err.response || err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
      console.warn('[API Mock] Backend unavailable, using mock data:', err.config?.url)
      return mockHandler(err.config)
    }
    const msg = err.response?.data?.detail || err.response?.data?.message || err.message || '请求失败'
    return Promise.reject(new Error(Array.isArray(msg) ? msg[0]?.msg : msg))
  }
)

// ── Mock handler ─────────────────────────────────────────────────
function mockHandler(config) {
  const url = config.url || ''
  const params = config.params || {}

  const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

  // ── Auth ──────────────────────────────────────────────────────
  if (url === '/api/auth/login' || url.includes('mockLogin')) {
    return delay(400).then(() => ({
      token: 'mock-token-' + Date.now(),
      user: { username: '张三', name: '演示用户' },
    }))
  }

  // ── Records ───────────────────────────────────────────────────
  if (url === '/api/records/summary')   return delay().then(() => mockRecordsSummary)
  if (url === '/api/records/monthly')   return delay().then(() => mockMonthly)
  if (url === '/api/records/category-analysis') return delay().then(() => [])

  if (url === '/api/records') {
    return delay().then(() => {
      let data = [...mockRecords]
      if (params.type === 'income')  data = data.filter(r => r.type === 'income')
      if (params.type === 'expense') data = data.filter(r => r.type === 'expense')
      if (params.category)          data = data.filter(r => r.category === params.category)
      if (params.dateFrom)           data = data.filter(r => r.record_date >= params.dateFrom)
      if (params.dateTo)             data = data.filter(r => r.record_date <= params.dateTo)
      const page = parseInt(params.page || 1)
      const limit = parseInt(params.limit || 20)
      const total = data.length
      const start = (page - 1) * limit
      return { list: data.slice(start, start + limit), total, page, limit }
    })
  }

  if (url.startsWith('/api/records/') && config.method === 'put') {
    const id = parseInt(url.split('/')[3])
    return delay().then(() => {
      const idx = mockRecords.findIndex(r => r.id === id)
      if (idx >= 0) Object.assign(mockRecords[idx], config.data)
      return { ...config.data, id }
    })
  }

  if (url.startsWith('/api/records/') && config.method === 'delete') {
    const id = parseInt(url.split('/')[3])
    return delay().then(() => {
      const idx = mockRecords.findIndex(r => r.id === id)
      if (idx >= 0) mockRecords.splice(idx, 1)
      return { id }
    })
  }

  if (url === '/api/records' && config.method === 'post') {
    return delay().then(() => {
      const newId = Math.max(...mockRecords.map(r => r.id), 0) + 1
      const record = { ...config.data, id: newId }
      mockRecords.unshift(record)
      return record
    })
  }

  // ── Invoices ──────────────────────────────────────────────────
  if (url === '/api/invoices') {
    return delay().then(() => {
      let data = [...mockInvoices]
      if (params.status) data = data.filter(i => i.status === params.status)
      return { list: data, total: data.length }
    })
  }

  if (url === '/api/invoices' && config.method === 'post') {
    return delay().then(() => {
      const newId = Math.max(...mockInvoices.map(i => i.id), 0) + 1
      const inv = { ...config.data, id: newId, status: 'pending' }
      mockInvoices.unshift(inv)
      return inv
    })
  }

  if (url.match(/^\/api\/invoices\/\d+$/) && config.method === 'put') {
    return delay().then(() => ({ ...config.data, success: true }))
  }

  if (url.match(/^\/api\/invoices\/\d+\/upload$/)) {
    return delay(600).then(() => ({ file_path: '/mock-uploaded.pdf', success: true }))
  }

  // ── Reimbursements ────────────────────────────────────────────
  if (url === '/api/reimbursements/summary') return delay().then(() => mockReimbSummary)

  if (url === '/api/reimbursements') {
    return delay().then(() => {
      let data = [...mockReimbursements]
      if (params.status) data = data.filter(r => r.status === params.status)
      return { list: data, total: data.length }
    })
  }

  if (url === '/api/reimbursements' && config.method === 'post') {
    return delay().then(() => {
      const newId = Math.max(...mockReimbursements.map(r => r.id), 0) + 1
      const reimb = { ...config.data, id: newId, status: 'pending' }
      mockReimbursements.unshift(reimb)
      return reimb
    })
  }

  if (url.match(/^\/api\/reimbursements\/\d+\/approve$/)) {
    const id = parseInt(url.split('/')[3])
    return delay().then(() => {
      const r = mockReimbursements.find(x => x.id === id)
      if (r) r.status = 'approved'
      return { id, status: 'approved' }
    })
  }

  if (url.match(/^\/api\/reimbursements\/\d+\/reject$/)) {
    const id = parseInt(url.split('/')[3])
    return delay().then(() => {
      const r = mockReimbursements.find(x => x.id === id)
      if (r) r.status = 'rejected'
      return { id, status: 'rejected' }
    })
  }

  if (url.match(/^\/api\/reimbursements\/\d+\/pay$/)) {
    const id = parseInt(url.split('/')[3])
    return delay().then(() => {
      const r = mockReimbursements.find(x => x.id === id)
      if (r) r.status = 'paid'
      return { id, status: 'paid' }
    })
  }

  return Promise.reject(new Error('[Mock] Unknown endpoint: ' + url))
}

// ── Auth API ──────────────────────────────────────────────────────
export const authAPI = {
  mockLogin: (username, password) => {
    if (username && password) {
      const token = btoa(username + ':' + password)
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify({ username, name: username }))
      return Promise.resolve({ token, user: { username, name: username } })
    }
    return Promise.reject(new Error('请输入账号密码'))
  },
}

// ── Records ───────────────────────────────────────────────────────
export const recordsAPI = {
  list: (params = {}) => {
    const p = { ...params }
    if (p.type === '收入') p.type = 'income'
    if (p.type === '支出') p.type = 'expense'
    return api.get('/api/records', { params: p })
  },
  create:   (data) => api.post('/api/records', data),
  update:   (id, data) => api.put(`/api/records/${id}`, data),
  delete:   (id) => api.delete(`/api/records/${id}`),
  summary: () => api.get('/api/records/summary'),
  monthly: () => api.get('/api/records/monthly'),
  categoryAnalysis: () => api.get('/api/records/category-analysis'),
}

// ── Invoices ──────────────────────────────────────────────────────
export const invoicesAPI = {
  list:    (params = {}) => api.get('/api/invoices', { params }),
  create:  (data) => api.post('/api/invoices', data),
  get:     (id) => api.get(`/api/invoices/${id}`),
  update:  (id, data) => api.put(`/api/invoices/${id}`, data),
  upload:  (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post(`/api/invoices/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

// ── Reimbursements ────────────────────────────────────────────────
export const reimbursementsAPI = {
  list:     (params = {}) => api.get('/api/reimbursements', { params }),
  create:   (data) => api.post('/api/reimbursements', data),
  get:      (id) => api.get(`/api/reimbursements/${id}`),
  update:   (id, data) => api.put(`/api/reimbursements/${id}`, data),
  approve:  (id, approver) => api.post(`/api/reimbursements/${id}/approve`, { approver: approver || '主管' }),
  reject:   (id, reason) => api.post(`/api/reimbursements/${id}/reject`, { reason, approver: '主管' }),
  pay:      (id, operator) => api.post(`/api/reimbursements/${id}/pay`, { operator: operator || '出纳' }),
  summary:  () => api.get('/api/reimbursements/summary'),
}

export default api
