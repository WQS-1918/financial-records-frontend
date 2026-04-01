<template>
  <div class="page">
    <div class="page-header">
      <h2 class="page-title">发票管理</h2>
      <button class="btn btn-primary" @click="openUpload()">+ 上传发票</button>
    </div>

    <!-- Filter -->
    <div class="filter-bar">
      <select v-model="filters.status" class="select" @change="fetchInvoices">
        <option value="">状态（全部）</option>
        <option value="pending">待处理</option>
        <option value="linked">已关联</option>
        <option value="approved">已审批</option>
        <option value="voided">已作废</option>
      </select>
      <input v-model="filters.title" class="input" placeholder="搜索抬头..." @keyup.enter="fetchInvoices" style="max-width:200px" />
      <button class="btn btn-secondary btn-sm" @click="fetchInvoices">搜索</button>
    </div>

    <!-- Table -->
    <div class="card">
      <div v-if="loading" class="empty-state"><div class="spinner spinner-dark"></div></div>
      <div v-else-if="!invoices.length" class="empty-state">
        <div class="empty-state-icon">🧾</div>
        <div class="empty-state-text">暂无发票记录</div>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>发票号</th><th>金额</th><th>抬头</th><th>类型</th><th>开票日期</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in invoices" :key="inv.id">
              <td>{{ inv.invoice_number }}</td>
              <td class="amount-expense">¥{{ formatNum(inv.amount) }}</td>
              <td>{{ inv.issuer }}</td>
              <td>{{ inv.invoice_type }}</td>
              <td>{{ inv.issue_date }}</td>
              <td><span :class="statusBadge(inv.status)">{{ statusLabel(inv.status) }}</span></td>
              <td>
                <button class="btn btn-secondary btn-sm" @click="viewDetail(inv)">详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUpload" class="modal-overlay" @click.self="showUpload = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">上传发票</h3>
          <button class="modal-close" @click="showUpload = false">×</button>
        </div>
        <form class="modal-body" @submit.prevent="handleUpload">
          <div class="upload-zone" :class="{ 'drag-over': dragOver }" @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop.prevent="handleDrop">
            <input type="file" ref="fileInput" accept="image/*,.pdf" style="display:none" @change="handleFileChange" />
            <div v-if="!form.file" class="upload-placeholder" @click="fileInput.click()">
              <div style="font-size:32px">📤</div>
              <div>点击或拖拽上传发票图片</div>
              <div style="font-size:12px;color:var(--color-text-secondary)">支持 JPG/PNG/PDF</div>
            </div>
            <div v-else class="file-selected" @click="fileInput.click()">
              <div>📄 {{ form.file.name }}</div>
              <div style="font-size:12px;color:var(--color-text-secondary)">点击更换</div>
            </div>
          </div>
          <div class="input-group">
            <label class="input-label">发票号</label>
            <input v-model="form.invoice_number" class="input" placeholder="FP20260401" required />
          </div>
          <div class="input-group">
            <label class="input-label">发票类型</label>
            <select v-model="form.invoice_type" class="select" required>
              <option value="">选择类型</option>
              <option value="增值税专用发票">增值税专用发票</option>
              <option value="增值税普通发票">增值税普通发票</option>
              <option value="电子发票">电子发票</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">金额</label>
            <div style="position:relative">
              <input v-model.number="form.amount" type="number" step="0.01" class="input" style="padding-right:40px" placeholder="0.00" required />
              <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--color-text-secondary)">元</span>
            </div>
          </div>
          <div class="input-group">
            <label class="input-label">发票抬头</label>
            <input v-model="form.issuer" class="input" placeholder="公司名称" required />
          </div>
          <div class="input-group">
            <label class="input-label">开票日期</label>
            <input v-model="form.issue_date" type="date" class="input" required />
          </div>
          <span v-if="formError" class="input-error">{{ formError }}</span>
          <div class="modal-footer" style="padding:0;border:none">
            <button type="button" class="btn btn-secondary" @click="showUpload = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner"></span>
              <span v-else>保存</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetail" class="modal-overlay" @click.self="showDetail = false">
      <div class="modal" style="width:560px">
        <div class="modal-header">
          <h3 class="modal-title">发票详情</h3>
          <button class="modal-close" @click="showDetail = false">×</button>
        </div>
        <div class="modal-body" v-if="detail">
          <div class="detail-img-wrap" v-if="detail.file_path">
            <img :src="detail.file_path" alt="发票图片" style="max-width:100%;border-radius:8px" />
          </div>
          <div class="detail-grid">
            <div><span class="detail-label">发票号</span><span>{{ detail.invoice_number }}</span></div>
            <div><span class="detail-label">类型</span><span>{{ detail.invoice_type }}</span></div>
            <div><span class="detail-label">金额</span><span class="amount-expense">¥{{ formatNum(detail.amount) }}</span></div>
            <div><span class="detail-label">税额</span><span>¥{{ formatNum(detail.tax_amount) }}</span></div>
            <div><span class="detail-label">抬头</span><span>{{ detail.issuer }}</span></div>
            <div><span class="detail-label">开票日期</span><span>{{ detail.issue_date }}</span></div>
            <div><span class="detail-label">状态</span><span :class="statusBadge(detail.status)">{{ statusLabel(detail.status) }}</span></div>
          </div>
          <div v-if="detail.status !== 'voided'" class="detail-actions">
            <button class="btn btn-danger btn-sm" @click="handleVoid(detail.id)">作废</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { invoicesAPI } from '../api'

