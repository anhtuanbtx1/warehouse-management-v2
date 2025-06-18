import { NextRequest, NextResponse } from 'next/server';
import { getConnection, executeQuery } from '@/lib/database';

// GET /api/test-connection - Test database connection
export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const connection = await getConnection();
    console.log('Database connection established successfully');
    
    // Test a simple query
    const result = await executeQuery('SELECT GETDATE() as CurrentTime, @@VERSION as ServerVersion');
    console.log('Test query executed successfully:', result);
    
    // Check if our tables exist
    const tablesQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      AND TABLE_NAME LIKE 'CRM_%'
      ORDER BY TABLE_NAME
    `;
    
    const tables = await executeQuery(tablesQuery);
    console.log('CRM tables found:', tables);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        serverTime: result[0]?.CurrentTime,
        serverVersion: result[0]?.ServerVersion,
        crmTables: tables.map(t => t.TABLE_NAME),
        connectionConfig: {
          server: process.env.DB_SERVER,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          port: process.env.DB_PORT
        }
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      connectionConfig: {
        server: process.env.DB_SERVER,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        port: process.env.DB_PORT
      }
    }, { status: 500 });
  }
}
