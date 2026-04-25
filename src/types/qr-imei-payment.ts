export interface ProductLookupRecord {
  ProductID: number;
  ProductName: string;
  ProductCode?: string;
  IMEI: string;
  Status: string;
  IsSaleReady: boolean;
  SalePrice?: number;
}
