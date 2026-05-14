import { executeQuery } from '@/lib/database';

export type ProductAction = 'SELL' | 'UPDATE' | 'DELETE' | 'IMPORT';

export async function ensureProductActivityTable() {
  await executeQuery(`
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'CRM_ProductActivityLogs') AND type in (N'U'))
    BEGIN
      CREATE TABLE CRM_ProductActivityLogs (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        ProductID INT NULL,
        ProductName NVARCHAR(255) NULL,
        IMEI NVARCHAR(50) NULL,
        ActionType NVARCHAR(20) NOT NULL,
        Description NVARCHAR(1000) NULL,
        Amount DECIMAL(18,2) NULL,
        PerformedBy NVARCHAR(100) NULL,
        PerformedAt DATETIME2 DEFAULT GETDATE()
      )
      CREATE INDEX IX_CRM_ProductActivityLogs_PerformedAt ON CRM_ProductActivityLogs(PerformedAt DESC)
      CREATE INDEX IX_CRM_ProductActivityLogs_ActionType ON CRM_ProductActivityLogs(ActionType)
      CREATE INDEX IX_CRM_ProductActivityLogs_IMEI ON CRM_ProductActivityLogs(IMEI)
    END
  `);
}

export async function logProductActivity(payload: {
  productId?: number | null;
  productName?: string | null;
  imei?: string | null;
  actionType: ProductAction;
  description?: string | null;
  amount?: number | null;
  performedBy?: string | null;
}) {
  await ensureProductActivityTable();
  await executeQuery(
    `INSERT INTO CRM_ProductActivityLogs (ProductID, ProductName, IMEI, ActionType, Description, Amount, PerformedBy, PerformedAt)
     VALUES (@productId, @productName, @imei, @actionType, @description, @amount, @performedBy, GETDATE())`,
    {
      productId: payload.productId ?? null,
      productName: payload.productName ?? null,
      imei: payload.imei ?? null,
      actionType: payload.actionType,
      description: payload.description ?? null,
      amount: payload.amount ?? null,
      performedBy: payload.performedBy ?? 'system',
    }
  );
}
