const mysql = require("mysql2");
require("dotenv").config();

const poolConfig = {
  host: process.env.MYSQLHOST || 'localhost',
  port: process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : 3306,
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'crm_data_room',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Tự động bật SSL khi kết nối tới database trên Cloud (Aiven, PlanetScale, TiDB, v.v.)
const host = process.env.MYSQLHOST || '';
if (process.env.MYSQLSSL === 'true' || (host && !host.includes('localhost') && !host.includes('127.0.0.1'))) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = mysql.createPool(poolConfig);

const promisePool = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
  } else {
    console.log("MySQL connected successfully");
    connection.release();

    // Auto-migrate missing columns
    promisePool.query("SHOW COLUMNS FROM documents LIKE 'access_password_hash'")
      .then(([cols]) => {
        if (cols.length === 0) {
          console.log("Adding missing column 'access_password_hash' to documents table...");
          return promisePool.query("ALTER TABLE documents ADD COLUMN access_password_hash VARCHAR(255) NULL AFTER access_level");
        }
      })
      .then(() => {
        console.log("Documents table schema verified.");
      })
      .catch((migrationErr) => {
        console.warn("Schema auto-migration notice:", migrationErr.message);
      });
  }
});

module.exports = promisePool;
