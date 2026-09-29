<script setup lang="ts">
import type { ObjectItem } from '~/types/api';

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

const mockObjects: ObjectItem[] = [
  {
    id: '1',
    slug: 'remont-kvartiry-na-lenina',
    title: 'Ремонт квартиры на Ленина',
    workType: 'Косметический ремонт',
    description: 'Полный цикл работ под ключ, включая замену коммуникаций и чистовую отделку.',
    year: 2026,
    isPublished: true,
    isFeatured: true,
    order: 0,
    images: [
      {
        id: 'i1',
        url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800',
        order: 0,
        isCover: true,
      },
      {
        id: 'i2',
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=800',
        order: 1,
        isCover: false,
      },
    ],
  },
  {
    id: '2',
    slug: 'dom-u-morya',
    title: 'Дом у моря',
    workType: 'Строительство',
    description: 'Загородный дом с панорамными окнами и террасой.',
    year: 2025,
    isPublished: true,
    isFeatured: true,
    order: 1,
    images: [
      {
        id: 'i3',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800',
        order: 0,
        isCover: true,
      },
    ],
  },
];

const mockServices = [
  { id: 's1', title: 'Отделка под ключ', description: 'Полный цикл отделочных работ для квартир и домов.', order: 0 },
  { id: 's2', title: 'Смета до начала работ', description: 'Фиксируем стоимость и сроки в договоре заранее.', order: 1 },
  { id: 's3', title: 'Авторский надзор', description: 'Контролируем качество на каждом этапе работ.', order: 2 },
];
</script>

<template>
  <div>
    <HeroSection :settings="mockSettings" />
    <ObjectsSection :objects="mockObjects" />
    <AboutSection :settings="mockSettings" />
    <ServicesTeaserSection :services="mockServices" />
  </div>
</template>
