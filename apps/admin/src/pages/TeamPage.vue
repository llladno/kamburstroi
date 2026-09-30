<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useCrudResource } from '../composables/useCrudResource';
import { useToast } from '../composables/useToast';
import { ApiError } from '../lib/api';
import OrderableList from '../components/OrderableList.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import ImageUploader from '../components/ImageUploader.vue';
import type { CreateTeamMemberPayload, TeamMember, UpdateTeamMemberPayload } from '../types/api';

const { items, fetchAll, create, update, remove, reorder } =
  useCrudResource<TeamMember, CreateTeamMemberPayload, UpdateTeamMemberPayload>('/team');
const { push } = useToast();

const form = reactive({ name: '', role: '', photoUrl: '' });
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);

onMounted(fetchAll);

function startEdit(member: TeamMember) {
  editingId.value = member.id;
  form.name = member.name;
  form.role = member.role;
  form.photoUrl = member.photoUrl ?? '';
}

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.role = '';
  form.photoUrl = '';
}

async function onSubmit() {
  const payload = { name: form.name, role: form.role, photoUrl: form.photoUrl || undefined };
  try {
    if (editingId.value) {
      await update(editingId.value, payload);
    } else {
      await create(payload);
    }
    resetForm();
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось сохранить сотрудника');
  }
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await remove(pendingDeleteId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить сотрудника');
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
    <h1 class="text-2xl font-semibold text-text">Команда</h1>

    <form class="mt-6 max-w-lg rounded-card bg-card p-4" @submit.prevent="onSubmit">
      <input
        v-model="form.name"
        placeholder="Имя"
        required
        class="w-full rounded-control border border-border px-3 py-2"
      />
      <input
        v-model="form.role"
        placeholder="Должность"
        required
        class="mt-2 w-full rounded-control border border-border px-3 py-2"
      />
      <div class="mt-2 flex items-center gap-3">
        <img v-if="form.photoUrl" :src="form.photoUrl" class="h-12 w-12 rounded-full object-cover" />
        <ImageUploader @uploaded="(url) => (form.photoUrl = url)" />
      </div>
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
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img
              v-if="item.photoUrl"
              :src="item.photoUrl"
              class="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <div class="font-medium text-text">{{ item.name }}</div>
              <div class="text-sm text-text-secondary">{{ item.role }}</div>
            </div>
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
      title="Удалить сотрудника?"
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
