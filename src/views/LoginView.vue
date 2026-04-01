<template>
  <div class="login-page">
    <div class="login-card card">
      <h1 class="login-title">财务系统 v2</h1>
      <p class="login-sub">请登录以继续</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="input-group">
          <label class="input-label">账号</label>
          <input
            v-model="form.username"
            type="text"
            class="input"
            :class="{ error: errors.username }"
            placeholder="请输入账号"
            autocomplete="username"
          />
          <span v-if="errors.username" class="input-error">{{ errors.username }}</span>
        </div>

        <div class="input-group">
          <label class="input-label">密码</label>
          <div class="password-wrap">
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              class="input"
              :class="{ error: errors.password }"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
            <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁' }}
            </button>
          </div>
          <span v-if="errors.password" class="input-error">{{ errors.password }}</span>
        </div>

        <span v-if="loginError" class="input-error login-error">{{ loginError }}</span>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>登录</span>
        </button>

        <p class="forgot-link"><a href="#">忘记密码？</a></p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI } from '../api'

const router = useRouter()
const form = ref({ username: '', password: '' })
const errors = ref({})
const loginError = ref('')
const loading = ref(false)
const showPwd = ref(false)

const handleLogin = async () => {
  errors.value = {}
  loginError.value = ''

  if (!form.value.username) { errors.value.username = '请输入账号'; return }
  if (!form.value.password) { errors.value.password = '请输入密码'; return }

  loading.value = true
  try {
    // fin 确认 auth 端点暂缺，前端 mock 登录态
    const res = await authAPI.mockLogin(form.value.username, form.value.password)
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    router.push('/dashboard')
  } catch (e) {
    loginError.value = e.message || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 24px;
}
.login-card { width: 400px; max-width: 100%; }
.login-title { font-size: 24px; font-weight: 700; color: var(--color-primary); text-align: center; margin-bottom: 8px; }
.login-sub { text-align: center; color: var(--color-text-secondary); margin-bottom: 32px; }
.login-form { display: flex; flex-direction: column; gap: 16px; }
.password-wrap { position: relative; }
.password-wrap .input { padding-right: 40px; width: 100%; }
.pwd-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; }
.login-error { text-align: center; }
.forgot-link { text-align: center; margin-top: 8px; }
.forgot-link a { color: var(--color-text-secondary); font-size: 13px; text-decoration: none; }
</style>
