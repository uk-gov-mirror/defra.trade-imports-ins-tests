export const dashboardSortValues = {
  arrivalNewestFirst: 'Arrival date (newest first)',
  arrivalOldestFirst: 'Arrival date (oldest first)',
  updatedNewestFirst: 'Last updated (newest first)',
  updatedOldestFirst: 'Last updated (oldest first)',
} as const;

export type DashboardSortValue = (typeof dashboardSortValues)[keyof typeof dashboardSortValues];
