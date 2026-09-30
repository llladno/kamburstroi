<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { api } from '../lib/api';
import type { Lead, Review } from '../types/api';

const pendingReviews = ref(0);
const unprocessedLeads = ref(0);
const loading = ref(true);

onMounted(async () => {
  const [reviews, leads] = await Promise.all([
    api.get<Review[]>('/admin/reviews'),
    api.get<Lead[]>('/admin/leads'),
  ]);
  pendingReviews.value = reviews.filter((r) => r.status === 'pending').length;
  unprocessedLeads.value = leads.filter((l) => !l.isProcessed).length;
  loading.value = false;
});
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold text-text">Дашборд</h1>
    <div v-if="!loading" class="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
      <router-link to="/reviews" class="rounded-card bg-card p-6 shadow-card">
        <div class="text-3xl font-semibold text-text">{{ pendingReviews }}</div>
        <div class="mt-1 text-sm text-text-secondary">отзывов на модерации</div>
      </router-link>
      <router-link to="/leads" class="rounded-card bg-card p-6 shadow-card">
        <div class="text-3xl font-semibold text-text">{{ unprocessedLeads }}</div>
        <div class="mt-1 text-sm text-text-secondary">необработанных заявок</div>
      </router-link>
    </div>
  </div>
</template>
