import mysql from 'mysql2/promise';
import { env } from './env.js';

// All dates are stored and read as Africa/Addis_Ababa wall-clock time (UTC+03:00, no daylight
// saving). The same offset is used for:
//   1. the MySQL session, so NOW() and CURRENT_TIMESTAMP write Addis time on any server, and
//   2. the mysql2 driver, so stored DATETIME values become the correct instant (an ISO string
//      the browser then shows in the viewer's own time zone).
// Using 'Z' here while MySQL ran on Addis time made every stored time appear 3 hours late,
// so an evening action showed the next day's date.
const APP_TIME_ZONE = '+03:00';

export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: 0,

  charset: 'utf8mb4',
  timezone: APP_TIME_ZONE,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Keep BIGINT and DECIMAL values predictable.
  // Convert values explicitly in service code when needed.
  supportBigNumbers: true,
  bigNumberStrings: true,
  decimalNumbers: false,
});

pool.on('connection', (connection) => {
  connection.query(`SET time_zone = '${APP_TIME_ZONE}'`);
});

export async function verifyDatabaseConnection() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(`
      SELECT
        1 AS connection_ok,
        DATABASE() AS database_name,
        CURRENT_TIMESTAMP AS database_time
    `);

    const result = rows[0];

    if (result.database_name !== env.DB_NAME) {
      throw new Error('Connected database does not match DB_NAME.');
    }

    return {
      connected: true,
      database: result.database_name,
      databaseTime: result.database_time,
    };
  } finally {
    connection.release();
  }
}

export async function closeDatabaseConnection() {
  await pool.end();
}