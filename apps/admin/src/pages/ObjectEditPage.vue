<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';
import OrderableList from '../components/OrderableList.vue';
import ImageUploader from '../components/ImageUploader.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { ObjectImage, ObjectItem } from '../types/api';

const route = useRoute();
const router = useRouter();
const { push } = useToast();

const id = route.params.id as string | undefined;
const isNew = !id;

const form = reactive({
  title: '',
  workType: '',
  description: '',
  year: new Date().getFullYear(),
  isPublished: false,
  isFeatured: false,
});
const images = ref<ObjectImage[]>([]);
const savedId = ref<string | undefined>(id);
const saving = ref(false);
const pendingDeleteImageId = ref<string | null>(null);

async function load() {
  if (!id) return;
  // admin/objects has no single-item GET; fetch the list and find by id (small dataset — MVP-appropriate).
  const list = await api.get<ObjectItem[]>('/admin/objects');
  const found = list.find((o) => o.id === id);
  if (!found) return;
  form.title = found.title;
  form.workType = found.workType;
  form.description = found.description;
  form.year = found.year;
  form.isPublished = found.isPublished;
  form.isFeatured = found.isFeatured;
  images.value = found.images;
}

onMounted(load);

async function onSubmit() {
  saving.value = true;
  try {
    if (savedId.value) {
      await api.patch<ObjectItem>(`/admin/objects/${savedId.value}`, { ...form });
      push('Объект сохранён', 'success');
    } else {
      const created = await api.post<ObjectItem>('/admin/objects', { ...form });
      savedId.value = created.id;
      push('Объект создан — теперь можно добавить фото', 'success');
      await router.replace(`/objects/${created.id}`);
    }
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось сохранить объект');
  } finally {
    saving.value = false;
  }
}

async function onImageUploaded(url: string) {
  if (!savedId.value) return;
  try {
    const image = await api.post<ObjectImage>(`/admin/objects/${savedId.value}/images`, {
      url,
      isCover: images.value.length === 0,
    });
    images.value = [...images.value, image];
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось прикрепить фото');
  }
}

async function onReorderImages(ids: string[]) {
  if (!savedId.value) return;
  try {
    images.value = await api.patch<ObjectImage[]>(
      `/admin/objects/${savedId.value}/images/reorder`,
      { ids },
    );
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось изменить порядок фото');
  }
}

async function onConfirmDeleteImage() {
  if (!savedId.value || !pendingDeleteImageId.value) return;
  try {
    await api.delete(`/admin/objects/${savedId.value}/images/${pendingDeleteImageId.value}`);
    images.value = images.value.filter((img) => img.id !== pendingDeleteImageId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить фото');
  } finally {
    pendingDeleteImageId.value = null;
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-semibold text-text">
      {{ isNew ? 'Новый объект' : 'Редактирование объекта' }}
    </h1>

    <form class="mt-6 flex flex-col gap-3 rounded-card bg-card p-4" @submit.prevent="onSubmit">
      <input
        v-model="form.title"
        placeholder="Название"
        required
        class="rounded-control border border-border px-3 py-2"
      />
      <input
        v-model="form.workType"
        placeholder="Тип работ"
        required
        class="rounded-control border border-border px-3 py-2"
      />
      <textarea
        v-model="form.description"
        placeholder="Описание"
        required
        rows="4"
        class="rounded-control border border-border px-3 py-2"
      />
      <input
        v-model.number="form.year"
        type="number"
        placeholder="Год"
        required
        class="rounded-control border border-border px-3 py-2"
      />
      <label class="flex items-center gap-2 text-sm text-text-secondary">
        <input v-model="form.isPublished" type="checkbox" /> Опубликован на сайте
      </label>
      <label class="flex items-center gap-2 text-sm text-text-secondary">
        <input v-model="form.isFeatured" type="checkbox" /> Показывать на главной
      </label>
      <button
        type="submit"
        :disabled="saving"
        class="w-fit rounded-control bg-primary px-4 py-2 text-sm text-primary-text disabled:opacity-50"
      >
        {{ saving ? 'Сохранение…' : 'Сохранить' }}
      </button>
    </form>

    <section v-if="savedId" class="mt-8">
      <h2 class="text-lg font-semibold text-text">Фото объекта</h2>
      <ImageUploader class="mt-3" @uploaded="onImageUploaded" />
      <OrderableList :items="images" class="mt-4" @reorder="onReorderImages">
        <template #default="{ item }">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <img :src="item.url" class="h-14 w-20 rounded object-cover" />
              <span v-if="item.isCover" class="text-xs text-text-muted">обложка</span>
            </div>
            <button class="text-sm text-danger" @click="pendingDeleteImageId = item.id">
              Удалить
            </button>
          </div>
        </template>
      </OrderableList>
    </section>
    <p v-else class="mt-8 text-sm text-text-muted">
      Сохраните объект, чтобы добавить фото.
    </p>

    <ConfirmDialog
      :open="pendingDeleteImageId !== null"
      title="Удалить фото?"
      @confirm="onConfirmDeleteImage"
      @cancel="pendingDeleteImageId = null"
    />
  </div>
</template>
