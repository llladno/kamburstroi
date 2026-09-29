<script setup lang="ts">
const mockSettings = {
  heroTitle: 'Отделка квартиры под ключ за 45 дней',
  heroSubtitle:
    'Выполним весь комплекс работ — от черновой подготовки до финального монтажа, с контролем качества на каждом этапе.',
  aboutText: '',
  yearsOfExperience: 7,
  completedObjectsCount: 180,
  warrantyMonths: 12,
  phone: '+7 (911) 144-43-15',
  email: '',
  workHours: '',
  vkUrl: '',
};
</script>

<template>
  <div>
    <HeroSection :settings="mockSettings" />
    <p class="text-text-muted mx-auto max-w-7xl px-6 py-20 text-sm">
      Homepage placeholder — assembled in Task 11.
    </p>
  </div>
</template>
