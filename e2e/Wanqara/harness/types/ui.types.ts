import type { Locator, Page } from '@playwright/test';

export interface SelectDropdownOptions {
  triggerLocator: Locator;
  optionText?: string | RegExp | null;
  timeout?: number;
  retryTimeout?: number;
}

export interface ApiWaitOptions {
  endpoint: string | RegExp;
  method?: string;
  status?: number | number[];
}

export interface DeleteRecordOptions {
  searchName: string;
  endpointPattern: string | RegExp;
  confirmButtonRegex?: RegExp;
  successMessage?: string | RegExp;
  deleteTooltip?: string;
}

export interface SaveFormOptions {
  endpointPattern: string | RegExp;
  successMessage?: string | RegExp;
}

export interface VerifyRecordOptions {
  searchName: string;
}

export interface EnsureCleanRecordOptions {
  listPath: string;
  addPath: string;
  name: string;
  fillForm: (page: Page) => Promise<void>;
  endpointPattern: string | RegExp;
  successMessage?: string | RegExp;
  confirmButtonRegex?: RegExp;
  deleteSuccessMessage?: string | RegExp;
  deleteTooltip?: string;
}
