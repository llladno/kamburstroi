<script setup lang="ts">
const { data } = await useAsyncData('home', async () => {
  const [settings, objects, services, advantages, reviews] = await Promise.all([
    fetchSettings(),
    fetchObjects(),
    fetchServices(),
    fetchAdvantages(),
    fetchReviews(),
  ]);
  return { settings, objects, services, advantages, reviews };
});

useSeoMeta({
  title: 'Kambyrstroi — отделка и ремонт под ключ',
  description: 'Строительство, ремонт и отделка квартир и домов под ключ.',
});
</script>

<template>
  <div v-if="data">
    <HeroSection :settings="data.settings" />
    <ObjectsSection :objects="data.objects" />
    <AboutSection :settings="data.settings" />
    <ServicesTeaserSection :services="data.services" />
    <AdvantagesSection :advantages="data.advantages" />
    <ReviewsSection :reviews="data.reviews" />
    <ContactsSection :settings="data.settings" />
  </div>
</template>
