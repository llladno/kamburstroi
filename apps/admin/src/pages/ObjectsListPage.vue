<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';
import OrderableList from '../components/OrderableList.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { ObjectItem } from '../types/api';

const objects = ref<ObjectItem[]>([]);
const pendingDeleteId = ref<string | null>(null);
const { push } = useToast();

async function load() {
  objects.value = await api.get<ObjectItem[]>('/admin/objects');
}

onMounted(load);

async function onReorder(ids: string[]) {
  try {
    objects.value = await api.patch<ObjectItem[]>('/admin/objects/reorder', { ids });
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось изменить порядок');
  }
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await api.delete(`/admin/objects/${pendingDeleteId.value}`);
    objects.value = objects.value.filter((o) => o.id !== pendingDeleteId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить объект');
  } finally {
    pendingDeleteId.value = null;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-text">Объекты</h1>
      <router-link to="/objects/new" class="rounded-control bg-primary px-4 py-2 text-sm text-primary-text">
        Добавить объект
      </router-link>
    </div>

    <OrderableList :items="objects" class="mt-6 max-w-2xl" @reorder="onReorder">
      <template #default="{ item }">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img
              v-if="item.images[0]"
              :src="item.images[0].url"
              class="h-12 w-16 rounded object-cover"
            />
            <div>
              <div class="font-medium text-text">{{ item.title }}</div>
              <div class="text-sm text-text-secondary">
                {{ item.workType }} · {{ item.year }}
                <span v-if="!item.isPublished" class="text-danger">· черновик</span>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 gap-2 text-sm">
            <router-link :to="`/objects/${item.id}`" class="text-text-secondary">Изменить</router-link>
            <button class="text-danger" @click="pendingDeleteId = item.id">Удалить</button>
          </div>
        </div>
      </template>
    </OrderableList>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="Удалить объект?"
      message="Фото объекта тоже будут удалены."
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
