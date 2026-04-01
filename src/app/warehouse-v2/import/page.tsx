'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Breadcrumb, Tabs, Tab } from 'react-bootstrap';
import ImportBatchList from '@/components/warehouse-v2/ImportBatchList';
import CreateBatchForm from '@/components/warehouse-v2/CreateBatchForm';
import ProductListV2 from '@/components/warehouse-v2/ProductListV2';
import ImportInvoicePrint from '@/components/warehouse-v2/ImportInvoicePrint';
import InvoicePrint from '@/components/warehouse-v2/InvoicePrint';
import styles from './import.module.css';

interface ImportBatch {
  BatchID: number;
  BatchCode: string;
  ImportDate: string;
  CategoryID: number;
  CategoryName: string;
  TotalQuantity: number;
  TotalImportValue: number;
  TotalSoldQuantity: number;
  TotalSoldValue: number;
  RemainingQuantity: number;
  ProfitLoss: number;
  Status: string;
  Notes?: string;
  CreatedBy: string;
  CreatedAt: string;
}

const ImportPage: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('batches');
  const [actualProductCount, setActualProductCount] = useState<number>(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceBatch, setInvoiceBatch] = useState<ImportBatch | null>(null);
  const [showProductInvoice, setShowProductInvoice] = useState(false);
  const [productInvoiceData, setProductInvoiceData] = useState<any>(null);

  const handleCreateBatch = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleCreateSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setShowCreateForm(false);
  };

  const handleViewBatchDetails = (batch: ImportBatch) => {
    setSelectedBatch(batch);
    setActiveTab('products');
    fetchActualProductCount(batch.BatchID);
  };

  const handleViewInvoice = (batch: ImportBatch) => {
    setInvoiceBatch(batch);
    setShowInvoice(true);
  };

  const handleCloseInvoice = () => {
    setShowInvoice(false);
    setInvoiceBatch(null);
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

  const handleEditBatch = (batch: ImportBatch) => {
    setRefreshKey((prev) => prev + 1);

    if (selectedBatch && selectedBatch.BatchID === batch.BatchID) {
      fetchActualProductCount(selectedBatch.BatchID);
    }
  };

  const fetchActualProductCount = async (batchId: number) => {
    try {
      const response = await fetch(`/api/products-v2?batchId=${batchId}&limit=1000`);
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

  return (
    <Container fluid className={`py-4 import-page ${styles.importContainer}`}>
      <Row>
        <Col>
          <Breadcrumb className={styles.breadcrumb}>
            <Breadcrumb.Item href="/warehouse-v2">Quản lý kho V2</Breadcrumb.Item>
            <Breadcrumb.Item active>Nhập hàng</Breadcrumb.Item>
          </Breadcrumb>

          <section className={`warehouse-page-header ${styles.pageHeader}`}>
            <div className="warehouse-page-title">
              <span className="warehouse-page-title-icon">
                <i className="fas fa-box-open" aria-hidden="true"></i>
              </span>
              <div>
                <h2 className={styles.pageTitle}>Quản lý nhập hàng</h2>
                <p className={styles.pageSubtitle}>Tạo lô hàng mới, kiểm soát số lượng và theo dõi sản phẩm theo từng lô.</p>
              </div>
            </div>
            <div className="warehouse-page-actions">
              <div className={styles.statusPill}>
                <i className="fas fa-layer-group" aria-hidden="true"></i>
                Đồng bộ theo lô hàng
              </div>
            </div>
          </section>

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'batches')} className={`mb-3 ${styles.tabsContainer}`}>
            <Tab
              eventKey="batches"
              title={
                <span className={styles.tabTitle}>
                  <i className="fas fa-list-check" aria-hidden="true"></i>
                  Danh sách lô hàng
                </span>
              }
            >
              <ImportBatchList
                key={refreshKey}
                onCreateBatch={handleCreateBatch}
                onViewDetails={handleViewBatchDetails}
                onViewInvoice={handleViewInvoice}
                onEditBatch={handleEditBatch}
              />
            </Tab>

            <Tab
              eventKey="products"
              title={
                <span className={styles.tabTitle}>
                  <i className="fas fa-mobile-screen-button" aria-hidden="true"></i>
                  Sản phẩm trong lô
                  {selectedBatch && <span className={`badge bg-primary ${styles.tabBadge}`}>{selectedBatch.BatchCode}</span>}
                </span>
              }
              disabled={!selectedBatch}
            >
              {selectedBatch && (
                <div>
                  <div className={`warehouse-info-panel ${styles.batchInfo}`}>
                    <Row className="g-3">
                      <Col md={3}>
                        <span className="warehouse-stat-label">Mã lô hàng</span>
                        <div className={styles.batchCode}>{selectedBatch.BatchCode}</div>
                      </Col>
                      <Col md={3}>
                        <span className="warehouse-stat-label">Danh mục</span>
                        <div className={styles.categoryName}>{selectedBatch.CategoryName}</div>
                      </Col>
                      <Col md={3}>
                        <span className="warehouse-stat-label">Ngày nhập</span>
                        <div className={styles.batchInfoValue}>{new Date(selectedBatch.ImportDate).toLocaleDateString('vi-VN')}</div>
                      </Col>
                      <Col md={3}>
                        <span className="warehouse-stat-label">Số lượng hiện có</span>
                        <div className={`${styles.statValue} text-success`}>
                          {actualProductCount}
                          {actualProductCount !== selectedBatch.TotalQuantity && (
                            <small className="text-muted ms-2">(Dự kiến: {selectedBatch.TotalQuantity})</small>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <ProductListV2
                    batchId={selectedBatch.BatchID}
                    onProductCountChange={() => fetchActualProductCount(selectedBatch.BatchID)}
                    onPrintInvoice={handlePrintInvoiceFromProduct}
                    batchInfo={{
                      totalQuantity: selectedBatch.TotalQuantity,
                      currentCount: actualProductCount,
                    }}
                  />
                </div>
              )}
            </Tab>
          </Tabs>

          <CreateBatchForm show={showCreateForm} onHide={handleCloseCreateForm} onSuccess={handleCreateSuccess} />

          <ImportInvoicePrint show={showInvoice} onHide={handleCloseInvoice} batchData={invoiceBatch} />

          <InvoicePrint show={showProductInvoice} onHide={handleCloseProductInvoice} invoiceData={productInvoiceData} />
        </Col>
      </Row>
    </Container>
  );
};

export default ImportPage;
