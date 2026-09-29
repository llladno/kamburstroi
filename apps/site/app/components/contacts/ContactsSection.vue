<script setup lang="ts">
import type { SiteSettings } from '~/types/api';

defineProps<{ settings: SiteSettings }>();
const { open } = useLeadModal();
</script>

<template>
  <section id="contacts" class="mx-auto max-w-7xl px-6 py-20 md:py-28">
    <div class="grid gap-10 md:grid-cols-2">
      <div>
        <h2 class="text-text text-2xl font-medium md:text-3xl">Контакты</h2>
        <dl class="text-text-secondary mt-6 flex flex-col gap-3 text-sm">
          <div v-if="settings.phone">
            <dt class="text-text-muted inline">Телефон: </dt>
            <dd class="inline">
              <a :href="`tel:${settings.phone.replace(/[^+\d]/g, '')}`">{{ settings.phone }}</a>
            </dd>
          </div>
          <div v-if="settings.email">
            <dt class="text-text-muted inline">E-mail: </dt>
            <dd class="inline"><a :href="`mailto:${settings.email}`">{{ settings.email }}</a></dd>
          </div>
          <div v-if="settings.workHours">
            <dt class="text-text-muted inline">Режим работы: </dt>
            <dd class="inline">{{ settings.workHours }}</dd>
          </div>
          <div v-if="settings.vkUrl">
            <dt class="text-text-muted inline">ВКонтакте: </dt>
            <dd class="inline">
              <a :href="settings.vkUrl" target="_blank" rel="noopener">{{ settings.vkUrl }}</a>
            </dd>
          </div>
        </dl>
      </div>

      <div class="rounded-panel bg-surface flex flex-col items-start justify-center p-10">
        <p class="text-text-secondary text-sm">Хотите обсудить ваш проект?</p>
        <button
          class="bg-primary text-primary-text rounded-control mt-4 px-6 py-3 text-sm font-medium"
          @click="open"
        >
          Оставить заявку
        </button>
      </div>
    </div>
  </section>
</template>
