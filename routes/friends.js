var router = require('express').Router();
const mysql = require('../middleware/mysql');
const verify = require('../middleware/verify');

//Gets list of freinds
router.get('/friends', 
	async (req, res) => {
		var sql = `
		select 
			u.username, 
			u.display_name
		from 
			friend f, 
			user u
		where f.user_id_1 = ? 
			and f.user_id_2 = u.id`;
		var result = await mysql.query(sql, [req.user.id]);
		res.send(result);
	}
);

//Gets list of friend request that have been sent
router.get('/friends/pending-requests', async(req, res) => {
	var sql = `
		select 
			u.username, 
			fr.request_date
		from 
			friend_request fr, 
			user u
		where fr.receiver_id = ?
		  and fr.sender_id = u.id`;
	var result = await mysql.query(sql, [req.user.id]);
	res.send(result);
});

//Gets list of friend requests that have been received
router.get('/friends/sent-requests', async(req, res) => {
	var sql = `
		select 
			u.username, 
			fr.request_date
		from 
			friend_request fr, 
			user u
		where fr.sender_id = ?
			and fr.receiver_id = u.id`;
	var result = await mysql.query(sql, [req.user.id]);
	res.send(result);
});

//Used to lookup a username, limiting it to 10 usernames returned
//Doesn't return usernames that have already had friend requests sent to or from or current friends
router.get('/friends/find/:username',
	verify.requireParams(['username']),
	async (req, res, next) => {
		var sql = `
			select 
				username
			from 
				user
			where username like ?
				and id <> ?
				and id not in (
					select 
						receiver_id
					from 
						friend_request
					where sender_id = ?
				)
				and id not in (
					select 
						sender_id
					from 
						friend_request
					where receiver_id = ?
				)
				and id not in (
					select
						user_id_2
					from 
						friend
					where user_id_1 = ?
				)
			limit 10`;
		try{
			var result = await mysql.query(sql, [req.params.username + '%', req.user.id, req.user.id, req.user.id, req.user.id]);
			res.send(result);
		}
		catch(err){
			next(err);
		}
		next();
	}
);

//Sends a friend request to the username
router.post('/friends/send-request/:username',
	verify.requireParams(['username']),
	async(req, res) => {
		var sql = `
			select 
				id
			from 
				user
			where username = ?`;
		var result = await mysql.query(sql, [req.params.username]);

		//Prevents invalid usernames from having friend requests sent to them
		if (!result[0].id){
			res.status(404).send('This username could not be found to be added.');
			return;
		}

		//Prevents you from sending a friend request to yourself
		if(result[0].id == req.user.id){
			res.status(400).send('You cannot send a friend request to yourself.');
			return;
		}

		var id = result[0].id;

		//Prevents sending friend requests to a user that is already your friend
		sql = `
			select 
				1
			from 
				friend
			where user_id_1 = ?
				and user_id_2 = ?`;
		result = await mysql.query(sql, [id, req.user.id]);
		if(result[0]){
			res.status(400).send('You are already friends with this user.');
			return;
		}

		//Prevents from sending a second friend request or sending a friend request to someone who has sent you a friend request
		sql = `
			select 
				1
			from 
				friend_request
			where sender_id = ?
			  and receiver_id = ?
			union
			select 
				1
			from 
				friend_request
			where sender_id = ?
				and receiver_id = ?`;
		if(result[0]){
			res.status(400).send('There is already a pending friend request for this user');
			return;
		}

		//Creates the friend request
		sql = `
			insert into 
			friend_request(sender_id, receiver_id, request_date)
			select 
				?, 
				?, 
				current_timestamp()`;
		await mysql.query(sql, [req.user.id, id]);
		res.sendStatus(201);
	}
);

//Accepts a friend request from a user
router.post('/friends/accept-request/:username',
	verify.requireParams(['username']),
	async(req, res) => {
		//Makes sure that there actually is a friend request that was sent before accepting it
		var sql = `
			select 
				u.id
			from 
				friend_request fr, 
				user u
			where fr.receiver_id = ?
				and fr.sender_id = u.id
				and u.username = ?`;
		var result = await mysql.query(sql, [req.user.id, req.params.username]);
		if(!result[0]){
			res.status(404).send('You do not have a friend request from this user');
			return;
		}

		//Creates records to establish friendship
		sql = 'insert into friend(user_id_1, user_id_2) select ?, ?;';
		await mysql.query(sql, [req.user.id, result[0].id]);
		//Creates records to establish friendship
		await mysql.query(sql, [result[0].id, req.user.id]);

		//Deletes the friend request as it is no longer needed
		sql = `
			delete from 
				friend_request
			where sender_id = ?
				and receiver_id = ?`;
		await mysql.query(sql, [result[0].id, req.user.id]);
		res.sendStatus(201);
	}
);

//Denies a friend request sent to the user
router.delete('/friends/deny-request/:username',
	verify.requireParams(['username']),
	async(req, res) => {

		//Makes sure that there actually is a friend request that was sent before denying it
		var sql = `
			select 
				u.id
			from 
				friend_request fr, 
				user u
			where fr.receiver_id = ?
				and fr.sender_id = u.id
				and u.username = ?`;
		var result = await mysql.query(sql, [req.user.id, req.params.username]);
		if(!result[0]){
			res.status(404).send('You do not have a friend request from this user');
			return;
		}

		//Deletes the friend request as it is denied
		sql = `
			delete from 
				friend_request
			where sender_id = ?
				and receiver_id = ?`;
		await mysql.query(sql, [result[0].id, req.user.id]);
		res.sendStatus(200);
	}
);

//Cancels a friend request that the user sent
router.delete('/friends/cancel-request/:username',
	verify.requireParams(['username']),
	async(req, res) => {
		//Makes sure that there actually is a friend request that was sent before cancelling it
		var sql = `
			select 
				u.id
			from 
				friend_request fr, 
				user u
			where fr.sender_id = ?
			  and fr.receiver_id = u.id
				and u.username = ?`;
		var result = await mysql.query(sql, [req.user.id, req.params.username]);
		if(!result[0]){
			res.status(404).send('You have not sent a friend request to that user');
			return;
		}

		//Deletes the friend request as it is cancelled
		sql = `
			delete from 
				friend_request
			where sender_id = ?
				and receiver_id = ?`;
		await mysql.query(sql, [req.user.id, result[0].id]);
		res.sendStatus(200);
	}
);

//Delete's the friend relationship between two users
router.delete('/friends/:username',
	verify.requireParams(['username']),
	async (req, res) => {
		//Makes sure that there is a friendship with that username before doing anything with it
		var sql = `
			select 
				u.id
			from 
				friend f, 
				user u
			where user_id_1 = ?
			  and user_id_2 = u.id
				and u.username = ?`;
		var result = await mysql.query(sql, [req.user.id, req.params.username]);
		if (!result[0]){
			res.status(400).send('You are not friends with this user');
			return;
		}

		//Deletes the friendship between the two users
		sql = `
			delete from 
				friend
			where user_id_1 = ?
				and user_id_2 = ?;`;
		await mysql.query(sql, [req.user.id, result[0].id]);
		await mysql.query(sql, [result[0].id, req.user.id]);
		res.sendStatus(200);
	}
);

module.exports = router;
