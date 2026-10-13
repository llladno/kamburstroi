<script setup lang="ts">
import ButtonComponent from '~/components/button/ButtonComponent.vue';
import CheckboxComponent from '~/components/form/CheckboxComponent.vue';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ close: []; submitted: [] }>();

const name = ref('');
const rating = ref(5);
const text = ref('');
const consent = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

const photoFile = ref<File | null>(null);
const photoPreviewUrl = ref('');
const fileInput = ref<HTMLInputElement>();

function onPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value);
  photoFile.value = file;
  photoPreviewUrl.value = URL.createObjectURL(file);
}

function removePhoto() {
  if (photoPreviewUrl.value) URL.revokeObjectURL(photoPreviewUrl.value);
  photoFile.value = null;
  photoPreviewUrl.value = '';
  if (fileInput.value) fileInput.value.value = '';
}

async function handleSubmit() {
  if (!consent.value) {
    errorMessage.value = 'Нужно согласиться на обработку персональных данных';
    return;
  }
  errorMessage.value = '';
  isSubmitting.value = true;
  try {
    let photoUrl: string | undefined;
    if (photoFile.value) {
      const uploaded = await uploadReviewPhoto(photoFile.value);
      photoUrl = uploaded.url;
    }
    await submitReview({ name: name.value, rating: rating.value, text: text.value, photoUrl });
    emit('submitted');
    name.value = '';
    rating.value = 5;
    text.value = '';
    consent.value = false;
    removePhoto();
  } catch {
    errorMessage.value = 'Не удалось отправить отзыв, попробуйте ещё раз';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-overlay">
    <div
      v-if="props.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="emit('close')"
    >
      <Transition name="modal-panel" appear>
      <div class="bg-card rounded-panel w-full max-w-md p-8 shadow-floating">
        <h2 class="text-text text-xl font-medium">Оставить отзыв</h2>

        <form class="mt-6 flex flex-col gap-4" @submit.prevent="handleSubmit">
          <input
            v-model="name"
            required
            type="text"
            placeholder="Имя"
            class="ui-input rounded-control px-4 py-3 text-sm"
          />

          <div class="flex gap-1 text-2xl text-amber-500" role="radiogroup" aria-label="Оценка">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="hover-pop"
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
            class="ui-input rounded-card px-4 py-3 text-sm"
          />

          <div class="flex flex-col gap-2">
            <label class="text-text-muted text-xs">Фотография (необязательно)</label>
            <div v-if="photoPreviewUrl" class="relative w-fit">
              <img :src="photoPreviewUrl" alt="Предпросмотр фото" class="h-24 w-24 rounded-control object-cover" />
              <button
                type="button"
                aria-label="Убрать фото"
                class="bg-card text-text-secondary hover:text-accent absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs shadow-floating"
                @click="removePhoto"
              >
                ✕
              </button>
            </div>
            <button
              v-else
              type="button"
              class="ui-input rounded-control px-4 py-3 text-left text-sm text-text-muted"
              @click="fileInput?.click()"
            >
              Прикрепить фотографию
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onPhotoSelected"
            />
          </div>

          <CheckboxComponent v-model="consent" class="text-text-muted text-xs">
            Согласен(на) на
            <NuxtLink to="/privacy" class="hover:text-accent underline transition-colors">обработку персональных данных</NuxtLink>
          </CheckboxComponent>

          <p v-if="errorMessage" class="text-xs text-red-600">{{ errorMessage }}</p>

          <div class="mt-2 flex gap-3">
            <ButtonComponent type="button" variant="outline" class="flex-1" @click="emit('close')">
              Отмена
            </ButtonComponent>
            <ButtonComponent type="submit" class="flex-1" :loading="isSubmitting">
              Отправить
            </ButtonComponent>
          </div>
        </form>
      </div>
      </Transition>
    </div>
    </Transition>
  </Teleport>
</template>
