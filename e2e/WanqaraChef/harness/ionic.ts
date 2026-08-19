import type { Locator, Page } from '@playwright/test';

/**
 * Active view inside ion-router-outlet. Ionic keeps prior routes mounted with
 * .ion-page-hidden / .ion-page-invisible; those still match getByTestId.
 */
export function activeIonPage(page: Page): Locator {
  return page
    .locator(
      'ion-router-outlet .ion-page:not(.ion-page-hidden):not(.ion-page-invisible)',
    )
    .last();
}

/** testid inside the active router page (tables-hub, forms). */
export function pageTestId(page: Page, testId: string): Locator {
  return activeIonPage(page).getByTestId(testId);
}

/**
 * Visible testid anywhere (layout chrome outside the outlet, e.g. menu button).
 * Use .first() because Ionic may leave transitional duplicates briefly.
 */
export function visibleTestId(page: Page, testId: string): Locator {
  return page.getByTestId(testId).filter({ visible: true }).first();
}
