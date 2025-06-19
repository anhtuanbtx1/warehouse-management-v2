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
    // Find batch info from API or create a mock batch object
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
      Status: 'ACTIVE'
    };

    setSelectedBatch(mockBatch);
    setActiveTab('products');
    fetchActualProductCount(batchCode);
  };

  const fetchActualProductCount = async (batchCode: string) => {
    try {
      // Since we don't have batchId, we'll use batchCode to filter
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
    // Create invoice from product data
    const invoice = {
      invoiceNumber: product.InvoiceNumber || `HD${Date.now()}`,
      saleDate: product.SoldDate || new Date().toISOString(),
      product: {
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        IMEI: product.IMEI,
        ImportPrice: product.ImportPrice,
        SalePrice: product.SalePrice || product.ImportPrice * 1.2,
        CategoryName: product.CategoryName
      },
      customerInfo: product.CustomerInfo ? {
        name: product.CustomerInfo,
        phone: '',
        address: ''
      } : undefined
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
          {/* Breadcrumb */}
          <Breadcrumb>
            <Breadcrumb.Item href="/warehouse-v2">Quản lý kho V2</Breadcrumb.Item>
            <Breadcrumb.Item active>Tồn kho</Breadcrumb.Item>
          </Breadcrumb>

          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <span className="text-info me-2">📦</span>
                Báo cáo tồn kho
              </h2>
              <p className="text-muted mb-0">
                Theo dõi tồn kho, lãi/lỗ và hiệu quả kinh doanh theo từng lô hàng
              </p>
            </div>
          </div>

          {/* Main Content */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'inventory')}
            className="mb-3"
          >
            <Tab eventKey="inventory" title={
              <span>
                <span className="me-2">📊</span>
                Báo cáo tồn kho
              </span>
            }>
              <InventoryReportV2 onViewBatchDetails={handleViewBatchDetails} />
            </Tab>

            <Tab
              eventKey="products"
              title={
                <span>
                  <span className="me-2">📱</span>
                  Sản phẩm trong lô
                  {selectedBatch && (
                    <span className="badge bg-primary ms-2">
                      {selectedBatch.BatchCode}
                    </span>
                  )}
                </span>
              }
              disabled={!selectedBatch}
            >
              {selectedBatch && (
                <div>
                  {/* Batch Info */}
                  <div className="bg-light p-3 rounded mb-3">
                    <Row>
                      <Col md={3}>
                        <strong>Mã lô hàng:</strong>
                        <div className="text-primary">
                          <code>{selectedBatch.BatchCode}</code>
                        </div>
                      </Col>
                      <Col md={3}>
                        <strong>Danh mục:</strong>
                        <div className="text-info">{selectedBatch.CategoryName}</div>
                      </Col>
                      <Col md={3}>
                        <strong>Ngày nhập:</strong>
                        <div>{new Date(selectedBatch.ImportDate).toLocaleDateString('vi-VN')}</div>
                      </Col>
                      <Col md={3}>
                        <strong>Số lượng tồn:</strong>
                        <div className="text-warning fw-bold">
                          {selectedBatch.RemainingQuantity}
                          <small className="text-muted ms-2">
                            (Tổng: {selectedBatch.TotalQuantity})
                          </small>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Products in Batch */}
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

          {/* Product Invoice Print Modal */}
          <InvoicePrint
            show={showProductInvoice}
            onHide={handleCloseProductInvoice}
            invoiceData={productInvoiceData}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default InventoryPage;
