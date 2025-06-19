# 💰 Demo: Tính Năng Sửa Giá Nhập Lô Hàng

## 🎯 Tính Năng Đã Bổ Sung

### ✨ **Sửa Giá Nhập Trong Modal Edit Lô Hàng**
- **Field mới**: Giá nhập (ImportPrice) với format VNĐ
- **Tính năng**: Tự động tính tổng giá trị nhập (Số lượng × Giá nhập)
- **Validation**: Giá nhập phải là số dương
- **Auto-update**: Cập nhật giá nhập cho tất cả sản phẩm trong lô

### 📊 **Layout Form Mới:**
```
Row 1: [Mã lô hàng (disabled)] [Ngày nhập (disabled)]
Row 2: [Danh mục (dropdown)] [Tổng số lượng (formatted)]
Row 3: [Giá nhập (VNĐ)] [Tổng giá trị nhập (auto-calculated)]
Row 4: [Ghi chú (textarea - full width)]
Row 5: [Thống kê hiện tại (info panel)]
```

## 🔧 **Technical Implementation**

### **📦 Component Updates:**

#### **1. ImportBatchList.tsx - Form State:**
```typescript
// Updated Form State
const [editForm, setEditForm] = useState({
  CategoryID: '',
  TotalQuantity: '',
  ImportPrice: '',  // ← NEW
  Notes: ''
});

// Pre-populate ImportPrice
const handleEditBatch = (batch: ImportBatch) => {
  setEditingBatch(batch);
  setEditForm({
    CategoryID: batch.CategoryID?.toString() || '',
    TotalQuantity: batch.TotalQuantity.toString(),
    ImportPrice: batch.ImportPrice?.toString() || '',  // ← NEW
    Notes: batch.Notes || ''
  });
  setShowEditModal(true);
};
```

#### **2. Currency Formatting Functions:**
```typescript
// Format currency for VND
const formatCurrencyInput = (value: string) => {
  if (!value) return '';
  const numStr = value.replace(/\D/g, ''); // Remove non-digits
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseCurrencyInput = (value: string) => {
  return value.replace(/\./g, '');
};

// Example: 1000000 → 1.000.000 VNĐ
```

#### **3. Enhanced Validation:**
```typescript
// Validation Rules
if (!editForm.CategoryID || !editForm.TotalQuantity || !editForm.ImportPrice) {
  showError('Lỗi validation', 'Vui lòng điền đầy đủ thông tin bắt buộc');
  return;
}

const importPrice = parseFloat(parseFormattedNumber(editForm.ImportPrice));
if (isNaN(importPrice) || importPrice <= 0) {
  showError('Lỗi validation', 'Giá nhập phải là số dương');
  return;
}
```

#### **4. New Form Fields:**
```typescript
// Import Price Field
<div className="col-md-6">
  <div className="mb-3">
    <label className="form-label fw-bold">
      Giá nhập <span className="text-danger">*</span>
    </label>
    <div className="input-group">
      <input
        type="text"
        className="form-control"
        value={formatCurrencyInput(editForm.ImportPrice)}
        onChange={(e) => setEditForm({
          ...editForm, 
          ImportPrice: parseCurrencyInput(e.target.value)
        })}
        placeholder="Nhập giá nhập"
        style={{ fontSize: '1.1rem' }}
      />
      <span className="input-group-text">VNĐ</span>
    </div>
    <small className="text-muted">
      Hiện tại: {formatCurrency(editingBatch.ImportPrice || 0)}
    </small>
  </div>
</div>

// Total Import Value Field (Auto-calculated)
<div className="col-md-6">
  <div className="mb-3">
    <label className="form-label fw-bold">
      Tổng giá trị nhập <span className="text-muted">(tự động tính)</span>
    </label>
    <input
      type="text"
      className="form-control"
      value={formatCurrency(
        (parseInt(parseFormattedNumber(editForm.TotalQuantity)) || 0) * 
        (parseFloat(parseCurrencyInput(editForm.ImportPrice)) || 0)
      )}
      disabled
      style={{ 
        fontSize: '1.1rem', 
        backgroundColor: '#f8f9fa',
        fontWeight: 'bold',
        color: '#0d6efd'
      }}
    />
    <small className="text-muted">
      Số lượng × Giá nhập
    </small>
  </div>
</div>
```

