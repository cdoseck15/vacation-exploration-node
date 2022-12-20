const express = require('express');
require('express-async-errors'); //Catches all errors
const app = express();
const cors = require('cors');
const constants = require('./private-constants');
const googleAPI = require('./middleware/googleAPI');

app.use(express.json());
app.use(require('body-parser').urlencoded({extended: false}));

//Use Cors to allow requests to come from react app
app.use(
	cors({
		origin: constants.FRONT_END,
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		exposedHeaders: 'Location',
		credentials: true
	})
);

//Create express session to verify user. Logs them out after 7 days of inactivity
app.use(require('express-session')({
	secret: constants.session_secret,
	resave: false,
	saveUninitialized: true,
	//rolling: true,
	cookie: {
		expires: 1000 * 60 * 60 * 24 * 7
	}
}));

app.use('/', require('./middleware/passport'));

//Internal test to see what the response is when using my Google API Key
app.use('/google-api-test', 
	async (req, res) => {
		var response = await googleAPI.testAPI();
		res.send(response);
	}
);

app.get('/user/credentials',
	(req, res) => {
		res.send(req.user);
	}
);

app.use('/vacations', require('./routes/vacations'));
app.use('/', require('./routes/attractions'));
app.use('/', require('./routes/user'));
app.use('/', require('./routes/friends'));
app.use('/static_texts', require('./routes/static_texts'));
app.use('/', (req, res) => {
	res.sendStatus(404);
});

//Handle errors
app.use((err, req, res, next) => {
	switch (err.code){
	case 'ER_DUP_ENTRY':
		res.status(409);
		res.send('There already exists data that matches this');
		return;
	case 'ER_EMPTY_QUERY':
	case 'ER_BAD_FIELD_ERROR':
	case 'ER_PARSE_ERROR':
	case 'ER_NO_SUCH_TABLE':
	case 'ER_NO_REFERENCED_ROW':
	case 'ER_NO_REFERENCED_ROW_2':
		console.log(err.sqlMessage);
		res.status(500);
		res.send(err.code);
		return;
	default:
		console.log(err);
		res.sendStatus(500);
		next();
	}
});

// app.listen(constants.port, () => {
// 	console.log('Listening on port ' + constants.port);
// });

module.exports = app;
