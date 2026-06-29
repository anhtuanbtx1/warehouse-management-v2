import React from 'react';
import { Pagination } from 'antd';

interface AntPaginationProps {
  current: number;
  total: number;
  pageSize?: number;
  onChange: (page: number, pageSize: number) => void;
}

const AntPagination: React.FC<AntPaginationProps> = ({
  current,
  total,
  pageSize = 10,
  onChange,
}) => (
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
    <Pagination
      current={current}
      total={total}
      pageSize={pageSize}
      onChange={onChange}
      showSizeChanger={false}
      showQuickJumper
      showTotal={(t) => `Tổng ${t} bản ghi`}
    />
  </div>
);

export default AntPagination;
