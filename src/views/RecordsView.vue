<template>
  <div class="page">
    <div class="page-header">
      <h2 class="page-title">收支记录</h2>
      <button class="btn btn-primary" @click="openForm()">+ 录收支</button>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <select v-model="filters.type" class="select" @change="fetchRecords">
        <option value="">类型（全部）</option>
        <option value="收入">收入</option>
        <option value="支出">支出</option>
      </select>
      <select v-model="filters.category" class="select" @change="fetchRecords">
        <option value="">科目（全部）</option>
        <option v-for="s in categories" :key="s" :value="s">{{ s }}</option>
      </select>
      <input v-model="filters.dateFrom" type="date" class="input" @change="fetchRecords" />
      <span style="color:var(--color-text-secondary)">—</span>
      <input v-model="filters.dateTo" type="date" class="input" @change="fetchRecords" />
      <button class="btn btn-secondary btn-sm" @click="fetchRecords">搜索</button>
    </div>

    <!-- Table -->
    <div class="card">
      <div v-if="loading" class="empty-state"><div class="spinner spinner-dark"></div></div>
      <div v-else-if="!records.length" class="empty-state">
        <div class="empty-state-icon">💰</div>
        <div class="empty-state-text">暂无收支记录，开始录入第一笔</div>
      </div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>日期</th><th>类型</th><th>科目</th><th>金额</th><th>备注</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in records" :key="r.id">
              <td>{{ r.record_date }}</td>
              <td><span :class="r.type === 'income' ? 'badge badge-income' : 'badge badge-expense'">{{ r.type === 'income' ? '收入' : '支出' }}</span></td>
              <td>{{ r.category }}</td>
              <td :class="r.type === 'income' ? 'amount-income' : 'amount-expense'">
                {{ r.type === 'income' ? '+' : '-' }}¥{{ formatNum(r.amount) }}
              </td>
              <td style="color:var(--color-text-secondary);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ r.description || '-' }}</td>
              <td>
                <button class="btn btn-secondary btn-sm" @click="openForm(r)">编辑</button>
                <button class="btn btn-danger btn-sm" style="margin-left:6px" @click="handleDelete(r.id)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="page <= 1" @click="page--; fetchRecords()">←</button>
        <span>第 {{ page }}/{{ totalPages }} 页</span>
        <button :disabled="page >= totalPages" @click="page++; fetchRecords()">→</button>
      </div>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ editing ? '编辑' : '录收支' }}</h3>
          <button class="modal-close" @click="showForm = false">×</button>
        </div>
        <form class="modal-body" @submit.prevent="handleSubmit">
          <div class="input-group">
            <label class="input-label">类型</label>
            <div class="radio-group">
              <label class="radio-label"><input type="radio" v-model="form.type" value="income" /> 收入</label>
              <label class="radio-label"><input type="radio" v-model="form.type" value="expense" /> 支出</label>
            </div>
          </div>
          <div class="input-group">
            <label class="input-label">科目</label>
            <select v-model="form.category" class="select" required>
              <option value="">选择科目</option>
              <option v-for="s in categories" :key="s" :value="s">{{ s }}</option>
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
            <label class="input-label">日期</label>
            <input v-model="form.record_date" type="date" class="input" required />
          </div>
          <div class="input-group">
            <label class="input-label">备注</label>
            <textarea v-model="form.description" class="input" rows="3" maxlength="200" placeholder="选填，最多200字"></textarea>
          </div>
          <span v-if="formError" class="input-error">{{ formError }}</span>
          <div class="modal-footer" style="padding:0;border:none">
            <button type="button" class="btn btn-secondary" @click="showForm = false">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              <span v-if="submitting" class="spinner"></span>
              <span v-else>保存</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { recordsAPI } from '../api'

const categories = ['工资', '奖金', '办公', '差旅', '招待', '采购', '营销', '其他']
const records = ref([])
const loading = ref(false)
const showForm = ref(false)
const editing = ref(null)
const submitting = ref(false)
const formError = ref('')
const page = ref(1)
const totalPages = ref(1)
const filters = ref({ type: '', category: '', dateFrom: '', dateTo: '' })

const defaultForm = () => ({
  type: 'expense',
  category: '',
  amount: '',
  record_date: new Date().toISOString().slice(0, 10),
  description: '',
  created_by: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : '张三',
})
const form = ref(defaultForm())

const formatNum = (n) => Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })

const openForm = (record = null) => {
  formError.value = ''
  if (record) {
    editing.value = record.id
    form.value = {
      type: record.type,
      category: record.category,
      amount: record.amount,
      record_date: record.record_date,
      description: record.description || '',
      created_by: record.created_by,
    }
  } else {
    editing.value = null
    form.value = defaultForm()
  }
  showForm.value = true
}

const handleSubmit = async () => {
  if (!form.value.category) { formError.value = '请选择科目'; return }
  if (!form.value.amount) { formError.value = '请输入金额'; return }
  submitting.value = true
  formError.value = ''
  try {
    if (editing.value) {
      await recordsAPI.update(editing.value, form.value)
    } else {
      await recordsAPI.create(form.value)
    }
    showForm.value = false
    fetchRecords()
  } catch (e) {
    formError.value = e.message
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id) => {
  if (!confirm('确认删除？')) return
  try {
    await recordsAPI.delete(id)
    fetchRecords()
  } catch (e) {
    alert(e.message)
  }
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const params = { page: page.value, limit: 20, ...filters.value }
    const res = await recordsAPI.list(params)
    records.value = Array.isArray(res) ? res : (res.list || res.data || [])
    const total = parseInt(res.total || res.count || records.value.length)
    totalPages.value = Math.max(1, Math.ceil(total / 20))
  } catch {
    records.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchRecords)
</script>
