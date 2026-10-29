export type CommoditySpecies = {
  searchTerm: string;
  commodityCode: string;
  latinName: string;
};

export const commoditySpecies = {
  cattle: { searchTerm: 'Bos taurus', commodityCode: '0102', latinName: 'Bos taurus' },
  bison: { searchTerm: 'Bison bison', commodityCode: '0102', latinName: 'Bison bison' },
  horse: { searchTerm: 'horse', commodityCode: '0101', latinName: 'Equus cabalus' },
  domesticCat: { searchTerm: 'domestic cat', commodityCode: '01061900', latinName: 'Felis catus' },
  domesticDog: { searchTerm: 'dog', commodityCode: '01061900', latinName: 'Canis familiaris' },
  ostrich: { searchTerm: 'ostrich', commodityCode: '01063300', latinName: 'Struthio' },
} as const satisfies Record<string, CommoditySpecies>;
