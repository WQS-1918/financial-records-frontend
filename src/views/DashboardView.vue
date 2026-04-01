<template>
  <div class="page">
    <!-- Quick Actions -->
    <div class="quick-actions-bar">
      <button class="btn btn-primary" @click="$router.push('/records')">+ 录收支</button>
      <button class="btn btn-secondary" @click="$router.push('/invoices')">+ 上传发票</button>
      <button class="btn btn-secondary" @click="$router.push('/reimbursements')">+ 新建报销单</button>
    </div>

    <!-- Stats Cards -->
    <div v-if="loading" class="loading-mask"><div class="spinner spinner-dark"></div></div>
    <div v-else class="stats-grid">
      <div class="stat-card card">
        <div class="stat-label">本月收入</div>
        <div class="stat-value amount-income">¥{{ formatNum(stats.total_income) }}</div>
        <div class="stat-change income-up" v-if="stats.incomeChange">↑ {{ stats.incomeChange }}%</div>
      </div>
      <div class="stat-card card">
        <div class="stat-label">本月支出</div>
        <div class="stat-value amount-expense">¥{{ formatNum(stats.total_expense) }}</div>
        <div class="stat-change expense-down" v-if="stats.expenseChange">↓ {{ stats.expenseChange }}%</div>
      </div>
      <div class="stat-card card">
        <div class="stat-label">结余</div>
        <div class="stat-value" :class="stats.net_balance >= 0 ? 'amount-income' : 'amount-expense'">
          ¥{{ formatNum(stats.net_balance) }}
        </div>
      </div>
      <div class="stat-card card" style="cursor:pointer" @click="$router.push('/reimbursements')">
        <div class="stat-label">待处理报销</div>
        <div class="stat-value">{{ reimbSummary.pendingCount || 0 }}笔</div>
        <div class="stat-link">› 查看全部</div>
      </div>
    </div>

    <!-- Trend Chart Area -->
    <div class="card trend-card">
      <h3 class="section-title">近6个月收支趋势</h3>
      <div class="trend-placeholder">
        <div v-if="trendLoading" class="loading-inline"><div class="spinner spinner-dark"></div></div>
        <div v-else-if="trendData.length" class="trend-bars">
          <div v-for="(item, i) in trendData" :key="i" class="trend-bar-group">
            <div class="trend-bar-wrap">
              <div class="trend-bar income-bar" :style="{ height: (item.income / maxTrend * 100) + '%' }"></div>
              <div class="trend-bar expense-bar" :style="{ height: (item.expense / maxTrend * 100) + '%' }"></div>
            </div>
            <div class="trend-label">{{ item.year_month }}</div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-text">暂无趋势数据</div>
        </div>
      </div>
    </div>

    <!-- Bottom Two Cols -->
    <div class="bottom-grid">
      <!-- Pending Reimbursements -->
      <div class="card">
        <h3 class="section-title">待处理报销单</h3>
        <div v-if="pendingList.length" class="mini-list">
          <div v-for="item in pendingList" :key="item.id" class="mini-item" @click="$router.push('/reimbursements')">
            <span>{{ item.id }}</span>
            <span>{{ item.applicant }}</span>
            <span class="amount-expense">¥{{ formatNum(item.amount) }}</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">暂无待处理报销单</div>
        </div>
        <div v-if="pendingList.length" class="view-more" @click="$router.push('/reimbursements')">› 查看全部</div>
      </div>

      <!-- Recent Records -->
      <div class="card">
        <h3 class="section-title">最近收支记录</h3>
        <div v-if="recentRecords.length" class="mini-list">
          <div v-for="item in recentRecords" :key="item.id" class="mini-item" @click="$router.push('/records')">
            <span :class="item.type === 'income' ? 'amount-income' : 'amount-expense'">
              {{ item.type === 'income' ? '+' : '-' }}¥{{ formatNum(item.amount) }}
            </span>
            <span class="record-sub">{{ item.category }} · {{ item.record_date }}</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-state-icon">💰</div>
          <div class="empty-state-text">暂无收支记录</div>
        </div>
        <div v-if="recentRecords.length" class="view-more" @click="$router.push('/records')">› 查看全部</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { recordsAPI, reimbursementsAPI } from '../api'

const loading = ref(false)
const trendLoading = ref(false)
const stats = ref({ total_income: 0, total_expense: 0, net_balance: 0 })
const trendData = ref([])
const pendingList = ref([])
const recentRecords = ref([])
const reimbSummary = ref({})

const maxTrend = computed(() => {
  const max = Math.max(...trendData.value.map(d => Math.max(d.income || 0, d.expense || 0)), 1)
  return max
})

const formatNum = (n) => Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })

onMounted(async () => {
  loading.value = true
  trendLoading.value = true

  // fin 确认的新端点
  const [summary, monthly] = await Promise.all([
    recordsAPI.summary().catch(() => ({ total_income: 0, total_expense: 0, net_balance: 0 })),
    recordsAPI.monthly().catch(() => []),
  ])
  stats.value = summary
  trendData.value = Array.isArray(monthly) ? monthly : []
  trendLoading.value = false

  const [reimbRes, recRes, reimbSum] = await Promise.all([
    reimbursementsAPI.list({ status: '审批中', limit: 3 }).catch(() => []),
    recordsAPI.list({ limit: 5 }).catch(() => []),
    reimbursementsAPI.summary().catch(() => ({})),
  ])
  pendingList.value = reimbRes?.list || reimbRes?.data || reimbRes || []
  recentRecords.value = recRes?.list || recRes?.data || recRes || []
  reimbSummary.value = reimbSum

  loading.value = false
})
</script>

<style scoped>
.quick-actions-bar { display: flex; gap: 12px; margin-bottom: 24px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
@media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
.stat-card { padding: 20px; }
.stat-label { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 700; color: var(--color-text); }
.stat-change { font-size: 12px; margin-top: 4px; }
.income-up { color: var(--color-income); }
.expense-down { color: var(--color-expense); }
.stat-link { font-size: 12px; color: var(--color-text-secondary); margin-top: 4px; }
.section-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.trend-card { margin-bottom: 24px; }
.trend-placeholder { min-height: 160px; }
.trend-bars { display: flex; gap: 16px; align-items: flex-end; height: 160px; padding-top: 20px; }
.trend-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; }
.trend-bar-wrap { display: flex; gap: 4px; align-items: flex-end; height: 100%; width: 100%; justify-content: center; }
.trend-bar { width: 16px; min-height: 4px; border-radius: 4px 4px 0 0; }
.income-bar { background: var(--color-income); }
.expense-bar { background: var(--color-expense); }
.trend-label { font-size: 11px; color: var(--color-text-secondary); }
.loading-inline { display: flex; justify-content: center; padding-top: 60px; }
.bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 768px) { .bottom-grid { grid-template-columns: 1fr; } }
.mini-list { display: flex; flex-direction: column; gap: 10px; }
.mini-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--color-border); cursor: pointer; font-size: 13px; }
.mini-item:last-child { border-bottom: none; }
.record-sub { color: var(--color-text-secondary); font-size: 12px; }
.view-more { font-size: 12px; color: var(--color-text-secondary); cursor: pointer; margin-top: 8px; text-align: right; }
</style>
