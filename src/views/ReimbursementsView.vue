<template>
  <div class="page">
    <div class="page-header">
      <h2 class="page-title">报销单</h2>
      <button class="btn btn-primary" @click="openForm()">+ 新建报销单</button>
    </div>

    <!-- Filter -->
    <div class="filter-bar">
      <select v-model="filters.status" class="select" @change="fetchReimbursements">
        <option value="">状态（全部）</option>
        <option value="pending">审批中</option>
        <option value="approved">已通过</option>
        <option value="paid">已付款</option>
        <option value="rejected">已驳回</option>
      </select>
      <input v-model="filters.applicant" class="input" placeholder="搜索申请人..." @keyup.enter="fetchReimbursements" style="max-width:200px" />
      <button class="btn btn-secondary btn-sm" @click="fetchReimbursements">搜索</button>
    </div>

    <!-- Table -->
    <div class="card">
      <div v-if="loading" class="empty-state"><div class="spinner spinner-dark"></div></div>
      <div v-else-if="!reimbursements.length" class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">暂无报销单</div>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>单号</th><th>申请人</th><th>部门</th><th>金额</th><th>事由</th><th>关联发票</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in reimbursements" :key="r.id">
              <td>#BX{{ String(r.id).padStart(6, '0') }}</td>
              <td>{{ r.applicant }}</td>
              <td>{{ r.department }}</td>
              <td class="amount-expense">¥{{ formatNum(r.amount) }}</td>
              <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.reason }}</td>
              <td>{{ (r.invoice_ids || []).length }}张</td>
              <td><span :class="statusBadge(r.status)">{{ statusLabel(r.status) }}</span></td>
              <td>
                <button v-if="r.status === 'pending'" class="btn btn-primary btn-sm" @click="openApprove(r)">审批</button>
                <button v-else class="btn btn-secondary btn-sm" @click="viewDetail(r)">详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal" style="width:540px">
        <div class="modal-header">
          <h3 class="modal-title">新建报销单</h3>
          <button class="modal-close" @click="showForm = false">×</button>
        </div>
        <form class="modal-body" @submit.prevent="handleSubmit">
          <div class="input-group">
            <label class="input-label">申请人</label>
            <input :value="currentUser" class="input" readonly />
          </div>
          <div class="input-group">
            <label class="input-label">部门</label>
            <input v-model="form.department" class="input" placeholder="如：销售部" required />
          </div>
          <div class="input-group">
            <label class="input-label">事由</label>
            <input v-model="form.reason" class="input" placeholder="请填写报销事由" maxlength="200" required />
          </div>
          <div class="input-group">
            <label class="input-label">关联发票</label>
            <div class="invoice-select">
              <div v-if="selectedInvoices.length" class="selected-invoices">
                <div v-for="inv in selectedInvoices" :key="inv.id" class="selected-inv-item">
                  <span>☑ {{ inv.invoice_number }} ¥{{ formatNum(inv.amount) }} {{ inv.issuer }}</span>
                  <button type="button" @click="toggleInvoice(inv)" style="background:none;border:none;cursor:pointer;color:var(--color-expense)">×</button>
                </div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" @click="showInvoicePicker = !showInvoicePicker">
                {{ selectedInvoices.length ? '已选 ' + selectedInvoices.length + ' 张' : '+ 选择发票' }}
              </button>
              <div v-if="showInvoicePicker" class="invoice-picker">
                <div v-for="inv in availableInvoices" :key="inv.id" class="invoice-pick-item" @click="toggleInvoice(inv)">
                  <span :class="{ selected: selectedIds.has(inv.id) }">☑</span>
                  {{ inv.invoice_number }} ¥{{ formatNum(inv.amount) }} {{ inv.issuer }}
                </div>
              </div>
            </div>
          </div>
          <div class="input-group">
            <label class="input-label">总金额</label>
            <div class="total-amount">¥{{ formatNum(totalAmount) }}（自动汇总）</div>
          </div>
          <span v-if="formError" class="input-error">{{ formError }}</span>
          <div class="modal-footer" style="padding:0;border:none">
            <button type="button" class="btn btn-secondary" @click="showForm = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner"></span>
              <span v-else>提交审批</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Approve Modal -->
    <div v-if="showApprove" class="modal-overlay" @click.self="showApprove = false">
      <div class="modal" style="width:440px">
        <div class="modal-header">
          <h3 class="modal-title">审批报销单 #BX{{ String(approveTarget?.id || '').padStart(6, '0') }}</h3>
          <button class="modal-close" @click="showApprove = false">×</button>
        </div>
        <div class="modal-body" v-if="approveTarget">
          <div class="detail-grid">
            <div><span class="detail-label">申请人</span><span>{{ approveTarget.applicant }}</span></div>
            <div><span class="detail-label">部门</span><span>{{ approveTarget.department }}</span></div>
            <div><span class="detail-label">金额</span><span class="amount-expense">¥{{ formatNum(approveTarget.amount) }}</span></div>
            <div><span class="detail-label">事由</span><span>{{ approveTarget.reason }}</span></div>
            <div><span class="detail-label">关联发票</span><span>{{ (approveTarget.invoice_ids || []).length }}张</span></div>
          </div>
          <div v-if="rejectMode" class="input-group" style="margin-top:12px">
            <label class="input-label">驳回原因</label>
            <textarea v-model="rejectNote" class="input" rows="2" placeholder="请填写驳回原因"></textarea>
          </div>
          <span v-if="formError" class="input-error">{{ formError }}</span>
          <div class="approve-actions">
            <button class="btn btn-primary" @click="handleApprove" :disabled="acting">
              <span v-if="acting" class="spinner"></span>通过
            </button>
            <button v-if="!rejectMode" class="btn btn-danger" @click="rejectMode = true">驳回</button>
            <template v-else>
              <button class="btn btn-danger" @click="handleReject" :disabled="acting">确认驳回</button>
              <button class="btn btn-secondary" @click="rejectMode = false">取消</button>
            </template>
            <button class="btn btn-secondary" @click="showApprove = false">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { reimbursementsAPI, invoicesAPI } from '../api'

