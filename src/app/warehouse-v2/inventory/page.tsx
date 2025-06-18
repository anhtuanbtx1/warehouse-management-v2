'use client';

import React from 'react';
import { Container, Row, Col, Breadcrumb } from 'react-bootstrap';
import InventoryReportV2 from '@/components/warehouse-v2/InventoryReportV2';

const InventoryPage: React.FC = () => {
  const handleViewBatchDetails = (batchCode: string) => {
    // TODO: Implement batch details view
    console.log('View batch details:', batchCode);
    // Could navigate to a detailed view or open a modal
  };

  return (
    <Container fluid className="py-4">
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
                <i className="fas fa-warehouse text-info me-2"></i>
                Báo cáo tồn kho
              </h2>
              <p className="text-muted mb-0">
                Theo dõi tồn kho, lãi/lỗ và hiệu quả kinh doanh theo từng lô hàng
              </p>
            </div>
          </div>

          {/* Inventory Report */}
          <InventoryReportV2 onViewBatchDetails={handleViewBatchDetails} />
        </Col>
      </Row>
    </Container>
  );
};

export default InventoryPage;
