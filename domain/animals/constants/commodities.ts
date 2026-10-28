export const commodities = {
  cow: {
    value: 'Cow',
    display: 'Cow',
  },
  cat: {
    value: 'Cat',
    display: 'Cat',
  },
} as const;

export type Commodity = (typeof commodities)[keyof typeof commodities];
