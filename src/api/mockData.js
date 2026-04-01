// Mock data — 财务系统演示数据
// 所有数据均为模拟，与真实业务无关

const now = new Date()
const fmt = (d) => d.toISOString().slice(0, 10)

const thisMonth = (offset = 0) => {
  const d = new Date(now.getFullYear(), now.getMonth() - offset, 15)
  return fmt(d)
}

const last6Months = () => {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }).reverse()
}

// ── Records ──────────────────────────────────────────────────────
export const mockRecords = [
  { id: 1, type: 'income',    category: '工资',      amount: 35000.00, record_date: thisMonth(0), description: '3月工资发放',           created_by: '张三' },
  { id: 2, type: 'income',    category: '奖金',      amount: 8000.00,  record_date: thisMonth(0), description: '季度绩效奖金',         created_by: '张三' },
  { id: 3, type: 'expense',   category: '差旅',      amount: 4200.50,  record_date: thisMonth(0), description: '北京出差机票+酒店',   created_by: '李四' },
  { id: 4, type: 'expense',   category: '办公',      amount: 1380.00,  record_date: thisMonth(0), description: '办公设备采购',        created_by: '王五' },
  { id: 5, type: 'expense',   category: '招待',      amount: 2560.00,  record_date: thisMonth(1), description: '客户招待晚餐',         created_by: '李四' },
  { id: 6, type: 'expense',   category: '采购',      amount: 15000.00, record_date: thisMonth(1), description: '服务器采购',           created_by: '王五' },
  { id: 7, type: 'income',    category: '其他',      amount: 3200.00,  record_date: thisMonth(1), description: '退款返还',             created_by: '张三' },
  { id: 8, type: 'expense',   category: '营销',      amount: 8800.00,  record_date: thisMonth(2), description: '线上推广费用',         created_by: '赵六' },
  { id: 9, type: 'expense',   category: '差旅',      amount: 3100.00,  record_date: thisMonth(2), description: '上海出差',             created_by: '李四' },
  { id: 10, type: 'income',   category: '工资',     amount: 35000.00, record_date: thisMonth(1), description: '2月工资发放',          created_by: '张三' },
  { id: 11, type: 'expense',  category: '办公',     amount: 2200.00,  record_date: thisMonth(2), description: '办公用品采购',         created_by: '王五' },
  { id: 12, type: 'income',   category: '奖金',     amount: 5000.00,  record_date: thisMonth(2), description: '1月绩效奖金',           created_by: '张三' },
]

export const mockRecordsSummary = {
  total_income:  83000.00,
  total_expense: 41240.50,
  net_balance:   41759.50,
  incomeChange:  8,
  expenseChange: -3,
}

export const mockMonthly = last6Months().map((ym) => ({
  year_month: ym,
  income:    Math.round(30000 + Math.random() * 20000),
  expense:   Math.round(10000 + Math.random() * 15000),
}))

// ── Invoices ─────────────────────────────────────────────────────
export const mockInvoices = [
  { id: 1,  invoice_number: 'FP202604001', invoice_type: '增值税普通发票', amount: 4200.50,  tax_amount: 420.05,  issuer: '北京飞翔航空服务有限公司', issue_date: thisMonth(0), status: 'approved', file_path: '' },
  { id: 2,  invoice_number: 'FP202604002', invoice_type: '增值税专用发票', amount: 1380.00,  tax_amount: 138.00,  issuer: '京东科技（深圳）有限公司',   issue_date: thisMonth(0), status: 'pending',  file_path: '' },
  { id: 3,  invoice_number: 'FP202603001', invoice_type: '电子发票',        amount: 2560.00,  tax_amount: 256.00,  issuer: '上海雅戈尔餐饮有限公司',   issue_date: thisMonth(1), status: 'linked',   file_path: '' },
  { id: 4,  invoice_number: 'FP202603002', invoice_type: '增值税普通发票', amount: 15000.00, tax_amount: 1500.00, issuer: '华为技术有限公司',           issue_date: thisMonth(1), status: 'approved', file_path: '' },
  { id: 5,  invoice_number: 'FP202603003', invoice_type: '电子发票',        amount: 8800.00,  tax_amount: 880.00,  issuer: '腾讯云计算（北京）有限责任公司', issue_date: thisMonth(2), status: 'pending',  file_path: '' },
  { id: 6,  invoice_number: 'FP202602001', invoice_type: '增值税普通发票', amount: 3100.00,  tax_amount: 310.00,  issuer: '上海东航国际旅行社',       issue_date: thisMonth(2), status: 'approved', file_path: '' },
  { id: 7,  invoice_number: 'FP202602002', invoice_type: '其他',            amount: 2200.00,  tax_amount: 0,        issuer: '得力集团有限公司',           issue_date: thisMonth(2), status: 'voided',   file_path: '' },
]

// ── Reimbursements ───────────────────────────────────────────────
export const mockReimbursements = [
  { id: 1,  applicant: '李四',   department: '销售部',   amount: 6760.50, reason: '3月北京客户拜访差旅费用',     invoice_ids: [1, 2], status: 'pending'  },
  { id: 2,  applicant: '王五',   department: '技术部',   amount: 17200.00, reason: '服务器及办公设备采购报销',     invoice_ids: [4],    status: 'approved' },
  { id: 3,  applicant: '赵六',   department: '市场部',   amount: 8800.00, reason: '线上推广渠道投放费用',         invoice_ids: [5],    status: 'pending'  },
  { id: 4,  applicant: '李四',   department: '销售部',   amount: 2560.00, reason: '2月客户招待晚餐',              invoice_ids: [3],    status: 'paid'     },
  { id: 5,  applicant: '王五',   department: '技术部',   amount: 3100.00, reason: '2月上海出差费用报销',          invoice_ids: [6],    status: 'paid'     },
  { id: 6,  applicant: '张三',   department: '财务部',   amount: 420.00,  reason: '办公用品采购',                 invoice_ids: [],    status: 'rejected' },
]

export const mockReimbSummary = {
  pendingCount: 2,
  approvedCount: 1,
  paidCount: 2,
  totalPending: 15560.50,
}
