const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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
