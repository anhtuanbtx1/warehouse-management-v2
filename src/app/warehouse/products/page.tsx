'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Breadcrumb } from 'react-bootstrap';
import ProductList from '@/components/warehouse/ProductList';
import ProductForm from '@/components/warehouse/ProductForm';
import { Product } from '@/types/warehouse';

const ProductsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProduct(null);
  };

  const handleSaveProduct = () => {
    setRefreshKey(prev => prev + 1);
    handleCloseForm();
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          {/* Breadcrumb */}
          <Breadcrumb>
            <Breadcrumb.Item href="/warehouse">Quản lý kho</Breadcrumb.Item>
            <Breadcrumb.Item active>Sản phẩm</Breadcrumb.Item>
          </Breadcrumb>

          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Quản lý sản phẩm</h2>
              <p className="text-muted mb-0">
                Quản lý thông tin sản phẩm, danh mục và giá cả
              </p>
            </div>
          </div>

          {/* Product List */}
          <ProductList
            key={refreshKey}
            onAdd={handleAddProduct}
            onEdit={handleEditProduct}
          />

          {/* Product Form Modal */}
          <ProductForm
            show={showForm}
            onHide={handleCloseForm}
            onSave={handleSaveProduct}
            product={selectedProduct}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default ProductsPage;
