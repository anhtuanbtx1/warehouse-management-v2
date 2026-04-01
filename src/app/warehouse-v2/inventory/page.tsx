'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Breadcrumb, Tabs, Tab } from 'react-bootstrap';
import InventoryReportV2 from '@/components/warehouse-v2/InventoryReportV2';
import ProductListV2 from '@/components/warehouse-v2/ProductListV2';
import InvoicePrint from '@/components/warehouse-v2/InvoicePrint';

interface InventoryBatch {
  BatchCode: string;
  ImportDate: string;
  CategoryName: string;
  TotalQuantity: number;
  TotalImportValue: number;
  TotalSoldQuantity: number;
  TotalSoldValue: number;
  RemainingQuantity: number;
  ProfitLoss: number;
  Status: string;
}

const InventoryPage: React.FC = () => {
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [actualProductCount, setActualProductCount] = useState<number>(0);
  const [showProductInvoice, setShowProductInvoice] = useState(false);
  const [productInvoiceData, setProductInvoiceData] = useState<any>(null);

  const handleViewBatchDetails = (batchCode: string) => {
    const mockBatch: InventoryBatch = {
      BatchCode: batchCode,
      ImportDate: new Date().toISOString(),
      CategoryName: 'Unknown',
      TotalQuantity: 0,
      TotalImportValue: 0,
      TotalSoldQuantity: 0,
      TotalSoldValue: 0,
      RemainingQuantity: 0,
      ProfitLoss: 0,
      Status: 'ACTIVE',
    };

    setSelectedBatch(mockBatch);
    setActiveTab('products');
    fetchActualProductCount(batchCode);
  };

  const fetchActualProductCount = async (batchCode: string) => {
    try {
      const response = await fetch(`/api/products-v2?batchCode=${batchCode}&limit=1000`);
      const result = await response.json();

      if (result.success && result.data) {
        setActualProductCount(result.data.data.length);
      } else {
        setActualProductCount(0);
      }
    } catch (error) {
      console.error('Error fetching product count:', error);
      setActualProductCount(0);
    }
  };

  const handlePrintInvoiceFromProduct = (product: any) => {
    const invoice = {
      invoiceNumber: product.InvoiceNumber || `HD${Date.now()}`,
      saleDate: product.SoldDate || new Date().toISOString(),
      product: {
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        IMEI: product.IMEI,
        ImportPrice: product.ImportPrice,
        SalePrice: product.SalePrice || product.ImportPrice * 1.2,
        CategoryName: product.CategoryName,
      },
      customerInfo: product.CustomerInfo
        ? {
            name: product.CustomerInfo,
            phone: '',
            address: '',
          }
        : undefined,
    };

    setProductInvoiceData(invoice);
    setShowProductInvoice(true);
  };

  const handleCloseProductInvoice = () => {
    setShowProductInvoice(false);
    setProductInvoiceData(null);
  };

  return (
    <Container fluid className="py-4 inventory-page">
      <Row>
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item href="/warehouse-v2">Quản lý kho V2</Breadcrumb.Item>
            <Breadcrumb.Item active>Tồn kho</Breadcrumb.Item>
          </Breadcrumb>

          <section className="warehouse-page-header">
            <div className="warehouse-page-title">
              <span className="warehouse-page-title-icon">
                <i className="fas fa-warehouse" aria-hidden="true"></i>
              </span>
              <div>
                <h2 className="mb-1">Báo cáo tồn kho</h2>
                <p>Theo dõi số lượng tồn, hiệu quả từng lô hàng và chuyển nhanh sang danh sách sản phẩm chi tiết.</p>
              </div>
            </div>
            <div className="warehouse-page-actions">
              <div className="warehouse-status-chip">
                <span className="warehouse-status-dot"></span>
                Theo dõi trạng thái theo lô
              </div>
            </div>
          </section>

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'inventory')} className="mb-3">
            <Tab
              eventKey="inventory"
              title={
                <span>
                  <i className="fas fa-chart-column me-2" aria-hidden="true"></i>
                  Báo cáo tồn kho
                </span>
              }
            >
              <InventoryReportV2 onViewBatchDetails={handleViewBatchDetails} />
            </Tab>

            <Tab
              eventKey="products"
              title={
                <span>
                  <i className="fas fa-mobile-screen-button me-2" aria-hidden="true"></i>
                  Sản phẩm trong lô
                  {selectedBatch && <span className="badge bg-primary ms-2">{selectedBatch.BatchCode}</span>}
                </span>
              }
              disabled={!selectedBatch}
            >
              {selectedBatch && (
                <div>
                  <div className="warehouse-info-panel mb-3">
                    <Row className="g-3">
                      <Col md={4}>
                        <span className="warehouse-stat-label">Mã lô hàng</span>
                        <div className="warehouse-stat-value">
                          <code>{selectedBatch.BatchCode}</code>
                        </div>
                      </Col>
                      <Col md={4}>
                        <span className="warehouse-stat-label">Ngày nhập</span>
                        <div className="warehouse-stat-value">{new Date(selectedBatch.ImportDate).toLocaleDateString('vi-VN')}</div>
                      </Col>
                      <Col md={4}>
                        <span className="warehouse-stat-label">Số lượng tồn</span>
                        <div className="warehouse-stat-value text-warning">
                          {selectedBatch.RemainingQuantity}
                          <small className="text-muted ms-2">(Tổng: {selectedBatch.TotalQuantity})</small>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <ProductListV2
                    batchCode={selectedBatch.BatchCode}
                    onProductCountChange={() => fetchActualProductCount(selectedBatch.BatchCode)}
                    onPrintInvoice={handlePrintInvoiceFromProduct}
                    showAddButton={false}
                    hideCategoryFilter={true}
                    hideColumns={['actions']}
                  />
                </div>
              )}
            </Tab>
          </Tabs>

          <InvoicePrint show={showProductInvoice} onHide={handleCloseProductInvoice} invoiceData={productInvoiceData} />
        </Col>
      </Row>
    </Container>
  );
};

export default InventoryPage;
