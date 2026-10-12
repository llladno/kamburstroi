<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useCrudResource } from '../composables/useCrudResource';
import { useToast } from '../composables/useToast';
import { ApiError } from '../lib/api';
import ImageUploader from '../components/ImageUploader.vue';
import OrderableList from '../components/OrderableList.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { HeroSlide, CreateHeroSlidePayload, UpdateHeroSlidePayload } from '../types/api';

const { items, fetchAll, create, update, remove, reorder } =
  useCrudResource<HeroSlide, CreateHeroSlidePayload, UpdateHeroSlidePayload>('/hero-slides');
const { push } = useToast();

const form = reactive({ imageUrl: '' });
const editingId = ref<string | null>(null);
const pendingDeleteId = ref<string | null>(null);

onMounted(fetchAll);

function startEdit(slide: HeroSlide) {
  editingId.value = slide.id;
  form.imageUrl = slide.imageUrl;
}

function resetForm() {
  editingId.value = null;
  form.imageUrl = '';
}

async function onSubmit() {
  if (!form.imageUrl) {
    push('Сначала загрузите фото');
    return;
  }
  try {
    if (editingId.value) {
      await update(editingId.value, { ...form });
    } else {
      await create({ ...form });
    }
    resetForm();
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось сохранить слайд');
  }
}

async function onSlidesUploaded(urls: string[]) {
  for (const imageUrl of urls) {
    try {
      await create({ imageUrl });
    } catch (error) {
      push(error instanceof ApiError ? error.message : 'Не удалось добавить слайд');
    }
  }
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await remove(pendingDeleteId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить слайд');
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
    <h1 class="text-2xl font-semibold text-text">Слайды главного экрана</h1>
    <p class="mt-1 text-sm text-text-secondary">
      Фотографии, которые показываются слайдером на главной странице. Если слайдов нет, используется
      стандартная картинка.
    </p>

    <div v-if="!editingId" class="mt-6 max-w-lg rounded-card bg-card p-4">
      <ImageUploader multiple @uploaded-many="onSlidesUploaded" />
    </div>
    <form v-else class="mt-6 max-w-lg rounded-card bg-card p-4" @submit.prevent="onSubmit">
      <ImageUploader @uploaded="form.imageUrl = $event" />
      <img
        v-if="form.imageUrl"
        :src="form.imageUrl"
        alt=""
        class="mt-3 h-32 w-full rounded-control object-cover"
      />
      <div class="mt-2 flex gap-2">
        <button type="submit" class="rounded-control bg-primary px-4 py-2 text-sm text-primary-text">
          Сохранить
        </button>
        <button type="button" class="text-sm text-text-secondary" @click="resetForm">Отмена</button>
      </div>
    </form>

    <OrderableList :items="items" class="mt-6 max-w-lg" @reorder="onReorder">
      <template #default="{ item }">
        <div class="flex items-center justify-between gap-4">
          <img :src="item.imageUrl" alt="" class="h-14 w-20 shrink-0 rounded-control object-cover" />
          <div class="flex shrink-0 gap-2 text-sm">
            <button class="text-text-secondary" @click="startEdit(item)">Изменить</button>
            <button class="text-danger" @click="pendingDeleteId = item.id">Удалить</button>
          </div>
        </div>
      </template>
    </OrderableList>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="Удалить слайд?"
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
