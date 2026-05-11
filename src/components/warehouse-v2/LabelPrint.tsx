'use client';

import React, { useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import Barcode from 'react-barcode';
import '../../styles/label-print.css';

interface LabelPrintProps {
  show: boolean;
  onHide: () => void;
  productName: string;
  imei: string;
  price?: number;
  categoryName?: string;
}

const LabelPrint: React.FC<LabelPrintProps> = ({ 
  show, 
  onHide, 
  productName, 
  imei, 
  price,
  categoryName 
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In tem mã - ${imei}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              background: white;
            }
            
            .label-container {
              width: 80mm;
              padding: 8mm;
              margin: 0 auto;
            }
            
            .label-header {
              text-align: center;
              margin-bottom: 6mm;
              border-bottom: 2px solid #000;
              padding-bottom: 4mm;
            }
            
            .label-title {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 2mm;
            }
            
            .label-category {
              font-size: 10pt;
              color: #666;
              text-transform: uppercase;
            }
            
            .label-product {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 6mm;
              text-align: center;
            }
            
            .label-imei {
              margin-bottom: 6mm;
            }
            
            .label-imei-title {
              font-size: 10pt;
              color: #666;
              margin-bottom: 2mm;
            }
            
            .label-imei-code {
              font-size: 16pt;
              font-weight: bold;
              font-family: 'Courier New', monospace;
              letter-spacing: 1px;
              word-break: break-all;
            }
            
            .label-barcode {
              text-align: center;
              margin: 6mm 0;
              padding: 4mm;
              border: 1px solid #ddd;
              background: #f9f9f9;
            }
            
            .label-barcode svg {
              max-width: 100%;
              height: auto;
            }
            
            .label-price {
              text-align: center;
              margin-top: 6mm;
              padding-top: 4mm;
              border-top: 1px solid #ddd;
            }
            
            .label-price-title {
              font-size: 10pt;
              color: #666;
              margin-bottom: 2mm;
            }
            
            .label-price-value {
              font-size: 18pt;
              font-weight: bold;
              color: #d9534f;
            }
            
            .label-footer {
              text-align: center;
              margin-top: 6mm;
              padding-top: 4mm;
              border-top: 1px solid #ddd;
              font-size: 8pt;
              color: #999;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              
              .label-container {
                page-break-after: always;
              }
              
              @page {
                size: 80mm auto;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-barcode me-2"></i>
          Xem trước tem mã sản phẩm
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex justify-content-center bg-light p-4">
          <div ref={printRef} className="label-container bg-white shadow">
            <div className="label-header">
              <div className="label-title">PHONE STORE</div>
              {categoryName && <div className="label-category">{categoryName}</div>}
            </div>
            
            <div className="label-product">{productName}</div>
            
            <div className="label-imei">
              <div className="label-imei-title">IMEI:</div>
              <div className="label-imei-code">{imei}</div>
            </div>
            
            <div className="label-barcode">
              <Barcode
                value={imei || '000000000000000'}
                format="CODE128"
                width={1.5}
                height={60}
                displayValue={false}
                margin={0}
                background="#f9f9f9"
                lineColor="#111"
              />
            </div>
            
            {price && price > 0 && (
              <div className="label-price">
                <div className="label-price-title">Giá bán:</div>
                <div className="label-price-value">{formatCurrency(price)}</div>
              </div>
            )}
            
            <div className="label-footer">
              <div>Quét mã để xem thông tin chi tiết</div>
              <div>Hotline: 0123-456-789</div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="fas fa-times me-2"></i>
          Đóng
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          <i className="fas fa-print me-2"></i>
          In tem mã
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LabelPrint;