### **🌐 API Implementation:**

#### **📍 Updated API Endpoint:** `/api/import-batches/[id]/route.ts`
```typescript
// Updated Request Body
const { CategoryID, TotalQuantity, ImportPrice, Notes } = body;

// Enhanced Validation
if (!CategoryID || !TotalQuantity || !ImportPrice) {
  return NextResponse.json({
    success: false,
    error: 'CategoryID, TotalQuantity, and ImportPrice are required'
  }, { status: 400 });
}

if (parseFloat(ImportPrice) <= 0) {
  return NextResponse.json({
    success: false,
    error: 'ImportPrice must be greater than 0'
  }, { status: 400 });
}

// Update Batch Query
UPDATE CRM_ImportBatches 
SET 
  CategoryID = @CategoryID,
  TotalQuantity = @TotalQuantity,
  ImportPrice = @ImportPrice,  // ← NEW
  Notes = @Notes,
  UpdatedAt = GETDATE()
WHERE BatchID = @batchId

// Update All Products in Batch
UPDATE CRM_Products 
SET ImportPrice = @ImportPrice
WHERE BatchID = @batchId
```

#### **🔧 Cascade Update Logic:**
```typescript
// Business Logic: Update ImportPrice for all products in batch
// When batch ImportPrice changes, all products get the new price
// This ensures data consistency across the system

// Step 1: Update batch ImportPrice
await executeQuery(`UPDATE CRM_ImportBatches SET ImportPrice = @ImportPrice WHERE BatchID = @batchId`);

// Step 2: Update all products in the batch
await executeQuery(`UPDATE CRM_Products SET ImportPrice = @ImportPrice WHERE BatchID = @batchId`);

// Result: All products in the batch now have the same ImportPrice
```

## 📱 **UI/UX Features**

### **🎨 Smart Form Features:**
```typescript
// Real-time Calculation
const totalValue = (quantity || 0) * (importPrice || 0);

// Auto-formatting
Input: "1000000" → Display: "1.000.000 VNĐ"

// Visual Feedback
- Import Price: Input with VNĐ suffix
- Total Value: Auto-calculated, disabled, highlighted in blue
- Current Value: Shows existing ImportPrice for reference
```

### **📊 Enhanced Form Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ ✏️ Chỉnh sửa lô hàng (LOT20250618235813)                   │
├─────────────────────────────────────────────────────────────┤
│ [Mã lô hàng - disabled] [Ngày nhập - disabled]             │
│ [Danh mục - dropdown]   [Tổng số lượng - formatted]        │
│ [Giá nhập - VNĐ]        [Tổng giá trị - auto-calc]         │
│ [Ghi chú - textarea full width]                            │
│                                                             │
│ 📊 Thống kê hiện tại:                                      │
│ Tổng nhập: 10  Đã bán: 3  Còn lại: 7  Lãi/Lỗ: +2.500.000 │
└─────────────────────────────────────────────────────────────┘
```

### **💡 Smart Calculations:**
```typescript
// Real-time Total Value Calculation
Số lượng: 10 sản phẩm
Giá nhập: 15.000.000 VNĐ
─────────────────────────
Tổng giá trị: 150.000.000 VNĐ (tự động tính)

