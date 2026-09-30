<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';
import type { SiteSettings } from '../types/api';

const form = reactive<Omit<SiteSettings, 'updatedAt'>>({
  heroTitle: '',
  heroSubtitle: '',
  aboutText: '',
  yearsOfExperience: 0,
  completedObjectsCount: 0,
  warrantyMonths: 0,
  phone: '',
  email: '',
  workHours: '',
  vkUrl: '',
});
const saving = ref(false);
const { push } = useToast();

async function load() {
  const settings = await api.get<SiteSettings>('/settings');
  Object.assign(form, settings);
}

onMounted(load);

async function onSubmit() {
  saving.value = true;
  try {
    const updated = await api.patch<SiteSettings>('/admin/settings', { ...form });
    Object.assign(form, updated);
    push('Настройки сохранены', 'success');
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось сохранить настройки');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form class="max-w-xl" @submit.prevent="onSubmit">
    <h1 class="text-2xl font-semibold text-text">Настройки сайта</h1>

    <fieldset class="mt-6 flex flex-col gap-3 rounded-card bg-card p-4">
      <legend class="text-sm font-medium text-text-secondary">Главный экран</legend>
      <input v-model="form.heroTitle" placeholder="Заголовок хиро" class="rounded-control border border-border px-3 py-2" />
      <textarea v-model="form.heroSubtitle" placeholder="Подзаголовок хиро" rows="2" class="rounded-control border border-border px-3 py-2" />
    </fieldset>

    <fieldset class="mt-4 flex flex-col gap-3 rounded-card bg-card p-4">
      <legend class="text-sm font-medium text-text-secondary">О компании</legend>
      <textarea v-model="form.aboutText" placeholder="Текст о компании" rows="4" class="rounded-control border border-border px-3 py-2" />
      <div class="grid grid-cols-3 gap-3">
        <label class="text-sm text-text-secondary">
          Лет опыта
          <input v-model.number="form.yearsOfExperience" type="number" min="0" class="mt-1 w-full rounded-control border border-border px-3 py-2" />
        </label>
        <label class="text-sm text-text-secondary">
          Объектов сдано
          <input v-model.number="form.completedObjectsCount" type="number" min="0" class="mt-1 w-full rounded-control border border-border px-3 py-2" />
        </label>
        <label class="text-sm text-text-secondary">
          Гарантия, мес.
          <input v-model.number="form.warrantyMonths" type="number" min="0" class="mt-1 w-full rounded-control border border-border px-3 py-2" />
        </label>
      </div>
    </fieldset>

    <fieldset class="mt-4 flex flex-col gap-3 rounded-card bg-card p-4">
      <legend class="text-sm font-medium text-text-secondary">Контакты</legend>
      <input v-model="form.phone" placeholder="Телефон" class="rounded-control border border-border px-3 py-2" />
      <input v-model="form.email" placeholder="E-mail" class="rounded-control border border-border px-3 py-2" />
      <input v-model="form.workHours" placeholder="Режим работы" class="rounded-control border border-border px-3 py-2" />
      <input v-model="form.vkUrl" placeholder="Ссылка на ВК" class="rounded-control border border-border px-3 py-2" />
    </fieldset>

    <button
      type="submit"
      :disabled="saving"
      class="mt-4 rounded-control bg-primary px-4 py-2 text-sm text-primary-text disabled:opacity-50"
    >
      {{ saving ? 'Сохранение…' : 'Сохранить' }}
    </button>
  </form>
</template>
