/**
 * Constantes de timeout centralizadas para el framework Wanqara E2E.
 * Modifica aquí para afectar todos los helpers y fixtures simultáneamente.
 */
export const TIMEOUTS = {
  OVERLAY: 5000,
  DROPDOWN_INITIAL: 3000,
  DROPDOWN_RETRY: 5000,
  SNACKBAR: 15000,
  NAV_READY: 15000,
  SESSION_WATCHDOG: 60000,
  STAGE_FIXTURE_HEADROOM_MS: 120000,
  FIXTURE_HEADROOM_MS: 60000,
} as const;
