var router = require('express').Router();
const mysql = require('../middleware/mysql');

//Used to update user information
router.put('/user', 
	async (req, res) => {
		if(req.body.id !== req.user.id){
			res.status(403).send('You do not have access to edit this user');
			return;
		}
		var sql = `
			select 
				* 
			from 
				user 
			where username = ? 
				and id <> ?`;
		var result = await mysql.query(sql, [req.body.username, req.user.id]);
		if (result[0]){
			res.status(409).send('This username is already taken');
			return;
		}
		sql = `
			update 
				user 
			set 
				username = ?, 
				display_name = ? 
			where id = ?`;
		await mysql.query(sql, [req.body.username, req.body.displayName, req.user.id]);
		res.sendStatus(200);
	}
);

//Used to check if a user already has a username
router.get('/user/check-username', 
	async (req, res) => {
		if (!req.query.username){
			res.status(400).send('No username included to check');
			return;
		}
		if(req.query.username.length < 6){
			res.send({valid: false});
			return;
		}
		var sql = `
			select 
				* 
			from 
				user 
			where username = ? 
				and id <> ?`;
		var result = await mysql.query(sql, [req.query.username, req.user.id]);
		res.send({valid: !result[0]});
	}
);

module.exports = router;
