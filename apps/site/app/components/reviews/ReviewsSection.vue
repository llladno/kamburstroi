<script setup lang="ts">
import type { Review } from '~/types/api';
import ButtonComponent from '~/components/button/ButtonComponent.vue';

defineProps<{ reviews: Review[] }>();
const isModalOpen = ref(false);
const isThankYouVisible = ref(false);
const heading = useRevealMotion();
const track = ref<HTMLElement>();

function handleSubmitted() {
  isModalOpen.value = false;
  isThankYouVisible.value = true;
}

function scrollByCard(direction: 1 | -1) {
  const el = track.value;
  if (!el) return;
  const card = el.querySelector<HTMLElement>('[data-review-card]');
  const step = (card?.offsetWidth ?? 320) + 24;
  el.scrollBy({ left: direction * step, behavior: 'smooth' });
}
</script>

<template>
  <section id="reviews" class="bg-surface">
    <div class="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div
        v-motion
        class="flex flex-wrap items-center justify-between gap-4"
        :initial="heading.initial"
        :visible-once="heading.visibleOnce"
      >
        <h2 class="text-text text-2xl font-medium md:text-3xl">Отзывы</h2>
        <div class="flex items-center gap-3">
          <div v-if="reviews.length > 1" class="flex gap-2">
            <ButtonComponent variant="outline" size="sm" icon-only aria-label="Предыдущие отзывы" @click="scrollByCard(-1)">
              <svg viewBox="0 0 16 16" fill="none" class="h-3.5 w-3.5"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </ButtonComponent>
            <ButtonComponent variant="outline" size="sm" icon-only aria-label="Следующие отзывы" @click="scrollByCard(1)">
              <svg viewBox="0 0 16 16" fill="none" class="h-3.5 w-3.5"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </ButtonComponent>
          </div>
          <ButtonComponent @click="isModalOpen = true">
            Оставить отзыв
          </ButtonComponent>
        </div>
      </div>

      <p v-if="isThankYouVisible" class="mt-6 text-sm text-green-700">
        Спасибо! Ваш отзыв появится на сайте после проверки.
      </p>

      <div v-if="reviews.length === 0" class="text-text-muted mt-8 text-sm">
        Пока нет опубликованных отзывов.
      </div>
      <div
        v-else
        ref="track"
        class="no-scrollbar -mx-6 mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-6 pb-2"
      >
        <div
          v-for="(review, index) in reviews"
          :key="review.id"
          data-review-card
          class="w-[300px] shrink-0 snap-start sm:w-[340px]"
        >
          <ReviewCard :review="review" :index="index" />
        </div>
      </div>

      <ReviewFormModal
        :is-open="isModalOpen"
        @close="isModalOpen = false"
        @submitted="handleSubmitted"
      />
    </div>
  </section>
</template>
