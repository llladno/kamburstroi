<template>
  <footer class="border-border border-t">
    <div
      class="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-sm md:flex-row md:items-center md:justify-between"
    >
      <p class="text-text-muted">© {{ new Date().getFullYear() }} Kambyrstroi</p>
      <NuxtLink to="/privacy" class="text-text-muted hover:text-text">
        Политика обработки персональных данных
      </NuxtLink>
    </div>
  </footer>
</template>
