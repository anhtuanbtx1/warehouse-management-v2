// Type definitions for warehouse management system

export interface Category {
  CategoryID: number;
  CategoryName: string;
  Description?: string;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface Unit {
  UnitID: number;
  UnitName: string;
  UnitSymbol: string;
  IsActive: boolean;
}

export interface Product {
  ProductID: number;
  ProductCode: string;
  ProductName: string;
  CategoryID: number;
  UnitID: number;
  Description?: string;
  CostPrice: number;
  SalePrice: number;
  MinStock: number;
  MaxStock: number;
  ImageUrl?: string;
  Barcode?: string;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
  // Relations
  Category?: Category;
  Unit?: Unit;
}

export interface Supplier {
  SupplierID: number;
  SupplierCode: string;
  SupplierName: string;
  ContactPerson?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  TaxCode?: string;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface Customer {
  CustomerID: number;
  CustomerCode: string;
  CustomerName: string;
  ContactPerson?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
  TaxCode?: string;
  CustomerType: 'RETAIL' | 'WHOLESALE';
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface Warehouse {
  WarehouseID: number;
  WarehouseCode: string;
  WarehouseName: string;
  Address?: string;
  ManagerName?: string;
  Phone?: string;
  IsActive: boolean;
  CreatedAt: Date;
}

export interface ImportOrder {
  ImportOrderID: number;
  ImportOrderCode: string;
  SupplierID: number;
  WarehouseID: number;
  ImportDate: Date;
  TotalAmount: number;
  TaxAmount: number;
  DiscountAmount: number;
  FinalAmount: number;
  Status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  Notes?: string;
  CreatedBy: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  // Relations
  Supplier?: Supplier;
  Warehouse?: Warehouse;
  Details?: ImportOrderDetail[];
}

export interface ImportOrderDetail {
  ImportOrderDetailID: number;
  ImportOrderID: number;
  ProductID: number;
  Quantity: number;
  UnitPrice: number;
  TotalPrice: number;
  ExpiryDate?: Date;
  BatchNumber?: string;
  Notes?: string;
  // Relations
  Product?: Product;
}

export interface ExportOrder {
  ExportOrderID: number;
  ExportOrderCode: string;
  CustomerID: number;
  WarehouseID: number;
  ExportDate: Date;
  TotalAmount: number;
  TaxAmount: number;
  DiscountAmount: number;
  FinalAmount: number;
  Status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  PaymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  Notes?: string;
  CreatedBy: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  // Relations
  Customer?: Customer;
  Warehouse?: Warehouse;
  Details?: ExportOrderDetail[];
}

export interface ExportOrderDetail {
  ExportOrderDetailID: number;
  ExportOrderID: number;
  ProductID: number;
  Quantity: number;
  UnitPrice: number;
  TotalPrice: number;
  BatchNumber?: string;
  Notes?: string;
  // Relations
  Product?: Product;
}

export interface Inventory {
  InventoryID: number;
  ProductID: number;
  WarehouseID: number;
  CurrentStock: number;
  ReservedStock: number;
  AvailableStock: number;
  LastUpdated: Date;
  // Relations
  Product?: Product;
  Warehouse?: Warehouse;
}

export interface StockMovement {
  MovementID: number;
  ProductID: number;
  WarehouseID: number;
  MovementType: 'IMPORT' | 'EXPORT' | 'ADJUSTMENT';
  ReferenceType?: 'IMPORT_ORDER' | 'EXPORT_ORDER' | 'ADJUSTMENT';
  ReferenceID?: number;
  Quantity: number;
  UnitPrice?: number;
  PreviousStock?: number;
  NewStock?: number;
  MovementDate: Date;
  Notes?: string;
  CreatedBy?: string;
  // Relations
  Product?: Product;
  Warehouse?: Warehouse;
}

export interface User {
  UserID: number;
  Username: string;
  Email: string;
  PasswordHash: string;
  FullName: string;
  Role: 'ADMIN' | 'MANAGER' | 'USER';
  IsActive: boolean;
  LastLogin?: Date;
  CreatedAt: Date;
  UpdatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Report types
export interface InventoryReport {
  ProductCode: string;
  ProductName: string;
  CategoryName: string;
  UnitName: string;
  WarehouseName: string;
  CurrentStock: number;
  ReservedStock: number;
  AvailableStock: number;
  MinStock: number;
  MaxStock: number;
  StockStatus: 'LOW_STOCK' | 'OVER_STOCK' | 'NORMAL';
  LastUpdated: Date;
}

export interface RevenueReport {
  ExportDate: Date;
  TotalOrders: number;
  TotalRevenue: number;
  FinalRevenue: number;
  GrossProfit: number;
}

export interface TopSellingProduct {
  ProductCode: string;
  ProductName: string;
  CategoryName: string;
  TotalSold: number;
  TotalRevenue: number;
  OrderCount: number;
}

// Form types
export interface ProductForm {
  ProductCode: string;
  ProductName: string;
  CategoryID: number;
  UnitID: number;
  Description?: string;
  CostPrice: number;
  SalePrice: number;
  MinStock: number;
  MaxStock: number;
  ImageUrl?: string;
  Barcode?: string;
}

export interface ImportOrderForm {
  SupplierID: number;
  WarehouseID: number;
  ImportDate: Date;
  TaxAmount: number;
  DiscountAmount: number;
  Notes?: string;
  Details: ImportOrderDetailForm[];
}

export interface ImportOrderDetailForm {
  ProductID: number;
  Quantity: number;
  UnitPrice: number;
  ExpiryDate?: Date;
  BatchNumber?: string;
  Notes?: string;
}

export interface ExportOrderForm {
  CustomerID: number;
  WarehouseID: number;
  ExportDate: Date;
  TaxAmount: number;
  DiscountAmount: number;
  Notes?: string;
  Details: ExportOrderDetailForm[];
}

export interface ExportOrderDetailForm {
  ProductID: number;
  Quantity: number;
  UnitPrice: number;
  BatchNumber?: string;
  Notes?: string;
}
