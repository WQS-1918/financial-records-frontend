import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import RecordsView from '../views/RecordsView.vue'
import InvoicesView from '../views/InvoicesView.vue'
import ReimbursementsView from '../views/ReimbursementsView.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/dashboard', name: 'Dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/records', name: 'Records', component: RecordsView, meta: { requiresAuth: true } },
  { path: '/invoices', name: 'Invoices', component: InvoicesView, meta: { requiresAuth: true } },
  { path: '/reimbursements', name: 'Reimbursements', component: ReimbursementsView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
