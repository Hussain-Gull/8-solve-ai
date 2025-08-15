export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';

export interface TenantDTO {
  id: string;
  name: string;
  createdAt: string;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  tenantId: string;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
}


