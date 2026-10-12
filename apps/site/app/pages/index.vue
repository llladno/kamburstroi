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
  title: 'КамбурСтрой — отделка и ремонт под ключ',
  description: 'Строительство, ремонт и отделка квартир и домов под ключ.',
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
