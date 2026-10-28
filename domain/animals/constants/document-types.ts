export const documentTypes = {
  itahc: 'ITAHC',
  veterinaryHealthCertificate: 'VETERINARY_HEALTH_CERTIFICATE',
} as const;

export type DocumentType = (typeof documentTypes)[keyof typeof documentTypes];

export const DOCUMENT_TYPE_SELECT_TEXT = 'Select one';

export const OFFERED_DOCUMENT_TYPE_LABELS = [
  'Intra Trade Animal Health Certificate (ITAHC)',
  'Veterinary health certificate',
  'Air waybill',
  'Import permit',
  'Letter of authority (Directive 2008/61/EC)',
  'Commercial invoice',
  'Sea waybill',
  'Rail waybill',
  'Bill of lading',
  'Catch certificate',
  'Laboratory sampling results for aflatoxin (Reg 2019/1793)',
  'Journey log',
  'Other',
];
