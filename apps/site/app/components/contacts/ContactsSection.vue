<script setup lang="ts">
import type { SiteSettings } from '~/types/api';
import ButtonComponent from '~/components/button/ButtonComponent.vue';

defineProps<{ settings: SiteSettings }>();
const { open } = useLeadModal();
const left = useRevealMotion();
const right = useRevealMotion(100);
</script>

<template>
  <section id="contacts" class="mx-auto max-w-7xl px-6 py-20 md:py-28">
    <div class="grid gap-10 md:grid-cols-2">
      <div v-motion :initial="left.initial" :visible-once="left.visibleOnce">
        <h2 class="text-text text-2xl font-medium md:text-3xl">Контакты</h2>
        <dl class="text-text-secondary mt-6 flex flex-col gap-3 text-sm">
          <div v-if="settings.phone">
            <dt class="text-text-muted inline">Телефон: </dt>
            <dd class="inline">
              <a :href="`tel:${settings.phone.replace(/[^+\d]/g, '')}`" class="hover-underline hover:text-accent">{{ settings.phone }}</a>
            </dd>
          </div>
          <div v-if="settings.email">
            <dt class="text-text-muted inline">E-mail: </dt>
            <dd class="inline"><a :href="`mailto:${settings.email}`" class="hover-underline hover:text-accent">{{ settings.email }}</a></dd>
          </div>
          <div v-if="settings.workHours">
            <dt class="text-text-muted inline">Режим работы: </dt>
            <dd class="inline">{{ settings.workHours }}</dd>
          </div>
          <div v-if="settings.vkUrl">
            <dt class="text-text-muted inline">ВКонтакте: </dt>
            <dd class="inline">
              <a :href="settings.vkUrl" target="_blank" rel="noopener" class="hover-underline hover:text-accent">{{ settings.vkUrl }}</a>
            </dd>
          </div>
        </dl>
      </div>

      <div
        v-motion
        class="rounded-panel bg-surface flex flex-col items-start justify-center p-10"
        :initial="right.initial"
        :visible-once="right.visibleOnce"
      >
        <p class="text-text-secondary text-sm">Хотите обсудить ваш проект?</p>
        <ButtonComponent class="mt-4" @click="open">
          Оставить заявку
        </ButtonComponent>
      </div>
    </div>
  </section>
</template>
