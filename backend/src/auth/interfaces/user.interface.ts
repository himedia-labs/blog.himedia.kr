import type { UserRole } from '@/auth/entities/user.entity';

export interface AuthUserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  course: string | null;
  birthDate: string | null;
  profileHandle: string | null;
  profileImageUrl: string | null;
  profileBio: string | null;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  profileHandle: string | null;
  profileImageUrl: string | null;
  profileBio: string | null;
}
