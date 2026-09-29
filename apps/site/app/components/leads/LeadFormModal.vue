<script setup lang="ts">
const { isOpen, close } = useLeadModal();

const name = ref('');
const phone = ref('');
const comment = ref('');
const consent = ref(false);
const isSubmitting = ref(false);
const isSubmitted = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  if (!consent.value) {
    errorMessage.value = 'Нужно согласиться на обработку персональных данных';
    return;
  }
  errorMessage.value = '';
  isSubmitting.value = true;
  try {
    await submitLead({ name: name.value, phone: phone.value, comment: comment.value || undefined });
    isSubmitted.value = true;
  } catch {
    errorMessage.value = 'Не удалось отправить заявку, попробуйте ещё раз';
  } finally {
    isSubmitting.value = false;
  }
}

function handleClose() {
  close();
  isSubmitted.value = false;
  name.value = '';
  phone.value = '';
  comment.value = '';
  consent.value = false;
  errorMessage.value = '';
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="handleClose"
    >
      <div class="bg-card rounded-panel w-full max-w-md p-8 shadow-floating">
        <div v-if="!isSubmitted">
          <h2 class="text-text text-xl font-medium">Оставить заявку</h2>
          <p class="text-text-secondary mt-1 text-sm">
            Свяжемся с вами в ближайшее время
          </p>

          <form class="mt-6 flex flex-col gap-4" @submit.prevent="handleSubmit">
            <input
              v-model="name"
              required
              type="text"
              placeholder="Имя"
              class="border-border rounded-control border px-4 py-3 text-sm"
            />
            <input
              v-model="phone"
              required
              type="tel"
              placeholder="Телефон"
              class="border-border rounded-control border px-4 py-3 text-sm"
            />
            <textarea
              v-model="comment"
              placeholder="Комментарий (необязательно)"
              rows="3"
              class="border-border rounded-card border px-4 py-3 text-sm"
            />

            <label class="text-text-muted flex items-start gap-2 text-xs">
              <input v-model="consent" type="checkbox" class="mt-0.5" />
              <span>
                Согласен(на) на
                <NuxtLink to="/privacy" class="underline" @click="handleClose">
                  обработку персональных данных
                </NuxtLink>
              </span>
            </label>

            <p v-if="errorMessage" class="text-xs text-red-600">{{ errorMessage }}</p>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="bg-primary text-primary-text rounded-control mt-2 px-6 py-3 text-sm font-medium disabled:opacity-60"
            >
              {{ isSubmitting ? 'Отправляем…' : 'Отправить заявку' }}
            </button>
          </form>
        </div>

        <div v-else class="py-6 text-center">
          <h2 class="text-text text-lg font-medium">Спасибо!</h2>
          <p class="text-text-secondary mt-2 text-sm">Мы скоро с вами свяжемся.</p>
          <button
            class="bg-primary text-primary-text rounded-control mt-6 px-6 py-2.5 text-sm font-medium"
            @click="handleClose"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
