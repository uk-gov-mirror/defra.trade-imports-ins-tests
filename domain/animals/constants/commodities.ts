export const commodities = {
  cow: {
    value: 'Cow',
    display: 'Cow',
    /** GBN-AG trade line description[0] for Bos taurus / domestic cattle. */
    lineDescription: 'Live bovine animals',
    /** GBN-AG trade line commonName for Bos taurus / domestic cattle. */
    gbnAgCommonName: 'Domestic cattle',
  },
} as const;

export type Commodity = (typeof commodities)[keyof typeof commodities];
