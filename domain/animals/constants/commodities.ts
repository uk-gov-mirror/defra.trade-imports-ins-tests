export const commodities = {
  cow: {
    value: 'Cow',
    display: 'Cow',
    /** GBN-AG trade line description[0] for Bos taurus / domestic cattle (INS aggregated commodity field). */
    lineDescription: 'Live bovine animals',
  },
} as const;

export type Commodity = (typeof commodities)[keyof typeof commodities];
