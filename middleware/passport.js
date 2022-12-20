var router = require('express').Router();
var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc');
var mysql = require('./mysql');
const constants = require('../private-constants');
const jwt = require('jsonwebtoken');

//This refreshes the access token and refresh token given a valid refresh token
router.post('/refresh_token', 
	(req, res) => {
		//Gets the refresh token from the header
		const token = req.headers.refresh_token;
		//Verifies if the token is valid or not
		jwt.verify(token, constants.REFRESH_KEY, (err, decoded) => {
			//If not valid then it returns a 401 response
			if(err){
				res.status(401).send('INVALID_REFRESH_TOKEN');
			}
			//If it is valid it regenerates an access_token and a refresh_token and returns them
			else {
				const user = decoded.user;
				const access_token = jwt.sign({user: user}, constants.ACCESS_KEY, { expiresIn: constants.ACCESS_LIFE});
				const refresh_token = jwt.sign({user: user}, constants.REFRESH_KEY, { expiresIn: constants.REFRESH_LIFE});			
				res.send({
					access_token: access_token,
					refresh_token: refresh_token
				});
			}
		});
	}
);

//This assigns a user base on the Authentication token sent
router.use('/', (req, res, next) => {
	//Gets token from header
	const token = req.headers.authorization;
	//If there is no token then continue. There are cases where the user doesn't need to be logged in.
	//If they are passing a token make sure that it is a valid token though
	if(token){
		//Gets a boolean if the token is valid or not
		const valid = jwt.verify(token, constants.ACCESS_KEY, (err, decoded) => {
			if(err){
				//Return them a message with the token error and return that it isn't a valid token
				if (err.name == 'TokenExpiredError'){
					res.status(401).send('ACCESS_TOKEN_EXPIRED');
				}
				else{
					res.status(401).send(err.name);
				}
				return false;
			}
			//Assign the user and return that it is a valid token
			else{
				req.user = decoded.user;
				return true;
			}
		});
		//If it isn't a valid token then don't continue on to the next route
		if(!valid){
			return;
		}
	}
	next();
});

//Returns to the screen that called the login function and returns access tokens
const loginRedirect = (req, res) => {
	const access_token = jwt.sign({user: req.user}, constants.ACCESS_KEY, { expiresIn: constants.ACCESS_LIFE});
	const refresh_token = jwt.sign({user: req.user}, constants.REFRESH_KEY, { expiresIn: constants.REFRESH_LIFE});
	res.send(`
		<script>
			window.opener.postMessage({
				success: true, 
				access_token:"${access_token}",
				refresh_token:"${refresh_token}",
			}, "${constants.FRONT_END}");
			window.close();
		</script>`
	);
};

//Passport that uses google to authenticate user
passport.use(new GoogleStrategy({
	clientID: constants.google_auth.client_id,
	clientSecret: constants.google_auth.client_secret,
	callbackURL: constants.google_auth.callback_url
},
async (issuer, profile, cb) => {
	var result = await lookupOrCreateUser(profile.id, 'Google');
	return cb(null, result);
}
));

router.use(passport.initialize());

//Used to find a user in the database given their user id
const findUser = async (id) => {
	var sql = `
		select 
			u.id, 
			u.username, 
			u.display_name 
		from 
			user u 
		where u.id = ?`;
	var sqlResult = await mysql.query(sql, [id]);
	return sqlResult[0];
};

//Used to find a user given their token and site and if there doesn't exist that user then create them
const lookupOrCreateUser = async (id, site) => {
	var sql = `
		select 
			u.id 
		from 
			user u, 
			user_type ut 
		where u.user_type = ut.id 
			and token = ? 
			and ut.website = ?;`;
	var result = await mysql.query(sql, [id, site]);
	if (result[0]){
		return await findUser(result[0].id);
	}
	else {
		sql = `
			insert into 
			user(user_type, token) 
			select 
				id, 
				? 
			from user_type 
			where website = ?;`;
		result = await mysql.query(sql, [id, site]);
		return  await findUser(result.insertId);
	}
};

//Route to authenticate with google
router.get('/login/google', passport.authenticate('google', {
	session: false,
	scope: ['profile', 'email']
}));

//Return call from google
router.get('/oauth2/redirect/google',
	passport.authenticate('google', {session: false, failureMessage: true}),
	loginRedirect
);

//Logs the user out
router.post('/logout', (req, res, next) => {
	req.logout(err => {
		if (err){
			return next(err);
		}
	});
	res.sendStatus(200);
});

module.exports = router;
