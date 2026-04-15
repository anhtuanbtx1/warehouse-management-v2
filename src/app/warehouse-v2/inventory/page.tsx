'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Breadcrumb, Tabs, Tab, Card } from 'react-bootstrap';
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

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'inventory')} className="mb-4" variant="pills">
            <Tab
              eventKey="inventory"
              title={
                <span className="px-2">
                  <i className="fas fa-chart-column me-2" aria-hidden="true"></i>
                  Báo cáo tồn kho
                </span>
              }
            >
              <div className="mt-3">
                <InventoryReportV2 onViewBatchDetails={handleViewBatchDetails} />
              </div>
            </Tab>

            <Tab
              eventKey="products"
              title={
                <span className="px-2">
                  <i className="fas fa-mobile-screen-button me-2" aria-hidden="true"></i>
                  Sản phẩm trong lô
                  {selectedBatch && <span className="badge bg-primary ms-2 rounded-pill px-2">{selectedBatch.BatchCode}</span>}
                </span>
              }
              disabled={!selectedBatch}
            >
              {selectedBatch && (
                <div className="mt-3">
                  <Row className="g-3 mb-4">
                    <Col md={4}>
                      <Card className="h-100 shadow-sm border-0 bg-primary bg-opacity-10">
                        <Card.Body className="p-3 d-flex align-items-center">
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                            <i className="fas fa-boxes fa-lg"></i>
                          </div>
                          <div>
                            <span className="text-muted small fw-medium d-block mb-1">Mã lô hàng</span>
                            <div className="fs-5 fw-bold text-primary text-break lh-1">
                              {selectedBatch.BatchCode}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="h-100 shadow-sm border-0 bg-light">
                        <Card.Body className="p-3 d-flex align-items-center">
                          <div className="rounded-circle bg-secondary bg-opacity-25 text-secondary d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                            <i className="fas fa-calendar-alt fa-lg"></i>
                          </div>
                          <div>
                            <span className="text-muted small fw-medium d-block mb-1">Ngày nhập</span>
                            <div className="fs-5 fw-bold text-dark lh-1">
                              {new Date(selectedBatch.ImportDate).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="h-100 shadow-sm border-0 bg-warning bg-opacity-10">
                        <Card.Body className="p-3 d-flex align-items-center">
                          <div className="rounded-circle bg-warning text-white d-flex align-items-center justify-content-center me-3" style={{ width: '48px', height: '48px' }}>
                            <i className="fas fa-cubes fa-lg"></i>
                          </div>
                          <div>
                            <span className="text-muted small fw-medium d-block mb-1">Số lượng tồn</span>
                            <div className="fs-5 fw-bold text-warning lh-1">
                              {selectedBatch.RemainingQuantity}
                              <small className="text-muted ms-2 fs-6 fw-normal">(Tổng: {selectedBatch.TotalQuantity})</small>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

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
