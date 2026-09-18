import type { AuthType } from './auth.types.js';

export interface UserCredentials {
  email?: string;
  password?: string;
}

export interface ChefUserCredentials extends UserCredentials {
  ruc?: string;
}

export interface PlaywrightHarnessConfig {
  publicBaseUrl: string;
  tenantRuc: string;
  users: Record<AuthType, UserCredentials>;
  seeded: {
    enabled: boolean;
    adminRoutes: string[];
  };
}

export interface ChefHarnessConfig {
  baseUrl: string;
  users: {
    actor1: ChefUserCredentials;
  };
}
