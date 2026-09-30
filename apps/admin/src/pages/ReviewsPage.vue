<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import type { Review, ReviewStatus } from '../types/api';

const reviews = ref<Review[]>([]);
const filter = ref<ReviewStatus | 'all'>('pending');
const pendingDeleteId = ref<string | null>(null);
const { push } = useToast();

const filtered = computed(() =>
  filter.value === 'all' ? reviews.value : reviews.value.filter((r) => r.status === filter.value),
);

const statusLabels: Record<ReviewStatus, string> = {
  pending: 'На модерации',
  approved: 'Опубликован',
  rejected: 'Отклонён',
  hidden: 'Скрыт',
};

async function load() {
  reviews.value = await api.get<Review[]>('/admin/reviews');
}

onMounted(load);

async function setStatus(review: Review, status: ReviewStatus) {
  try {
    const updated = await api.patch<Review>(`/admin/reviews/${review.id}`, { status });
    reviews.value = reviews.value.map((r) => (r.id === review.id ? updated : r));
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось изменить статус отзыва');
  }
}

async function onConfirmDelete() {
  if (!pendingDeleteId.value) return;
  try {
    await api.delete(`/admin/reviews/${pendingDeleteId.value}`);
    reviews.value = reviews.value.filter((r) => r.id !== pendingDeleteId.value);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось удалить отзыв');
  } finally {
    pendingDeleteId.value = null;
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-semibold text-text">Отзывы</h1>

    <div class="mt-4 flex gap-2 text-sm">
      <button
        v-for="option in (['pending', 'approved', 'rejected', 'hidden', 'all'] as const)"
        :key="option"
        class="rounded-control px-3 py-1"
        :class="filter === option ? 'bg-primary text-primary-text' : 'bg-card text-text-secondary'"
        @click="filter = option"
      >
        {{ option === 'all' ? 'Все' : statusLabels[option] }}
      </button>
    </div>

    <div class="mt-4 flex flex-col gap-3">
      <div v-for="review in filtered" :key="review.id" class="rounded-card bg-card p-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="font-medium text-text">{{ review.name }} · {{ review.rating }}/5</div>
            <p class="mt-1 text-sm text-text-secondary">{{ review.text }}</p>
            <img v-if="review.photoUrl" :src="review.photoUrl" class="mt-2 h-20 w-28 rounded object-cover" />
          </div>
          <span class="shrink-0 text-xs text-text-muted">{{ statusLabels[review.status] }}</span>
        </div>
        <div class="mt-3 flex gap-2 text-sm">
          <button v-if="review.status !== 'approved'" class="text-success" @click="setStatus(review, 'approved')">
            Одобрить
          </button>
          <button v-if="review.status !== 'rejected'" class="text-text-secondary" @click="setStatus(review, 'rejected')">
            Отклонить
          </button>
          <button v-if="review.status !== 'hidden'" class="text-text-secondary" @click="setStatus(review, 'hidden')">
            Скрыть
          </button>
          <button class="text-danger" @click="pendingDeleteId = review.id">Удалить</button>
        </div>
      </div>
      <p v-if="filtered.length === 0" class="text-sm text-text-muted">Нет отзывов в этой категории.</p>
    </div>

    <ConfirmDialog
      :open="pendingDeleteId !== null"
      title="Удалить отзыв?"
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>
