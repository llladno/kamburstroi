<script setup lang="ts">
import type { HeroSlide, SiteSettings } from '~/types/api';
import ButtonComponent from '~/components/button/ButtonComponent.vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

const props = defineProps<{ settings: SiteSettings; slides: HeroSlide[] }>();
const { open } = useLeadModal();

const fallbackImage =
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200';

const textMotion = useRevealMotion();
const imageMotion = useRevealMotion(120);
</script>

<template>
  <section class="p-2 md:p-3">
    <div class="mx-auto grid max-w-[1600px] gap-3 md:grid-cols-[1.3fr_1fr] md:grid-rows-[minmax(640px,auto)]">
      <!-- Left panel -->
      <div
        v-motion
        class="rounded-hero relative min-h-[460px] overflow-hidden p-6 sm:p-8 md:min-h-0 md:p-12"
        style="background: radial-gradient(circle at 70% 20%, rgba(255,255,255,.9), transparent 42%), radial-gradient(circle at 20% 70%, rgba(255,255,255,.45), transparent 40%), #F3F4F5;"
        :initial="textMotion.initial"
        :enter="textMotion.enter"
      >
        <div class="flex h-full flex-col justify-between">
          <div class="max-w-[480px]">
            <span class="text-accent inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase">
              <span class="bg-accent h-1.5 w-1.5 rounded-full" />
              {{ props.settings.specialization || 'Строительная компания' }}
            </span>
            <h1 class="text-text mt-4 text-4xl leading-[1.08] font-semibold tracking-[-0.02em] md:text-5xl">
              {{ props.settings.heroTitle || 'Отделка квартиры под ключ' }}
            </h1>
            <p class="text-text-secondary mt-5 max-w-[420px] text-base leading-relaxed md:text-lg">
              {{
                props.settings.heroSubtitle ||
                'Выполним весь комплекс работ — от черновой подготовки до финального монтажа.'
              }}
            </p>
            <ButtonComponent
              size="lg"
              arrow
              class="mt-10"
              @click="open"
            >
              Рассчитать стоимость
            </ButtonComponent>

          </div>

          <!-- Desktop: stats live inside the left panel, per DESIGN_SYSTEM.md's
               "three overlapping statistic cards integrated into the hero"
               constraint. Hidden on mobile — see the mobile-only block below,
               which places the same cards after the image per §17's required
               order (Header → Hero text → CTA → Image → Stats). -->
          <div class="mt-10 hidden gap-3.5 md:flex">
            <StatCard :value="`${props.settings.yearsOfExperience}+`" label="лет опыта" />
            <StatCard :value="`${props.settings.completedObjectsCount}+`" label="объектов завершили" />
            <StatCard :value="`${props.settings.warrantyMonths} мес.`" label="гарантии" />
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div
        v-motion
        class="rounded-hero relative h-[340px] overflow-hidden bg-neutral-200 sm:h-[440px] md:h-auto"
        :initial="imageMotion.initial"
        :enter="imageMotion.enter"
      >
        <!-- The media frame is absolutely positioned so a photo's intrinsic size
             can never stretch the hero; height comes only from the panel above. -->
        <div class="absolute inset-0">
        <ClientOnly>
          <Swiper
            v-if="props.slides.length > 0"
            class="h-full w-full"
            :modules="[Autoplay, EffectFade, Pagination]"
            effect="fade"
            :fade-effect="{ crossFade: true }"
            :autoplay="{ delay: 5000, disableOnInteraction: false }"
            :pagination="props.slides.length > 1 ? { clickable: true } : false"
            :loop="props.slides.length > 1"
          >
            <SwiperSlide v-for="slide in props.slides" :key="slide.id">
              <img
                :src="slide.imageUrl"
                alt="Премиальный ремонт квартиры"
                class="h-full w-full object-cover"
                style="object-position: 55% center;"
              />
            </SwiperSlide>
          </Swiper>
          <img
            v-else
            :src="fallbackImage"
            alt="Премиальный ремонт квартиры"
            class="h-full w-full object-cover"
            style="object-position: 55% center;"
          />

          <template #fallback>
            <img
              :src="props.slides[0]?.imageUrl || fallbackImage"
              alt="Премиальный ремонт квартиры"
              class="h-full w-full object-cover"
              style="object-position: 55% center;"
            />
          </template>
        </ClientOnly>
        </div>

        <div
          class="pointer-events-none absolute inset-x-0 top-0 z-[5] h-32 bg-gradient-to-b from-black/25 to-transparent"
          aria-hidden="true"
        />

        <div class="pointer-events-none absolute top-4 right-4 left-4 z-10 flex flex-wrap gap-2.5 md:top-12 md:right-auto md:left-13">
          <ButtonComponent variant="secondary" class="pointer-events-auto" @click="open">
            ↘ Оставить заявку
          </ButtonComponent>
          <ButtonComponent v-if="props.settings.phone" variant="secondary" class="pointer-events-auto" :href="`tel:${props.settings.phone.replace(/[^+\d]/g, '')}`">
            ☎ {{ props.settings.phone }}
          </ButtonComponent>
        </div>
      </div>
    </div>

    <!-- Mobile-only stats row, positioned after the image per DESIGN_SYSTEM.md §17 -->
    <div class="mt-3 flex gap-3 md:hidden">
      <StatCard :value="`${props.settings.yearsOfExperience}+`" label="лет опыта" />
      <StatCard :value="`${props.settings.completedObjectsCount}+`" label="объектов завершили" />
      <StatCard :value="`${props.settings.warrantyMonths} мес.`" label="гарантии" />
    </div>
  </section>
</template>

<style scoped>
:deep(.swiper-pagination) {
  bottom: 20px !important;
}

:deep(.swiper-pagination-bullet) {
  background: #ffffff;
  opacity: 0.6;
}

:deep(.swiper-pagination-bullet-active) {
  opacity: 1;
}
</style>
