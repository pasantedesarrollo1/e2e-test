import type { forceBusinessType, CashRegisterMode } from './auth.types.js';

export interface TestMetadata {
  ws?: string | string[] | null;
  tes?: string;
  release?: string;
  summary?: string;
  addedToRegression?: string;
  testScope?: string;
}

interface BaseScenario {
  id?: string;
  description: string;
  skip?: boolean;
  skipReason?: string;
  only?: boolean;
  metadata?: TestMetadata;
  authType?: string;
  loginMode?: string;
}

export interface AdminScenario extends BaseScenario {
  fixture: 'admin';
  subsidiaryName?: string;
  subsidiaryCode?: string;
    forceBusinessType?: forceBusinessType;
  dispatchEnabled?: boolean;
  ebillingEnabled?: boolean;
  [key: string]: unknown;
}

export interface PosScenario extends BaseScenario {
  fixture: 'pos';
  subsidiaryName?: string;
  subsidiaryCode?: string;
  openingAmount?: string;
  forceBusinessType: forceBusinessType;
  dispatchEnabled?: boolean;
  cashRegisterMode?: CashRegisterMode;
  [key: string]: unknown;
}

export interface RestaurantSetupOrderOptions {
  productName: string;
  quantity?: number;
  extras?: unknown;
}

export interface RestaurantSetupOptions {
  createOrder?: RestaurantSetupOrderOptions;
}

export interface RestaurantScenario extends BaseScenario {
  fixture: 'restaurant';
  subsidiaryName?: string;
  subsidiaryCode?: string;
  openingAmount?: string;
  chefAuthType?: string;
  restaurantSetupOptions?: RestaurantSetupOptions | null;
  [key: string]: unknown;
}

export type ScenarioDefinition = AdminScenario | PosScenario | RestaurantScenario;

export const isPosScenario = (s: ScenarioDefinition): s is PosScenario => s.fixture === 'pos';
export const isRestaurantScenario = (s: ScenarioDefinition): s is RestaurantScenario => s.fixture === 'restaurant';
export const isAdminScenario = (s: ScenarioDefinition): s is AdminScenario => s.fixture === 'admin';


