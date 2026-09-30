<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { ApiError } from '../lib/api';

const login = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);
const { login: doLogin } = useAuth();
const router = useRouter();

async function onSubmit() {
  submitting.value = true;
  error.value = '';
  try {
    await doLogin(login.value, password.value);
    await router.push('/');
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не удалось войти';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface px-4">
    <form class="w-full max-w-sm rounded-card bg-bg p-8 shadow-lg" @submit.prevent="onSubmit">
      <h1 class="text-xl font-semibold text-text">Kambyrstroi — вход</h1>
      <label class="mt-6 block text-sm text-text-secondary">
        Логин
        <input
          v-model="login"
          type="text"
          required
          class="mt-1 w-full rounded-control border border-border px-3 py-2 text-text"
        />
      </label>
      <label class="mt-4 block text-sm text-text-secondary">
        Пароль
        <input
          v-model="password"
          type="password"
          required
          class="mt-1 w-full rounded-control border border-border px-3 py-2 text-text"
        />
      </label>
      <p v-if="error" class="mt-3 text-sm text-danger">{{ error }}</p>
      <button
        type="submit"
        :disabled="submitting"
        class="mt-6 w-full rounded-control bg-primary py-2 text-sm text-primary-text disabled:opacity-50"
      >
        {{ submitting ? 'Вход…' : 'Войти' }}
      </button>
    </form>
  </div>
</template>