const reimbursements = ref([])
const invoices = ref([])
const loading = ref(false)
const showForm = ref(false)
const showApprove = ref(false)
const showInvoicePicker = ref(false)
const submitting = ref(false)
const acting = ref(false)
const formError = ref('')
const approveTarget = ref(null)
const rejectMode = ref(false)
const rejectNote = ref('')
const currentUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : '张三'
const filters = ref({ status: '', applicant: '' })

const form = ref({ applicant: currentUser, department: '', reason: '', expense_date: '', invoice_ids: [] })
const selectedInvoices = ref([])
const selectedIds = computed(() => new Set(selectedInvoices.value.map(i => i.id)))
const availableInvoices = computed(() => invoices.value.filter(i => i.status === 'pending'))

const totalAmount = computed(() => selectedInvoices.value.reduce((s, i) => s + Number(i.amount || 0), 0))

const formatNum = (n) => Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })

const statusBadge = (s) => {
  const map = { 'pending': 'badge badge-processing', 'approved': 'badge badge-approved', 'paid': 'badge badge-paid', 'rejected': 'badge badge-rejected', 'draft': 'badge badge-draft' }
  return map[s] || 'badge badge-draft'
}
const statusLabel = (s) => {
  const map = { 'pending': '审批中', 'approved': '已通过', 'paid': '已付款', 'rejected': '已驳回', 'draft': '草稿' }
  return map[s] || s || '草稿'
}

const toggleInvoice = (inv) => {
  const idx = selectedInvoices.value.findIndex(i => i.id === inv.id)
  if (idx >= 0) selectedInvoices.value.splice(idx, 1)
  else selectedInvoices.value.push(inv)
}

const openForm = () => {
  formError.value = ''
  rejectMode.value = false
  form.value = { applicant: currentUser, department: '', reason: '', expense_date: new Date().toISOString().slice(0, 10), invoice_ids: [] }
  selectedInvoices.value = []
  showForm.value = true
}

const openApprove = (r) => {
  rejectMode.value = false
  rejectNote.value = ''
  approveTarget.value = r
  formError.value = ''
  showApprove.value = true
}

const viewDetail = (r) => { approveTarget.value = r; showApprove.value = true }

const handleSubmit = async () => {
  if (!form.value.department) { formError.value = '请填写部门'; return }
  if (!form.value.reason) { formError.value = '请填写事由'; return }
  submitting.value = true
  formError.value = ''
  try {
    await reimbursementsAPI.create({
      applicant: currentUser,
      department: form.value.department,
      reason: form.value.reason,
      expense_date: form.value.expense_date || new Date().toISOString().slice(0, 10),
      amount: totalAmount.value,
      invoice_ids: selectedInvoices.value.map(i => i.id),
    })
    showForm.value = false
    fetchReimbursements()
  } catch (e) { formError.value = e.message }
  finally { submitting.value = false }
}

const handleApprove = async () => {
  acting.value = true
  formError.value = ''
  try {
    await reimbursementsAPI.approve(approveTarget.value.id, currentUser + '主管')
    showApprove.value = false
    fetchReimbursements()
  } catch (e) { formError.value = e.message }
  finally { acting.value = false }
}

const handleReject = async () => {
  if (!rejectNote.value.trim()) { formError.value = '请填写驳回原因'; return }
  acting.value = true
  try {
    await reimbursementsAPI.reject(approveTarget.value.id, rejectNote.value)
    showApprove.value = false
    fetchReimbursements()
  } catch (e) { formError.value = e.message }
  finally { acting.value = false }
}

const fetchReimbursements = async () => {
  loading.value = true
  try {
    const res = await reimbursementsAPI.list(filters.value)
    reimbursements.value = Array.isArray(res) ? res : (res.list || res.data || [])
  } catch { reimbursements.value = [] }
  loading.value = false
}

onMounted(async () => {
  fetchReimbursements()
  try {
    const res = await invoicesAPI.list()
    invoices.value = Array.isArray(res) ? res : (res.list || res.data || [])
  } catch {}
})
</script>

<style scoped>
.invoice-select { display: flex; flex-direction: column; gap: 8px; }
.selected-invoices { display: flex; flex-direction: column; gap: 4px; }
.selected-inv-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: #F8FAFC; border-radius: 4px; font-size: 13px; }
.invoice-picker { border: 1px solid var(--color-border); border-radius: var(--radius); padding: 8px; max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.invoice-pick-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; cursor: pointer; font-size: 13px; border-radius: 4px; }
.invoice-pick-item:hover { background: #F8FAFC; }
.invoice-pick-item span { font-size: 14px; }
.invoice-pick-item span.selected { color: var(--color-primary); }
.total-amount { font-size: 18px; font-weight: 600; color: var(--color-expense); padding: 8px 0; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 2px; }
.approve-actions { display: flex; gap: 12px; margin-top: 16px; border-top: 1px solid var(--color-border); padding-top: 16px; flex-wrap: wrap; }
</style>
