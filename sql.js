const mysql = require("mysql");

const pool = mysql.createPool({
    connectionLimit: 100,
    host: 'localhost',
    user: 'root',
    password: 'F5#2b959628D3E70c6@4df',
    database: 'study'
});

pool.getConnection((err, connection) => {
    if (err) throw err;
    console.log('Database connected');
    connection.release();
})

module.exports = pool;


