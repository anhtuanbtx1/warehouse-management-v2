'use client';

import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="container py-4">
      <h1>Test Page</h1>
      <p>This is a simple test page to check if the app is working.</p>
      <div className="alert alert-success">
        <strong>Success!</strong> The app is running correctly.
      </div>
    </div>
  );
};

export default TestPage;
