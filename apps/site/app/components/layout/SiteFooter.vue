<script setup lang="ts">
</script>
<template>
  <footer class="bg-navy">
    <div
      class="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm md:flex-row md:items-center md:justify-between"
    >
      <p class="text-white/55">© {{ new Date().getFullYear() }} КамбурСтрой</p>
      <NuxtLink to="/privacy" class="hover-underline text-white/55 hover:text-accent pb-0.5">
        Политика обработки персональных данных
      </NuxtLink>
    </div>
  </footer>
</template>
