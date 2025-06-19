// Database connection configuration
import sql from 'mssql';

const config: sql.config = {
  user: process.env.DB_USER || 'zen50558_ManagementStore',
  password: process.env.DB_PASSWORD || 'Passwordla@123',
  server: process.env.DB_SERVER || '112.78.2.70',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'zen50558_ManagementStore',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',  // Use environment variable
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    requestTimeout: 15000,  // Reduced from 30s
    connectTimeout: 10000  // Fixed: was connectionTimeout, should be connectTimeout
  },
  pool: {
    max: 5,  // Reduced from 10
    min: 1,  // Keep 1 connection alive
    idleTimeoutMillis: 60000,  // Increased to 60s
    acquireTimeoutMillis: 10000  // Add acquire timeout
  }
};

let pool: sql.ConnectionPool | null = null;
let connecting = false;

export async function getConnection(): Promise<sql.ConnectionPool> {
  // If pool exists and is connected, return it
  if (pool && pool.connected) {
    return pool;
  }

  // If already connecting, wait for it
  if (connecting) {
    while (connecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (pool && pool.connected) {
      return pool;
    }
  }

  try {
    connecting = true;

    // Close existing pool if any
    if (pool) {
      try {
        await pool.close();
      } catch (error) {
        console.log('Error closing existing pool:', error);
      }
    }

    // Log connection attempt
    console.log('Attempting database connection with config:', {
      server: config.server,
      port: config.port,
      database: config.database,
      user: config.user,
      encrypt: config.options?.encrypt,
      trustServerCertificate: config.options?.trustServerCertificate
    });

    // Create new pool
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('Database connection established successfully');

    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    console.error('Connection config used:', {
      server: config.server,
      port: config.port,
      database: config.database,
      user: config.user,
      encrypt: config.options?.encrypt,
      trustServerCertificate: config.options?.trustServerCertificate
    });
    throw error;
  } finally {
    connecting = false;
  }
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
