import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-09-29',
  devtools: { enabled: true },
  devServer: { port: 3001 },
  modules: ['@nuxt/fonts', '@nuxtjs/sitemap', '@vueuse/motion/nuxt'],
  components: [{ path: '~/components', pathPrefix: false }],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:3000/api',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'КамбурСтрой — ремонт и строительство под ключ',
      titleTemplate: '%s | КамбурСтрой',
      meta: [
        {
          name: 'description',
          content:
            'КамбурСтрой — ремонт и строительство под ключ: квартиры, дома, коммерческие помещения. Полный цикл работ от замера до сдачи объекта, фиксированная смета и гарантия.',
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'КамбурСтрой — ремонт и строительство под ключ' },
        {
          property: 'og:description',
          content: 'Ремонт и строительство под ключ: квартиры, дома, коммерческие помещения. Фиксированная смета, контроль качества на каждом этапе, гарантия на работы.',
        },
        { name: 'theme-color', content: '#4D4D4D' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icon-512.png' },
      ],
    },
  },
});
