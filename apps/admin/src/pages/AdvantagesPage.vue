<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useCrudResource } from '../composables/useCrudResource';
import { useToast } from '../composables/useToast';
import { ApiError } from '../lib/api';
import OrderableList from '../components/OrderableList.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { Advantage, CreateAdvantagePayload, UpdateAdvantagePayload } from '../types/api';

const { items, fetchAll, create, update, remove, reorder } =
  useCrudResource<Advantage, CreateAdvantagePayload, UpdateAdvantagePayload>('/advantages');
const { push } = useToast();

const form = reactive({ title: '', description: '' });
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);

onMounted(fetchAll);

function startEdit(advantage: Advantage) {
  editingId.value = advantage.id;
  form.title = advantage.title;
  form.description = advantage.description;
}

function resetForm() {
  editingId.value = null;
  form.title = '';
  form.description = '';
}

async function onSubmit() {
  try {
    if (editingId.value) {
      await update(editingId.value, { ...form });
    } else {
      await create({ ...form });
    }
    resetForm();
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось сохранить преимущество');
  }
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await remove(pendingDeleteId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить преимущество');
  } finally {
    pendingDeleteId.value = null;
  }
}

async function onReorder(ids: string[]) {
  try {
    await reorder(ids);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось изменить порядок');
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-text">Преимущества</h1>

    <form class="mt-6 max-w-lg rounded-card bg-card p-4" @submit.prevent="onSubmit">
      <input
        v-model="form.title"
        placeholder="Название"
        required
        class="w-full rounded-control border border-border px-3 py-2"
      />
      <textarea
        v-model="form.description"
        placeholder="Описание"
        required
        rows="3"
        class="mt-2 w-full rounded-control border border-border px-3 py-2"
      />
      <div class="mt-2 flex gap-2">
        <button type="submit" class="rounded-control bg-primary px-4 py-2 text-sm text-primary-text">
          {{ editingId ? 'Сохранить' : 'Добавить' }}
        </button>
        <button v-if="editingId" type="button" class="text-sm text-text-secondary" @click="resetForm">
          Отмена
        </button>
      </div>
    </form>

    <OrderableList :items="items" class="mt-6 max-w-lg" @reorder="onReorder">
      <template #default="{ item }">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-medium text-text">{{ item.title }}</div>
            <div class="text-sm text-text-secondary">{{ item.description }}</div>
          </div>
          <div class="flex shrink-0 gap-2 text-sm">
            <button class="text-text-secondary" @click="startEdit(item)">Изменить</button>
            <button class="text-danger" @click="pendingDeleteId = item.id">Удалить</button>
          </div>
        </div>
      </template>
    </OrderableList>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="Удалить преимущество?"
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
