// Database connection configuration
import sql from 'mssql';

const config: sql.config = {
  user: process.env.DB_USER || 'zen50558_ManagementStore',
  password: process.env.DB_PASSWORD || 'Passwordla@123',
  server: process.env.DB_SERVER || '112.78.2.70',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'zen50558_ManagementStore',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    requestTimeout: 30000,
    connectionTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool || !pool.connected) {
    if (pool) {
      try {
        await pool.close();
      } catch (error) {
        console.log('Error closing existing pool:', error);
      }
    }
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Database connection established');
  }
  return pool;
}

export async function executeQuery<T = any>(
  query: string,
  params?: { [key: string]: any }
): Promise<T[]> {
  try {
    const connection = await getConnection();
    const request = connection.request();

    // Add parameters if provided
    if (params) {
      Object.keys(params).forEach(key => {
        request.input(key, params[key]);
      });
    }

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function executeProcedure<T = any>(
  procedureName: string,
  params?: { [key: string]: any }
): Promise<T[]> {
  try {
    const connection = await getConnection();
    const request = connection.request();

    // Add parameters if provided
    if (params) {
      Object.keys(params).forEach(key => {
        request.input(key, params[key]);
      });
    }

    const result = await request.execute(procedureName);
    return result.recordset;
  } catch (error) {
    console.error('Database procedure error:', error);
    throw error;
  }
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

export { sql };
