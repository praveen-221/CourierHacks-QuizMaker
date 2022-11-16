const mysql = require("mysql");

conn = mysql.createConnection({
    host: 'mysql5030.site4now.net',
    user: 'a8fe6b_agiagi1',
    password: 'Agilan@2003',
    database: 'db_a8fe6b_agiagi1'
});

conn.connect((err) => {
    if (err) throw err;
    else {
        console.log("Database connected!");
    }
});

module.exports = conn;