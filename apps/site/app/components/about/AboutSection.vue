<script setup lang="ts">
import type { SiteSettings } from '~/types/api';

const props = defineProps<{ settings: SiteSettings }>();

const paragraphs = computed(() => {
  const text = props.settings.aboutText || 'Мы специализируемся на отделке и ремонте квартир и домов под ключ.';
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
});

const chips = computed(() => {
  const list: string[] = [];
  if (props.settings.foundingYear) list.push(`С ${props.settings.foundingYear} года`);
  if (props.settings.specialization) list.push(props.settings.specialization);
  return list;
});

const photo = useRevealMotion();
const content = useRevealMotion(100);
</script>

<template>
  <section id="about" class="mx-auto max-w-7xl px-6 py-20 md:py-28">
    <div class="grid gap-10 md:grid-cols-2 md:items-center">
      <div
        v-motion
        class="rounded-panel relative min-h-[280px] overflow-hidden md:min-h-[420px]"
        :initial="photo.initial"
        :visible-once="photo.visibleOnce"
      >
        <img
          v-if="settings.aboutPhotoUrl"
          :src="settings.aboutPhotoUrl"
          alt="О компании"
          class="h-full w-full object-cover"
        />
        <div
          v-else
          class="h-full w-full"
          style="background: radial-gradient(circle at 30% 20%, rgba(255,255,255,.7), transparent 45%), #F3F4F5;"
        />
      </div>

      <div v-motion :initial="content.initial" :visible-once="content.visibleOnce">
        <h2 class="text-text text-2xl font-medium md:text-3xl">О компании</h2>

        <div v-if="chips.length > 0" class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="chip in chips"
            :key="chip"
            class="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs text-text-secondary"
          >
            {{ chip }}
          </span>
        </div>

        <div class="mt-6 flex flex-col gap-4">
          <p
            v-for="(paragraph, index) in paragraphs"
            :key="index"
            class="text-text-secondary text-base leading-relaxed whitespace-pre-line"
          >
            {{ paragraph }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
