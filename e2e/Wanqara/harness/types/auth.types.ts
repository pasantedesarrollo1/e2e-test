export type AuthType = 'actor1' | 'actor2' | 'actor3';
export type LoginMode = 'fresh' | 'cached' | '';
export type forceBusinessType = 'Comercios' | 'Restaurante';
export type CashRegisterMode = 'ensure-open' | 'ensure-closed' | 'fresh' | '';

export interface BranchConfig {
  name: string;
  code: string;
}

export type DefaultBranchMap = Record<AuthType, BranchConfig>;
