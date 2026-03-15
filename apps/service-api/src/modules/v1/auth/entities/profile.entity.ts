import { UserRole } from '@medical-portal/shared';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  year_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  picture?: string;
  profile?: Profile;
}
