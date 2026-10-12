<script setup lang="ts">
const { data } = await useAsyncData('home', async () => {
  const [settings, objects, services, advantages, reviews, heroSlides] = await Promise.all([
    fetchSettings(),
    fetchObjects(),
    fetchServices(),
    fetchAdvantages(),
    fetchReviews(),
    fetchHeroSlides(),
  ]);
  return { settings, objects, services, advantages, reviews, heroSlides };
});

useSeoMeta({
  title: 'КамбурСтрой — ремонт и строительство под ключ',
  description:
    'КамбурСтрой — ремонт и строительство под ключ: квартиры, дома, коммерческие помещения. Полный цикл работ от замера до сдачи объекта, фиксированная смета и гарантия на выполненные работы.',
  ogTitle: 'КамбурСтрой — ремонт и строительство под ключ',
  ogDescription:
    'Ремонт и строительство под ключ: квартиры, дома, коммерческие помещения. Фиксированная смета, контроль качества на каждом этапе, гарантия на работы.',
  ogType: 'website',
});
</script>

<template>
  <div v-if="data">
    <HeroSection :settings="data.settings" :slides="data.heroSlides" />
    <ObjectsSection :objects="data.objects" />
    <AboutSection :settings="data.settings" />
    <ServicesTeaserSection :services="data.services" />
    <AdvantagesSection :advantages="data.advantages" />
    <ReviewsSection :reviews="data.reviews" />
    <ContactsSection :settings="data.settings" />
  </div>
</template>
