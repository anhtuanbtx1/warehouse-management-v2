'use client';

import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onRemove }) => {
  const getToastVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'light';
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <ToastContainer 
      position="top-end" 
      className="p-3"
      style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 9999 
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          bg={getToastVariant(toast.type)}
          onClose={() => onRemove(toast.id)}
          show={true}
          delay={toast.duration || 5000}
          autohide
          className="mb-2"
          style={{
            minWidth: '300px',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: 'none'
          }}
        >
          <Toast.Header 
            closeButton={true}
            className="d-flex align-items-center"
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              paddingBottom: '0.5rem'
            }}
          >
            <span className="me-2" style={{ fontSize: '1.2rem' }}>
              {getToastIcon(toast.type)}
            </span>
            <strong className="me-auto" style={{ fontSize: '1rem' }}>
              {toast.title}
            </strong>
          </Toast.Header>
          <Toast.Body 
            className={toast.type === 'success' || toast.type === 'error' ? 'text-white' : 'text-dark'}
            style={{
              fontSize: '0.95rem',
              paddingTop: '0'
            }}
          >
            {toast.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
};

export default ToastNotification;
