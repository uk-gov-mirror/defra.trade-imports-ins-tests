import { commodities } from '@domain/animals/constants/commodities';

export const commoditySpecies = {
  bosTaurus: { value: '1148346', display: 'Bos taurus', commodity: commodities.cow },
  felisCatus: { value: '923501', display: 'Felis catus', commodity: commodities.cat },
} as const;

export type CommoditySpecies = (typeof commoditySpecies)[keyof typeof commoditySpecies];