// Visual Indicators
✅ Giá nhập hợp lệ: Input border xanh
❌ Giá nhập không hợp lệ: Input border đỏ + error message
💰 Tổng giá trị: Highlighted in blue, bold font
```

## 🧪 **Test Cases**

### **Test 1: Form Pre-population**
1. Click "✏️ Sửa" trên lô hàng bất kỳ
2. ✅ **Expected**: 
   - Field "Giá nhập" hiển thị giá hiện tại với format VNĐ
   - Field "Tổng giá trị nhập" tự động tính = Số lượng × Giá nhập
   - Hiển thị "Hiện tại: [giá cũ]" dưới input

### **Test 2: Currency Formatting**
1. Nhập "15000000" vào field Giá nhập
2. ✅ **Expected**: Tự động format thành "15.000.000"
3. Tab ra khỏi field
4. ✅ **Expected**: Hiển thị "15.000.000 VNĐ"

### **Test 3: Real-time Calculation**
1. Thay đổi Số lượng: 10 → 15
2. Thay đổi Giá nhập: 10.000.000 → 12.000.000
3. ✅ **Expected**: 
   - Tổng giá trị tự động cập nhật: 180.000.000 VNĐ
   - Calculation: 15 × 12.000.000 = 180.000.000

### **Test 4: Validation Rules**
1. Để trống Giá nhập → ✅ **Expected**: Error "Vui lòng điền đầy đủ thông tin"
2. Nhập Giá nhập = 0 → ✅ **Expected**: Error "Giá nhập phải là số dương"
3. Nhập Giá nhập = -1000 → ✅ **Expected**: Error "Giá nhập phải là số dương"

### **Test 5: Successful Update**
1. Sửa Giá nhập từ 10.000.000 → 15.000.000
2. Click "💾 Lưu thay đổi"
3. ✅ **Expected**: 
   - Toast "Cập nhật thành công!"
   - Modal đóng
   - Danh sách refresh với giá mới
   - Tất cả sản phẩm trong lô có ImportPrice = 15.000.000

### **Test 6: Cascade Update Verification**
1. Sửa ImportPrice của lô
2. Save thành công
3. Vào tab "Sản phẩm trong lô"
4. ✅ **Expected**: Tất cả sản phẩm có ImportPrice mới

## 📊 **Business Value**

### **💼 Operational Benefits:**
- **Price Management**: Quản lý giá nhập linh hoạt
- **Bulk Update**: Cập nhật giá cho tất cả sản phẩm trong lô cùng lúc
- **Cost Control**: Theo dõi và điều chỉnh chi phí nhập hàng
- **Profit Calculation**: Tính toán lợi nhuận chính xác hơn

### **📈 Use Cases:**
- **Price Correction**: Sửa lỗi giá nhập ban đầu
- **Market Adjustment**: Điều chỉnh giá theo thị trường
- **Supplier Changes**: Thay đổi giá khi đổi nhà cung cấp
- **Bulk Pricing**: Áp dụng giá mới cho toàn bộ lô

### **🎯 Business Rules:**
- **Cascade Update**: Thay đổi giá lô → Tất cả sản phẩm trong lô cập nhật
- **Data Consistency**: Đảm bảo giá nhập đồng nhất trong lô
- **Audit Trail**: Lưu UpdatedAt khi thay đổi
- **Validation**: Giá nhập phải > 0

## 🔍 **Data Flow**

### **📊 Update Process:**
```
1. User opens edit modal
2. Form pre-populated with current ImportPrice
3. User modifies ImportPrice (with VNĐ formatting)
4. Real-time calculation of Total Import Value
5. Form validation on save
6. API call with new ImportPrice
7. Database updates:
   - CRM_ImportBatches.ImportPrice
   - CRM_Products.ImportPrice (all products in batch)
8. Success response
9. UI refresh with new data
```

### **🎯 Data Consistency:**
```typescript
// Before Update
Batch ImportPrice: 10.000.000 VNĐ
Product 1 ImportPrice: 10.000.000 VNĐ
Product 2 ImportPrice: 10.000.000 VNĐ
Product 3 ImportPrice: 10.000.000 VNĐ

// After Update (ImportPrice → 15.000.000)
Batch ImportPrice: 15.000.000 VNĐ
Product 1 ImportPrice: 15.000.000 VNĐ ← Updated
Product 2 ImportPrice: 15.000.000 VNĐ ← Updated  
Product 3 ImportPrice: 15.000.000 VNĐ ← Updated

