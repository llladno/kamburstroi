export interface ObjectImage {
  id: string;
  projectId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateObjectPayload {
  title: string;
  workType: string;
  description: string;
  year: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  order?: number;
}

export type UpdateObjectPayload = Partial<CreateObjectPayload>;

export interface Service {
  id: string;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicePayload {
  title: string;
  description: string;
  order?: number;
}

export type UpdateServicePayload = Partial<CreateServicePayload>;

export type Advantage = Service;
export type CreateAdvantagePayload = CreateServicePayload;
export type UpdateAdvantagePayload = UpdateServicePayload;

export interface HeroSlide {
  id: string;
  imageUrl: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHeroSlidePayload {
  imageUrl: string;
  order?: number;
}

export type UpdateHeroSlidePayload = Partial<CreateHeroSlidePayload>;

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamMemberPayload {
  name: string;
  role: string;
  photoUrl?: string;
  order?: number;
}

export type UpdateTeamMemberPayload = Partial<CreateTeamMemberPayload>;

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  foundingYear: number;
  specialization: string;
  aboutPhotoUrl: string;
  yearsOfExperience: number;
  completedObjectsCount: number;
  warrantyMonths: number;
  phone: string;
  email: string;
  workHours: string;
  vkUrl: string;
  updatedAt: string;
}

export type UpdateSettingsPayload = Partial<Omit<SiteSettings, 'updatedAt'>>;

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  photoUrl?: string | null;
  projectId?: string | null;
  status: ReviewStatus;
  createdAt: string;
}

export interface UpdateReviewPayload {
  name?: string;
  rating?: number;
  text?: string;
  status?: ReviewStatus;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  comment?: string | null;
  isProcessed: boolean;
  createdAt: string;
}

export interface UpdateLeadPayload {
  isProcessed: boolean;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}
