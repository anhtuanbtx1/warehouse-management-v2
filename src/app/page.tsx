'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to warehouse-v2 immediately
    router.replace('/warehouse-v2');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 className="text-muted">Đang chuyển hướng đến Warehouse V2...</h5>
      </div>
    </div>
  );
}
