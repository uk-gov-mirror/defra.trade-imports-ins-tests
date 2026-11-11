export type AggregatedNotificationDocument = {
  _id: string;
  aggregateVersion: number;
  organisationId?: string;
  referenceNumber?: string;
  status?: string;
  originCountry?: string;
  commodity?: string;
  arrivalDate?: string;
  lastUpdated?: Date;
};
