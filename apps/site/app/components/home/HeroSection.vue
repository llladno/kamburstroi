<script setup lang="ts">
import type { SiteSettings } from '~/types/api';

const props = defineProps<{ settings: SiteSettings }>();
const { open } = useLeadModal();
</script>

<template>
  <section class="p-2 md:p-3">
    <div class="grid gap-3 md:grid-cols-[1.3fr_1fr]">
      <!-- Left panel -->
      <div
        class="rounded-hero relative min-h-[500px] overflow-hidden p-8 md:min-h-[688px] md:p-12"
        style="background: radial-gradient(circle at 70% 20%, rgba(255,255,255,.9), transparent 42%), radial-gradient(circle at 20% 70%, rgba(255,255,255,.45), transparent 40%), #F3F4F5;"
      >
        <div class="flex h-full flex-col justify-between">
          <div class="max-w-[480px]">
            <h1 class="text-text text-3xl leading-tight font-medium tracking-tight md:text-4xl">
              {{ props.settings.heroTitle || 'Отделка квартиры под ключ' }}
            </h1>
            <p class="text-text-secondary mt-4 text-base leading-relaxed">
              {{
                props.settings.heroSubtitle ||
                'Выполним весь комплекс работ — от черновой подготовки до финального монтажа.'
              }}
            </p>
            <button
              class="bg-primary text-primary-text rounded-control mt-10 flex items-center gap-2 px-8 py-4 text-sm font-medium"
              @click="open"
            >
              Рассчитать стоимость
              <span aria-hidden="true">↘</span>
            </button>
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
      <div class="rounded-hero relative min-h-[300px] overflow-hidden md:min-h-[688px]">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200"
          alt="Премиальный ремонт квартиры"
          class="h-full w-full object-cover"
          style="object-position: 55% center;"
        />

        <div class="absolute top-12 left-13 flex gap-2.5">
          <button
            class="bg-glass rounded-control flex h-10 items-center gap-2 px-4 text-xs font-medium backdrop-blur-md"
            @click="open"
          >
            ↘ Оставить заявку
          </button>
          <a
            v-if="props.settings.phone"
            :href="`tel:${props.settings.phone.replace(/[^+\d]/g, '')}`"
            class="bg-glass rounded-control flex h-10 items-center gap-2 px-4 text-xs font-medium backdrop-blur-md"
          >
            ☎ {{ props.settings.phone }}
          </a>
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
