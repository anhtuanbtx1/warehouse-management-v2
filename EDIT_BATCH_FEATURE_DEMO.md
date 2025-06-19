# ✏️ Demo: Tính Năng Sửa Lô Hàng

## 🎯 Tính Năng Đã Triển Khai

### ✨ **Button "Sửa" Lô Hàng**
- **Vị trí**: Cột "Thao tác" trong bảng danh sách lô hàng
- **Icon**: ✏️ (edit icon)
- **Màu sắc**: Outline info (xanh dương)
- **Tooltip**: "Chỉnh sửa lô hàng"

### 📊 **Layout Thao Tác Mới:**
```
[✏️ Sửa] [👁️ Chi tiết] [🧾 Xem HĐ] [📊 Excel]
```

## 🔧 **Technical Implementation**

### **📦 Component Updates:**

#### **1. ImportBatchList.tsx:**
```typescript
// New Interface
interface ImportBatchListProps {
  onCreateBatch?: () => void;
  onViewDetails?: (batch: ImportBatch) => void;
  onViewInvoice?: (batch: ImportBatch) => void;
  onEditBatch?: (batch: ImportBatch) => void;  // ← NEW
}

// New States
const [showEditModal, setShowEditModal] = useState(false);
const [editingBatch, setEditingBatch] = useState<ImportBatch | null>(null);
const [editLoading, setEditLoading] = useState(false);
const [editForm, setEditForm] = useState({
  CategoryID: '',
  TotalQuantity: '',
  Notes: ''
});

// New Button with onClick
<Button
  variant="outline-info"
  onClick={() => handleEditBatch(batch)}
  title="Chỉnh sửa lô hàng"
  className="btn-compact flex-fill"
>
  <span className="me-1">✏️</span>
  Sửa
</Button>
```

#### **2. Edit Modal Features:**
```typescript
// Modal với form validation
<Modal show={showEditModal} onHide={handleCloseEditModal} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>
      <span className="me-2">✏️</span>
      Chỉnh sửa lô hàng
      {editingBatch && (
        <small className="text-muted ms-2">({editingBatch.BatchCode})</small>
      )}
    </Modal.Title>
  </Modal.Header>
  
  // Form fields:
  // - Mã lô hàng (disabled - không thể sửa)
  // - Ngày nhập (disabled - không thể sửa)
  // - Danh mục (dropdown - có thể sửa)
  // - Tổng số lượng (input với format - có thể sửa)
  // - Ghi chú (textarea - có thể sửa)
  
  // Current stats display
  // - Tổng nhập, Đã bán, Còn lại, Lãi/Lỗ
</Modal>
```

### **🌐 API Implementation:**

#### **📍 New API Endpoint:** `/api/import-batches/[id]/route.ts`
```typescript
// PUT update batch
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // Validation:
  // - CategoryID and TotalQuantity required
  // - TotalQuantity must be > 0
  // - TotalQuantity must be >= current product count
  
  // Update query:
  UPDATE CRM_ImportBatches 
  SET 
    CategoryID = @CategoryID,
    TotalQuantity = @TotalQuantity,
    Notes = @Notes,
    UpdatedAt = GETDATE()
  WHERE BatchID = @batchId
  
  // Return updated batch with calculated stats
}

// GET single batch (for future use)
// DELETE batch (with validation - no products)
```

#### **🔧 Validation Rules:**
```typescript
// Business Logic Validation:
1. CategoryID và TotalQuantity bắt buộc
2. TotalQuantity phải là số dương
3. TotalQuantity không được nhỏ hơn số sản phẩm hiện có
4. Không thể sửa BatchCode và ImportDate
5. Kiểm tra batch tồn tại trước khi update

// Database Constraints:
- Foreign key constraint với CRM_Categories
- Data type validation
- Concurrent update protection
```

### **📱 UI/UX Features:**

#### **🎨 Form Design:**
```typescript
// Smart Form Features:
1. **Number Formatting**: Tự động format số với dấu chấm (100.000)
2. **Validation Feedback**: Real-time validation với error messages
3. **Current Stats Display**: Hiển thị thống kê hiện tại của lô
4. **Disabled Fields**: Các field không thể sửa được disable và highlight
5. **Loading State**: Button loading khi đang save
6. **Toast Notifications**: Thông báo thành công/lỗi

// Form Layout:
Row 1: [Mã lô hàng (disabled)] [Ngày nhập (disabled)]
Row 2: [Danh mục (dropdown)] [Tổng số lượng (formatted input)]
Row 3: [Ghi chú (textarea - full width)]
Row 4: [Thống kê hiện tại (info panel)]
```

