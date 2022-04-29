const mysql = require("mysql");
require("dotenv").config();

var pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

module.exports = pool;

pool.on("enqueue", function () {
  console.log("Waiting for available connection slot");
});

pool.on("release", function (connection) {
  console.log("Connection %d released", connection.threadId);
});