// Result: All data consistent
```

## 🌐 **Integration Points**

### **📍 Related Systems:**
- **Profit Calculation**: Ảnh hưởng đến tính toán lợi nhuận
- **Sales Reports**: Cập nhật margin và profit reports
- **Inventory Valuation**: Thay đổi giá trị tồn kho
- **Dashboard Stats**: Cập nhật thống kê doanh thu/lợi nhuận

### **🔗 Affected Features:**
- **Product Management**: ImportPrice của sản phẩm
- **Sales Management**: Profit calculation
- **Reports**: Cost analysis và profit reports
- **Dashboard**: Revenue và profit statistics

## 🚀 **Ready for Testing**

### **📱 Test Environment:**
```
URL: http://localhost:3001/warehouse-v2/import
Tab: "Danh sách lô hàng"
Action: Click "✏️ Sửa" → Modify "Giá nhập" field
```

### **🧪 Test Scenarios:**
1. **Field Visibility**: ✅ "Giá nhập" field hiển thị với VNĐ suffix
2. **Pre-population**: ✅ Form điền sẵn ImportPrice hiện tại
3. **Currency Formatting**: ✅ Auto-format số với dấu chấm
4. **Real-time Calculation**: ✅ Tổng giá trị tự động cập nhật
5. **Validation**: ✅ Error messages cho input không hợp lệ
6. **Save Success**: ✅ Cập nhật thành công với cascade update
7. **Data Consistency**: ✅ Tất cả sản phẩm trong lô có giá mới

### **Expected Results:**
- ✅ **Import Price Field**: Hiển thị với format VNĐ và validation
- ✅ **Auto Calculation**: Tổng giá trị = Số lượng × Giá nhập
- ✅ **Currency Format**: 1000000 → 1.000.000 VNĐ
- ✅ **Cascade Update**: Tất cả sản phẩm trong lô cập nhật ImportPrice
- ✅ **Data Consistency**: Giá nhập đồng nhất trong toàn bộ lô
- ✅ **Toast Notification**: Feedback rõ ràng cho user

## 📋 **Code Changes Summary**

### **✅ Frontend Updates:**
- **Form State**: Added ImportPrice to editForm state
- **Validation**: Enhanced validation for ImportPrice field
- **Currency Formatting**: Added formatCurrencyInput and parseCurrencyInput functions
- **UI Components**: Added ImportPrice input field with VNĐ suffix
- **Auto Calculation**: Real-time calculation of Total Import Value
- **Visual Feedback**: Current price display and formatting

### **✅ Backend Updates:**
- **API Validation**: Added ImportPrice validation in PUT endpoint
- **Database Updates**: Update both CRM_ImportBatches and CRM_Products
- **Cascade Logic**: Ensure all products in batch get new ImportPrice
- **Error Handling**: Comprehensive error messages for validation

### **✅ Features Added:**
- **Import Price Editing**: Full CRUD support for batch ImportPrice
- **Currency Formatting**: Professional VNĐ formatting
- **Auto Calculation**: Real-time total value calculation
- **Cascade Updates**: Automatic product price synchronization
- **Data Consistency**: Ensure price consistency across batch and products

## 🎯 **Business Impact**

### **📈 Immediate Benefits:**
- **Flexible Pricing**: Có thể điều chỉnh giá nhập khi cần
- **Bulk Operations**: Cập nhật giá cho nhiều sản phẩm cùng lúc
- **Cost Management**: Quản lý chi phí nhập hàng hiệu quả
- **Data Accuracy**: Đảm bảo tính chính xác của dữ liệu giá

### **💰 Financial Impact:**
- **Profit Accuracy**: Tính toán lợi nhuận chính xác hơn
- **Cost Control**: Kiểm soát chi phí tốt hơn
- **Pricing Strategy**: Hỗ trợ chiến lược định giá
- **Financial Reports**: Báo cáo tài chính chính xác

**🎉 Tính năng sửa giá nhập đã được bổ sung hoàn chỉnh! Giờ đây người dùng có thể chỉnh sửa giá nhập của lô hàng và tự động cập nhật cho tất cả sản phẩm trong lô một cách nhất quán và chuyên nghiệp.**

**✨ Bạn có thể test ngay tại:**
- **URL**: `http://localhost:3001/warehouse-v2/import`
- **Tab**: "Danh sách lô hàng"
- **Action**: Click "✏️ Sửa" → Modify field "Giá nhập" → Xem tính năng auto-calculation

**💰 Tính năng này đảm bảo tính nhất quán của dữ liệu giá và hỗ trợ quản lý chi phí hiệu quả!**
