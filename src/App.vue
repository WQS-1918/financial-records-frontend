<template>
  <div id="app">
    <nav v-if="isAuth" class="navbar">
      <div class="navbar-brand">财务系统 v2</div>
      <ul class="navbar-nav">
        <li><router-link to="/dashboard">仪表盘</router-link></li>
        <li><router-link to="/records">收支记录</router-link></li>
        <li><router-link to="/invoices">发票管理</router-link></li>
        <li><router-link to="/reimbursements">报销单</router-link></li>
      </ul>
      <button class="btn btn-secondary btn-sm" @click="logout">退出</button>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isAuth = computed(() => route.path !== '/login')

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>
