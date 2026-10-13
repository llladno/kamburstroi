import type {
  Advantage,
  CreateLeadPayload,
  CreateReviewPayload,
  HeroSlide,
  ObjectItem,
  Review,
  Service,
  SiteSettings,
} from '~/types/api';

function apiBase(): string {
  return useRuntimeConfig().public.apiBase;
}

export function fetchSettings() {
  return $fetch<SiteSettings>(`${apiBase()}/settings`);
}

export function fetchServices() {
  return $fetch<Service[]>(`${apiBase()}/services`);
}

export function fetchAdvantages() {
  return $fetch<Advantage[]>(`${apiBase()}/advantages`);
}

export function fetchHeroSlides() {
  return $fetch<HeroSlide[]>(`${apiBase()}/hero-slides`);
}

export function fetchObjects() {
  return $fetch<ObjectItem[]>(`${apiBase()}/objects`);
}

export function fetchObject(slug: string) {
  return $fetch<ObjectItem>(`${apiBase()}/objects/${slug}`);
}

export function fetchReviews() {
  return $fetch<Review[]>(`${apiBase()}/reviews`);
}

export function submitReview(payload: CreateReviewPayload) {
  return $fetch<Review>(`${apiBase()}/reviews`, { method: 'POST', body: payload });
}

export function uploadReviewPhoto(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return $fetch<{ url: string }>(`${apiBase()}/reviews/photo`, {
    method: 'POST',
    body: formData,
  });
}

export function submitLead(payload: CreateLeadPayload) {
  return $fetch(`${apiBase()}/leads`, { method: 'POST', body: payload });
}
