const mysql = require('mysql');
const util = require('util');
const constants = require('../private-constants').mysql;
var connection;

//Connection info for amazon sql db
connection = mysql.createConnection({
	host: constants.host,
	user: constants.user,
	password: constants.password,
	database: constants.database
});

// Promise wrapper to enable async await with MYSQL
connection.query = util.promisify(connection.query).bind(connection);

// Connect to the database
connection.connect(function(err){
	if (err) {
		console.log('error connecting: ' + err.stack);
		return;
	}
});

module.exports = connection;
