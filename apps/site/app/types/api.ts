export interface ObjectImage {
  id: string;
  url: string;
  order: number;
  isCover: boolean;
}

export interface ObjectItem {
  id: string;
  slug: string;
  title: string;
  workType: string;
  description: string;
  year: number;
  isPublished: boolean;
  isFeatured: boolean;
  order: number;
  images: ObjectImage[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Advantage {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  yearsOfExperience: number;
  completedObjectsCount: number;
  warrantyMonths: number;
  phone: string;
  email: string;
  workHours: string;
  vkUrl: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  photoUrl: string | null;
  projectId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  createdAt: string;
}

export interface CreateLeadPayload {
  name: string;
  phone: string;
  comment?: string;
}

export interface CreateReviewPayload {
  name: string;
  rating: number;
  text: string;
  photoUrl?: string;
  projectId?: string;
}
