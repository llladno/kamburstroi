<script setup lang="ts">
import type { ObjectItem } from '~/types/api';
import ButtonComponent from '~/components/button/ButtonComponent.vue';

const props = defineProps<{ object: ObjectItem | null }>();
const emit = defineEmits<{ close: [] }>();

const activeIndex = ref(0);
watch(
  () => props.object,
  () => {
    activeIndex.value = 0;
  },
);

const activeImage = computed(() => props.object?.images[activeIndex.value]);
const hasMultiple = computed(() => (props.object?.images.length ?? 0) > 1);

function next() {
  if (!props.object) return;
  activeIndex.value = (activeIndex.value + 1) % props.object.images.length;
}
function prev() {
  if (!props.object) return;
  activeIndex.value =
    (activeIndex.value - 1 + props.object.images.length) % props.object.images.length;
}

function onKeydown(event: KeyboardEvent) {
  if (!props.object) return;
  if (event.key === 'Escape') emit('close');
  else if (event.key === 'ArrowRight') next();
  else if (event.key === 'ArrowLeft') prev();
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-overlay">
      <div
        v-if="object"
        class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 md:bg-neutral-950/85 md:p-4 md:backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <Transition name="modal-panel" appear>
          <div
            class="bg-card relative flex h-full w-full flex-col overflow-y-auto md:h-auto md:max-h-[88vh] md:w-full md:max-w-5xl md:flex-row md:overflow-hidden md:rounded-panel md:shadow-floating"
          >
            <!-- Image -->
            <div class="relative aspect-[4/3] shrink-0 overflow-hidden bg-neutral-100 md:aspect-auto md:min-h-[460px] md:w-[58%]">
              <Transition name="image-fade" mode="out-in">
                <img
                  v-if="activeImage"
                  :key="activeImage.id"
                  :src="activeImage.url"
                  :alt="object.title"
                  class="absolute inset-0 h-full w-full object-cover"
                />
              </Transition>

              <span
                v-if="hasMultiple"
                class="absolute top-4 left-4 rounded-full bg-black/55 px-3 py-1 text-xs text-white backdrop-blur-sm"
              >
                {{ activeIndex + 1 }} / {{ object.images.length }}
              </span>

              <div class="absolute top-4 right-4 z-20">
                <ButtonComponent
                  variant="secondary"
                  size="sm"
                  icon-only
                  aria-label="Закрыть"
                  @click="emit('close')"
                >
                  ✕
                </ButtonComponent>
              </div>

              <div
                v-if="hasMultiple"
                class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3"
              >
                <ButtonComponent
                  variant="secondary"
                  size="xs"
                  icon-only
                  aria-label="Предыдущее фото"
                  @click="prev"
                >
                  ‹
                </ButtonComponent>
                <div class="flex items-center gap-1.5">
                  <button
                    v-for="(image, index) in object.images"
                    :key="image.id"
                    type="button"
                    class="h-1.5 rounded-full transition-all duration-300 hover:bg-white"
                    :class="index === activeIndex ? 'bg-accent w-5' : 'w-1.5 bg-white/55 hover:w-3'"
                    :aria-label="`Фото ${index + 1}`"
                    @click="activeIndex = index"
                  />
                </div>
                <ButtonComponent
                  variant="secondary"
                  size="xs"
                  icon-only
                  aria-label="Следующее фото"
                  @click="next"
                >
                  ›
                </ButtonComponent>
              </div>
            </div>

            <!-- Info -->
            <div class="flex flex-1 flex-col p-6 md:min-h-0 md:w-[42%] md:overflow-y-auto md:p-8">
              <span class="text-accent text-xs font-semibold tracking-[0.1em] uppercase">
                {{ object.workType }}
              </span>
              <h2 class="text-text mt-2 text-2xl leading-tight font-medium">{{ object.title }}</h2>
              <span class="text-text-muted mt-1 text-sm">{{ object.year }} год</span>

              <p class="text-text-secondary mt-6 text-sm leading-relaxed whitespace-pre-line">
                {{ object.description }}
              </p>

              <div v-if="hasMultiple" class="mt-8 flex flex-wrap gap-2 md:mt-auto md:pt-8">
                <button
                  v-for="(image, index) in object.images"
                  :key="image.id"
                  type="button"
                  class="hover-pop size-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors"
                  :class="index === activeIndex ? 'border-accent' : 'border-transparent hover:border-accent/50'"
                  :aria-label="`Фото ${index + 1}`"
                  @click="activeIndex = index"
                >
                  <img :src="image.url" alt="" class="h-full w-full object-cover" />
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.image-fade-enter-active,
.image-fade-leave-active {
  transition: opacity 200ms ease;
}

.image-fade-enter-from,
.image-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .image-fade-enter-active,
  .image-fade-leave-active {
    transition: none;
  }
}
</style>