const invoices = ref([])
const loading = ref(false)
const showUpload = ref(false)
const showDetail = ref(false)
const detail = ref(null)
const submitting = ref(false)
const formError = ref('')
const dragOver = ref(false)
const fileInput = ref(null)
const filters = ref({ status: '', title: '' })

const form = ref({ invoice_number: '', invoice_type: '', amount: '', issuer: '', issue_date: '', file: null })

const formatNum = (n) => Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })

const statusBadge = (s) => {
  const map = { 'pending': 'badge badge-pending', 'linked': 'badge badge-linked', 'approved': 'badge badge-approved', 'voided': 'badge badge-rejected' }
  return map[s] || 'badge badge-draft'
}
const statusLabel = (s) => {
  const map = { 'pending': '待处理', 'linked': '已关联', 'approved': '已审批', 'voided': '已作废' }
  return map[s] || s || '待处理'
}

const handleFileChange = (e) => { form.value.file = e.target.files[0] }
const handleDrop = (e) => { dragOver.value = false; form.value.file = e.dataTransfer.files[0] }

const openUpload = () => {
  formError.value = ''
  form.value = { invoice_number: '', invoice_type: '', amount: '', issuer: '', issue_date: new Date().toISOString().slice(0, 10), file: null }
  showUpload.value = true
}

const handleUpload = async () => {
  submitting.value = true
  formError.value = ''
  try {
    const fd = new FormData()
    fd.append('invoice_number', form.value.invoice_number)
    fd.append('invoice_type', form.value.invoice_type)
    fd.append('amount', form.value.amount)
    fd.append('issuer', form.value.issuer)
    fd.append('issue_date', form.value.issue_date)
    if (form.value.file) fd.append('file', form.value.file)
    await invoicesAPI.create(fd)
    showUpload.value = false
    fetchInvoices()
  } catch (e) {
    formError.value = e.message
  } finally {
    submitting.value = false
  }
}

const viewDetail = async (inv) => {
  detail.value = inv
  showDetail.value = true
}

const handleVoid = async (id) => {
  if (!confirm('确认作废此发票？')) return
  try {
    await invoicesAPI.update(id, { status: 'voided' })
    showDetail.value = false
    fetchInvoices()
  } catch (e) { alert(e.message) }
}

const fetchInvoices = async () => {
  loading.value = true
  try {
    const res = await invoicesAPI.list(filters.value)
    invoices.value = Array.isArray(res) ? res : (res.list || res.data || [])
  } catch { invoices.value = [] }
  loading.value = false
}

onMounted(fetchInvoices)
</script>

<style scoped>
.upload-zone { border: 2px dashed var(--color-border); border-radius: var(--radius); padding: 32px; text-align: center; cursor: pointer; transition: border-color 0.2s; }
.upload-zone.drag-over { border-color: var(--color-primary); }
.upload-placeholder { color: var(--color-text-secondary); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.file-selected { color: var(--color-primary); display: flex; flex-direction: column; gap: 4px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 2px; }
.detail-img-wrap { margin-bottom: 16px; background: #F8FAFC; border-radius: 8px; padding: 12px; }
.detail-actions { margin-top: 16px; border-top: 1px solid var(--color-border); padding-top: 16px; }
</style>
