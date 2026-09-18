import type { BusinessType, CashRegisterMode } from './auth.types.js';

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
  [key: string]: unknown;
}

export interface PosScenario extends BaseScenario {
  fixture: 'pos';
  subsidiaryName?: string;
  subsidiaryCode?: string;
  openingAmount?: string;
  businessType?: BusinessType;
  dispatchEnabled?: boolean;
  cashRegisterMode?: CashRegisterMode;
  [key: string]: unknown;
}

export interface StageSetupOrderOptions {
  productName: string;
  quantity?: number;
  extras?: unknown;
}

export interface StageSetupOptions {
  createOrder?: StageSetupOrderOptions;
}

export interface StageScenario extends BaseScenario {
  fixture: 'stage';
  subsidiaryName?: string;
  subsidiaryCode?: string;
  openingAmount?: string;
  chefAuthType?: string;
  stageSetupOptions?: StageSetupOptions | null;
  [key: string]: unknown;
}

export type ScenarioDefinition = AdminScenario | PosScenario | StageScenario;

export const isPosScenario = (s: ScenarioDefinition): s is PosScenario => s.fixture === 'pos';
export const isStageScenario = (s: ScenarioDefinition): s is StageScenario => s.fixture === 'stage';
export const isAdminScenario = (s: ScenarioDefinition): s is AdminScenario => s.fixture === 'admin';