#### **📊 Current Stats Panel:**
```typescript
// Real-time Statistics Display:
<div className="bg-light p-3 rounded">
  <h6 className="fw-bold mb-2">📊 Thống kê hiện tại:</h6>
  <div className="row">
    <div className="col-md-3">
      <small className="text-muted">Tổng nhập:</small>
      <div className="fw-bold">{editingBatch.TotalQuantity}</div>
    </div>
    <div className="col-md-3">
      <small className="text-muted">Đã bán:</small>
      <div className="fw-bold text-success">{editingBatch.TotalSoldQuantity}</div>
    </div>
    <div className="col-md-3">
      <small className="text-muted">Còn lại:</small>
      <div className="fw-bold text-warning">{editingBatch.RemainingQuantity}</div>
    </div>
    <div className="col-md-3">
      <small className="text-muted">Lãi/Lỗ:</small>
      <div className={`fw-bold ${getProfitLossColor(editingBatch.ProfitLoss)}`}>
        {formatCurrency(editingBatch.ProfitLoss)}
      </div>
    </div>
  </div>
</div>
```

## 🧪 **Test Cases**

### **Test 1: Button Visibility & Click**
1. Truy cập `/warehouse-v2/import`
2. Tab "Danh sách lô hàng"
3. ✅ **Expected**: Thấy button "✏️ Sửa" trong mỗi row
4. Click button "✏️ Sửa"
5. ✅ **Expected**: Modal "Chỉnh sửa lô hàng" mở ra

### **Test 2: Form Pre-population**
1. Click "✏️ Sửa" trên lô hàng bất kỳ
2. ✅ **Expected**: 
   - Mã lô hàng: Hiển thị và disabled
   - Ngày nhập: Hiển thị và disabled
   - Danh mục: Pre-selected đúng category
   - Tổng số lượng: Hiển thị số hiện tại với format
   - Ghi chú: Hiển thị ghi chú hiện tại

### **Test 3: Validation Rules**
1. Thử xóa danh mục → ✅ **Expected**: Error "Vui lòng điền đầy đủ thông tin"
2. Thử nhập số lượng = 0 → ✅ **Expected**: Error "Tổng số lượng phải là số dương"
3. Thử giảm số lượng xuống dưới số sản phẩm hiện có → ✅ **Expected**: Error validation

### **Test 4: Successful Update**
1. Sửa danh mục từ "iPhone 15" → "iPhone 16"
2. Tăng số lượng từ 10 → 15
3. Thêm ghi chú: "Cập nhật số lượng"
4. Click "💾 Lưu thay đổi"
5. ✅ **Expected**: 
   - Toast "Cập nhật thành công!"
   - Modal đóng
   - Danh sách refresh với dữ liệu mới

### **Test 5: Number Formatting**
1. Nhập "1000000" trong field Tổng số lượng
2. ✅ **Expected**: Tự động format thành "1.000.000"
3. Save và verify API nhận đúng số 1000000

### **Test 6: Current Stats Display**
1. Mở modal edit cho lô có sản phẩm đã bán
2. ✅ **Expected**: Panel thống kê hiển thị:
   - Tổng nhập: Số chính xác
   - Đã bán: Số sản phẩm SOLD
   - Còn lại: Tổng - Đã bán
   - Lãi/Lỗ: Màu sắc đúng (xanh/đỏ/xám)

## 📊 **Business Value**

### **💼 Operational Benefits:**
- **Flexibility**: Có thể điều chỉnh thông tin lô khi cần
- **Accuracy**: Sửa lỗi nhập liệu hoặc thay đổi kế hoạch
- **Efficiency**: Không cần tạo lô mới khi có thay đổi nhỏ
- **Data Integrity**: Validation đảm bảo dữ liệu nhất quán

### **📈 Use Cases:**
- **Sửa lỗi nhập liệu**: Danh mục sai, số lượng sai
- **Thay đổi kế hoạch**: Tăng/giảm số lượng dự kiến nhập
- **Cập nhật ghi chú**: Thêm thông tin quan trọng
- **Chuyển đổi danh mục**: Khi sản phẩm thay đổi phân loại

### **🎯 Business Rules:**
- **Immutable Fields**: BatchCode và ImportDate không thể sửa
- **Quantity Constraint**: Không giảm dưới số sản phẩm đã có
- **Category Flexibility**: Có thể chuyển đổi danh mục
- **Notes Enhancement**: Luôn có thể cập nhật ghi chú

## 🔍 **Data Flow**

### **📊 Edit Process:**
```
1. User clicks "✏️ Sửa" button
2. handleEditBatch(batch) called
3. Modal opens with pre-populated form
4. User modifies editable fields
5. Form validation on change
6. User clicks "💾 Lưu thay đổi"
7. handleSaveEdit() called
8. API PUT /api/import-batches/[id]
9. Database validation & update
10. Success response with updated data
11. Toast notification
12. Modal closes & list refreshes
```

