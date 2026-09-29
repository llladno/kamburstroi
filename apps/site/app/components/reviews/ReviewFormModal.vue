<script setup lang="ts">
const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ close: []; submitted: [] }>();

const name = ref('');
const rating = ref(5);
const text = ref('');
const consent = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  if (!consent.value) {
    errorMessage.value = 'Нужно согласиться на обработку персональных данных';
    return;
  }
  errorMessage.value = '';
  isSubmitting.value = true;
  try {
    await submitReview({ name: name.value, rating: rating.value, text: text.value });
    emit('submitted');
    name.value = '';
    rating.value = 5;
    text.value = '';
    consent.value = false;
  } catch {
    errorMessage.value = 'Не удалось отправить отзыв, попробуйте ещё раз';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="emit('close')"
    >
      <div class="bg-card rounded-panel w-full max-w-md p-8 shadow-floating">
        <h2 class="text-text text-xl font-medium">Оставить отзыв</h2>

        <form class="mt-6 flex flex-col gap-4" @submit.prevent="handleSubmit">
          <input
            v-model="name"
            required
            type="text"
            placeholder="Имя"
            class="border-border rounded-control border px-4 py-3 text-sm"
          />

          <div class="flex gap-1 text-2xl text-amber-500" role="radiogroup" aria-label="Оценка">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              :aria-label="`${star} из 5`"
              @click="rating = star"
            >
              {{ star <= rating ? '★' : '☆' }}
            </button>
          </div>

          <textarea
            v-model="text"
            required
            placeholder="Ваш отзыв"
            rows="4"
            class="border-border rounded-card border px-4 py-3 text-sm"
          />

          <label class="text-text-muted flex items-start gap-2 text-xs">
            <input v-model="consent" type="checkbox" class="mt-0.5" />
            <span>
              Согласен(на) на
              <NuxtLink to="/privacy" class="underline">обработку персональных данных</NuxtLink>
            </span>
          </label>

          <p v-if="errorMessage" class="text-xs text-red-600">{{ errorMessage }}</p>

          <div class="mt-2 flex gap-3">
            <button
              type="button"
              class="border-border rounded-control flex-1 border px-6 py-3 text-sm"
              @click="emit('close')"
            >
              Отмена
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-primary text-primary-text rounded-control flex-1 px-6 py-3 text-sm font-medium disabled:opacity-60"
            >
              {{ isSubmitting ? 'Отправляем…' : 'Отправить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
