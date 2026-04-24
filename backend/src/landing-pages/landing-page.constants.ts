export const LANDING_PAGE_STATUSES = ['DRAFT', 'PUBLISHED'] as const;

export type LandingPageStatus = (typeof LANDING_PAGE_STATUSES)[number];
