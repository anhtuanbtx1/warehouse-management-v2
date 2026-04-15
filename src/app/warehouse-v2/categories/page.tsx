'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Breadcrumb, Card, Table, Button, Form, Badge, Modal, InputGroup, Alert } from 'react-bootstrap';
import { useToast } from '@/contexts/ToastContext';

interface Category {
  CategoryID: number;
  CategoryName: string;
  Description?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

const CategoryPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    CategoryID: 0,
    CategoryName: '',
    Description: '',
    IsActive: true
  });
  const [errorMsg, setErrorMsg] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories'); // no query param fetches all
      const result = await response.json();

      if (result.success && result.data) {
        setCategories(result.data);
      } else {
        showError('Lỗi', 'Không thể tải danh sách danh mục');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Lỗi kết nối', 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = () => {
    // Current API doesn't support searching by name directly in the backend easily without a param change.
    // Since categories list is usually small, we just filter on frontend.
  };

  const filteredCategories = categories.filter(c => 
    c.CategoryName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.Description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      CategoryID: 0,
      CategoryName: '',
      Description: '',
      IsActive: true
    });
    setErrorMsg('');
  };

  const handleShowAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleShowEdit = (category: Category) => {
    setFormData({
      CategoryID: category.CategoryID,
      CategoryName: category.CategoryName,
      Description: category.Description || '',
      IsActive: category.IsActive
    });
    setErrorMsg('');
    setShowEditModal(true);
  };

  const handleShowDelete = (category: Category) => {
    setFormData({
      CategoryID: category.CategoryID,
      CategoryName: category.CategoryName,
      Description: category.Description || '',
      IsActive: category.IsActive
    });
    setErrorMsg('');
    setShowDeleteModal(true);
  };

  const handleAddCategory = async () => {
    try {
      setActionLoading(true);
      setErrorMsg('');

      if (!formData.CategoryName.trim()) {
        setErrorMsg('Tên danh mục không được để trống');
        return;
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CategoryName: formData.CategoryName,
          Description: formData.Description
        })
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('Thành công', 'Đã thêm danh mục mới');
        setShowAddModal(false);
        fetchCategories();
      } else {
        setErrorMsg(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setErrorMsg('Lỗi kết nối');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCategory = async () => {
    try {
      setActionLoading(true);
      setErrorMsg('');

      if (!formData.CategoryName.trim()) {
        setErrorMsg('Tên danh mục không được để trống');
        return;
      }

      const response = await fetch(`/api/categories/${formData.CategoryID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CategoryName: formData.CategoryName,
          Description: formData.Description,
          IsActive: formData.IsActive
        })
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('Thành công', 'Đã cập nhật danh mục');
        setShowEditModal(false);
        fetchCategories();
      } else {
        setErrorMsg(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setErrorMsg('Lỗi kết nối');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      setActionLoading(true);
      setErrorMsg('');

      const response = await fetch(`/api/categories/${formData.CategoryID}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('Thành công', 'Đã xóa danh mục');
        setShowDeleteModal(false);
        fetchCategories();
      } else {
        setErrorMsg(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setErrorMsg('Lỗi kết nối');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item href="/warehouse-v2">Quản lý kho V2</Breadcrumb.Item>
            <Breadcrumb.Item active>Danh mục</Breadcrumb.Item>
          </Breadcrumb>

          <section className="warehouse-page-header">
            <div className="warehouse-page-title">
              <span className="warehouse-page-title-icon">
                <i className="fas fa-tags" aria-hidden="true"></i>
              </span>
              <div>
                <h2 className="mb-1">Quản lý danh mục</h2>
                <p>Danh sách các loại sản phẩm đang được kinh doanh và quản lý trong hệ thống.</p>
              </div>
            </div>
            <div className="warehouse-page-actions">
              <Button variant="success" onClick={handleShowAdd} className="d-flex align-items-center shadow-sm">
                <i className="fas fa-plus me-2"></i> Thêm danh mục
              </Button>
            </div>
          </section>

          <Card className="shadow-sm border-0 mt-4">
            <Card.Header className="d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 fw-bold">
                <i className="fas fa-list me-2 text-primary"></i>Danh sách danh mục
              </h5>
              <div className="w-25">
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Tìm danh mục..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="primary" className="d-flex align-items-center justify-content-center">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table responsive striped hover className="mb-0">
                  <thead>
                    <tr>
                      <th className="px-4 text-nowrap">ID</th>
                      <th className="text-nowrap">Tên danh mục</th>
                      <th className="text-nowrap">Mô tả</th>
                      <th className="text-center text-nowrap">Ngày tạo</th>
                      <th className="text-center text-nowrap">Trạng thái</th>
                      <th className="text-center text-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted">
                          Không tìm thấy danh mục nào
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((category) => (
                        <tr key={category.CategoryID} className="align-middle">
                          <td className="px-4 fw-medium text-muted">#{category.CategoryID}</td>
                          <td><strong>{category.CategoryName}</strong></td>
                          <td className="text-muted">{category.Description || <span className="fst-italic opacity-50">Không có mô tả</span>}</td>
                          <td className="text-center">{formatDate(category.CreatedAt)}</td>
                          <td className="text-center">
                            {category.IsActive ? (
                              <Badge bg="success" className="bg-opacity-75 rounded-pill px-3">Hoạt động</Badge>
                            ) : (
                              <Badge bg="secondary" className="rounded-pill px-3">Bị khóa</Badge>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-2">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowEdit(category)}
                                title="Chỉnh sửa danh mục"
                                className="d-inline-flex align-items-center justify-content-center"
                                style={{ width: '32px', height: '32px' }}
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleShowDelete(category)}
                                title="Xóa danh mục"
                                className="d-inline-flex align-items-center justify-content-center"
                                style={{ width: '32px', height: '32px' }}
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title><i className="fas fa-plus-circle text-success me-2"></i>Thêm danh mục mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Tên danh mục <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Ví dụ: Điện thoại di động" 
                value={formData.CategoryName} 
                onChange={(e) => setFormData({...formData, CategoryName: e.target.value})}
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Mô tả</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="Ghi chú thêm về danh mục này..." 
                value={formData.Description} 
                onChange={(e) => setFormData({...formData, Description: e.target.value})}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={actionLoading}>Hủy</Button>
          <Button variant="success" onClick={handleAddCategory} disabled={actionLoading}>
            {actionLoading ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-save me-2"></i>}
            Lưu danh mục
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title><i className="fas fa-edit text-primary me-2"></i>Chỉnh sửa danh mục</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Tên danh mục <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                value={formData.CategoryName} 
                onChange={(e) => setFormData({...formData, CategoryName: e.target.value})}
                autoFocus
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Mô tả</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                value={formData.Description} 
                onChange={(e) => setFormData({...formData, Description: e.target.value})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check 
                type="switch"
                id="active-switch"
                label={formData.IsActive ? "Đang hoạt động" : "Bị khóa"}
                checked={formData.IsActive}
                onChange={(e) => setFormData({...formData, IsActive: e.target.checked})}
                className={formData.IsActive ? "text-success fw-medium" : "text-muted"}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={actionLoading}>Hủy</Button>
          <Button variant="primary" onClick={handleEditCategory} disabled={actionLoading}>
            {actionLoading ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-save me-2"></i>}
            Cập nhật
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} backdrop="static" centered>
        <Modal.Header closeButton className="border-0 pb-0">
        </Modal.Header>
        <Modal.Body className="text-center pt-0 pb-4">
          <div className="mb-4">
            <i className="fas fa-exclamation-triangle text-danger" style={{ fontSize: '4rem' }}></i>
          </div>
          <h4 className="mb-3">Xóa danh mục này?</h4>
          <p className="text-muted mb-4">
            Bạn có chắc chắn muốn xóa danh mục <strong>{formData.CategoryName}</strong>?<br/>
            Hành động này không thể hoàn tác. Nếu danh mục đang có sản phẩm, bạn sẽ không thể xóa mà chỉ có thể khóa nó.
          </p>
          {errorMsg && <Alert variant="danger" className="text-start">{errorMsg}</Alert>}
          <div className="d-flex justify-content-center gap-3 mt-4">
            <Button variant="light" className="px-4" onClick={() => setShowDeleteModal(false)} disabled={actionLoading}>
              Hủy bỏ
            </Button>
            <Button variant="danger" className="px-4" onClick={handleDeleteCategory} disabled={actionLoading}>
              {actionLoading ? <i className="fas fa-spinner fa-spin me-2"></i> : <i className="fas fa-trash me-2"></i>}
              Xác nhận xóa
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CategoryPage;
