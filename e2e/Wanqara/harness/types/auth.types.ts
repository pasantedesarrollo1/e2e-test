export type AuthType = 'actor1' | 'actor2' | 'actor3';
export type LoginMode = 'fresh' | 'cached' | '';
export type BusinessType = 'Restaurante' | 'Retail' | 'Comercios';
export type CashRegisterMode = 'ensure-open' | 'ensure-closed' | 'fresh' | '';

export interface BranchConfig {
  name: string;
  code: string;
}

export type DefaultBranchMap = Record<AuthType, BranchConfig>;