### **🎯 Data Mapping:**
```typescript
// Form → API
{
  CategoryID: parseInt(editForm.CategoryID),
  TotalQuantity: parseInt(parseFormattedNumber(editForm.TotalQuantity)),
  Notes: editForm.Notes || null
}

// API → Database
UPDATE CRM_ImportBatches 
SET 
  CategoryID = @CategoryID,
  TotalQuantity = @TotalQuantity,
  Notes = @Notes,
  UpdatedAt = GETDATE()
WHERE BatchID = @batchId
```

## 🌐 **Integration Points**

### **📍 Page Integration:**
```typescript
// Import Page Integration
const handleEditBatch = (batch: ImportBatch) => {
  // Refresh the list after edit
  setRefreshKey(prev => prev + 1);
  
  // If this batch is currently selected, refresh its details
  if (selectedBatch && selectedBatch.BatchID === batch.BatchID) {
    fetchActualProductCount(selectedBatch.BatchID);
  }
};

// Pass to component
<ImportBatchList
  onEditBatch={handleEditBatch}
  // ... other props
/>
```

### **🔗 Related Features:**
- **Batch Management**: Quản lý lô hàng
- **Product Management**: Quản lý sản phẩm trong lô
- **Category Management**: Quản lý danh mục
- **Validation System**: Hệ thống validation

## 🚀 **Ready for Testing**

### **Dev Server:**
```
URL: http://localhost:3001/warehouse-v2/import
Status: ✅ Running successfully
Feature: ✅ Edit batch functionality active
API: ✅ PUT /api/import-batches/[id] ready
```

### **Test Flow:**
1. **Navigate**: `http://localhost:3001/warehouse-v2/import`
2. **Find**: Tab "Danh sách lô hàng"
3. **Click**: Button "✏️ Sửa" trên bất kỳ lô nào
4. **Verify**: Modal mở với form đã điền sẵn
5. **Edit**: Thay đổi thông tin (danh mục, số lượng, ghi chú)
6. **Save**: Click "💾 Lưu thay đổi"
7. **Confirm**: Toast thành công và danh sách refresh

### **Expected Results:**
- ✅ **Button Visible**: "✏️ Sửa" button trong mỗi row lô hàng
- ✅ **Modal Opens**: Form edit mở khi click button
- ✅ **Pre-populated**: Form điền sẵn dữ liệu hiện tại
- ✅ **Validation Works**: Error messages cho input không hợp lệ
- ✅ **Save Success**: Cập nhật thành công với toast notification
- ✅ **List Refresh**: Danh sách cập nhật với dữ liệu mới

## 📋 **Code Changes Summary**

### **✅ ImportBatchList Updates:**
- Added `onEditBatch` prop to interface
- Added edit modal states and form management
- Added `handleEditBatch`, `handleSaveEdit`, `handleCloseEditModal` functions
- Added number formatting utilities
- Added comprehensive edit modal with validation

### **✅ API Implementation:**
- **New File**: `src/app/api/import-batches/[id]/route.ts`
- **Methods**: GET, PUT, DELETE for single batch operations
- **Validation**: Business rules and data integrity checks
- **Response**: Updated batch data with calculated statistics

### **✅ Page Integration:**
- **Import Page**: Added `handleEditBatch` function and prop passing
- **Refresh Logic**: Auto-refresh list and selected batch details after edit

### **✅ Features Added:**
- **Modal Form**: Professional edit form with validation
- **Number Formatting**: Auto-format quantities with thousand separators
- **Current Stats**: Real-time display of batch statistics
- **Toast Notifications**: Success/error feedback
- **Loading States**: Button loading during save operation

## 🎯 **Validation Rules Summary**

### **📊 Field Validation:**
```typescript
// Required Fields:
- CategoryID: Must select a valid category
- TotalQuantity: Must be positive number

// Business Rules:
- TotalQuantity >= Current Product Count
- CategoryID must exist in CRM_Categories
- BatchCode and ImportDate are immutable

// Format Rules:
- TotalQuantity: Auto-format with thousand separators
- Notes: Optional, can be empty
```

### **🎨 UI Validation:**
- **Real-time**: Validation on field change
- **Visual Feedback**: Error messages and styling
- **Prevent Submit**: Disable save button if invalid
- **Toast Messages**: Success/error notifications

**🎉 Tính năng sửa lô hàng đã được triển khai hoàn chỉnh! Giờ đây người dùng có thể chỉnh sửa thông tin lô hàng một cách linh hoạt và an toàn với đầy đủ validation và feedback.**

**✨ Bạn có thể test ngay tại: `http://localhost:3001/warehouse-v2/import` → Tab "Danh sách lô hàng" → Click "✏️ Sửa" để trải nghiệm tính năng mới!**
