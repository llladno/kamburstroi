<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';
import type { Lead } from '../types/api';

const leads = ref<Lead[]>([]);
const showProcessed = ref(false);
const { push } = useToast();

const visible = computed(() =>
  showProcessed.value ? leads.value : leads.value.filter((l) => !l.isProcessed),
);

async function load() {
  leads.value = await api.get<Lead[]>('/admin/leads');
}

onMounted(load);

async function toggleProcessed(lead: Lead) {
  try {
    const updated = await api.patch<Lead>(`/admin/leads/${lead.id}`, {
      isProcessed: !lead.isProcessed,
    });
    leads.value = leads.value.map((l) => (l.id === lead.id ? updated : l));
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось обновить заявку');
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-text">Заявки</h1>
      <label class="flex items-center gap-2 text-sm text-text-secondary">
        <input v-model="showProcessed" type="checkbox" /> Показать обработанные
      </label>
    </div>

    <div class="mt-4 flex flex-col gap-3">
      <div v-for="lead in visible" :key="lead.id" class="rounded-card bg-card p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-medium text-text">{{ lead.name }} · {{ lead.phone }}</div>
            <p v-if="lead.comment" class="mt-1 text-sm text-text-secondary">{{ lead.comment }}</p>
            <div class="mt-1 text-xs text-text-muted">
              {{ new Date(lead.createdAt).toLocaleString('ru-RU') }}
            </div>
          </div>
          <button
            class="shrink-0 rounded-control px-3 py-1 text-sm"
            :class="lead.isProcessed ? 'bg-surface text-text-secondary' : 'bg-primary text-primary-text'"
            @click="toggleProcessed(lead)"
          >
            {{ lead.isProcessed ? 'Обработана' : 'Отметить обработанной' }}
          </button>
        </div>
      </div>
      <p v-if="visible.length === 0" class="text-sm text-text-muted">Нет новых заявок.</p>
    </div>
  </div>
</template>
