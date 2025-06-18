'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Breadcrumb, Tabs, Tab } from 'react-bootstrap';
import ImportBatchList from '@/components/warehouse-v2/ImportBatchList';
import CreateBatchForm from '@/components/warehouse-v2/CreateBatchForm';
import ProductListV2 from '@/components/warehouse-v2/ProductListV2';

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

  const handleCreateBatch = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setShowCreateForm(false);
  };

  const handleViewBatchDetails = (batch: ImportBatch) => {
    setSelectedBatch(batch);
    setActiveTab('products');
    fetchActualProductCount(batch.BatchID);
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
    <Container fluid className="py-4">
      <Row>
        <Col>
          {/* Breadcrumb */}
          <Breadcrumb>
            <Breadcrumb.Item href="/warehouse-v2">Quản lý kho V2</Breadcrumb.Item>
            <Breadcrumb.Item active>Nhập hàng</Breadcrumb.Item>
          </Breadcrumb>

          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-arrow-down text-primary me-2"></i>
                Quản lý nhập hàng
              </h2>
              <p className="text-muted mb-0">
                Tạo lô hàng mới và quản lý sản phẩm theo từng lô
              </p>
            </div>
          </div>

          {/* Main Content */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'batches')}
            className="mb-3"
          >
            <Tab eventKey="batches" title={
              <span>
                <i className="fas fa-boxes me-2"></i>
                Danh sách lô hàng
              </span>
            }>
              <ImportBatchList
                key={refreshKey}
                onCreateBatch={handleCreateBatch}
                onViewDetails={handleViewBatchDetails}
              />
            </Tab>

            <Tab 
              eventKey="products" 
              title={
                <span>
                  <i className="fas fa-mobile-alt me-2"></i>
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
                        <strong>Tổng số lượng:</strong>
                        <div className="text-success fw-bold">
                          {actualProductCount}
                          {actualProductCount !== selectedBatch.TotalQuantity && (
                            <small className="text-muted ms-2">
                              (Dự kiến: {selectedBatch.TotalQuantity})
                            </small>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Products in Batch */}
                  <ProductListV2
                    batchId={selectedBatch.BatchID}
                    onProductCountChange={() => fetchActualProductCount(selectedBatch.BatchID)}
                  />
                </div>
              )}
            </Tab>
          </Tabs>

          {/* Create Batch Form Modal */}
          <CreateBatchForm
            show={showCreateForm}
            onHide={handleCloseCreateForm}
            onSuccess={handleCreateSuccess}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default ImportPage;
