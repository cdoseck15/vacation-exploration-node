var router = require('express').Router();
const mysql = require('../middleware/mysql');
const verify = require('../middleware/verify');
const googleAPI = require('../middleware/googleAPI');

//Used to get a list of vacations for a User, Friends, or Public
router.get('/:status',
	verify.requireParams(['status']),
	async (req, res) => {
		var offset;
		var params = [];
		const pageSize = 2;

		var sql = `
		select
			v.id,
			user_id,
			place_id,
			rating,
			details,
			start_date,
			end_date,
			is_public,
			u.username
		from
			vacation v,
			user u
		where u.id = v.user_id `;
		//Different statuses will change the sql. Must be one of the three
		if (req.params.status.toLowerCase() == 'public'){
			sql = sql + 'and is_public = 1 ';
			if (req.user){
				sql = sql + 'and user_id <> ? ';
				params = [req.user.id];
			}
		}
		else if (req.params.status.toLowerCase() == 'friends'){
			sql = sql + `
				and u.id in (
					select user_id_1
					from user_friend
					where user_id_2 = ?
				) `;
			params = [req.user.id];
		}
		else if (req.params.status.toLowerCase() == 'user'){
			sql = sql + 'and u.id = ? ';
			params = [req.user.id];
		}
		else{
			res.status(400).send('The status of vactions must be public, friends, or user');
		}

		//Only want to return a certain number of vacations per request as they likely won't want that many
		if (req.query.page){
			offset = req.query.page * pageSize;
		}
		else {
			offset = 0;
		}

		sql = sql + ' limit ?, ?';
		params.push(offset, pageSize);

		var result = await mysql.query(sql, params);

		var vacations = await Promise.all(result.map(async vacation => {
			const location = await googleAPI.getLocation(['place_id', 'name', 'geometry'], vacation.place_id);
			vacation.location = {
				name: location.name,
				place_id: location.place_id,
				lat: location.geometry.location.lat,
				lng: location.geometry.location.lng
			};
			delete vacation.place_id;
			return vacation;
		}));
		res.send(vacations);
	}
);

//Used to Post a vacation
router.post('/',
	verify.requireBody(['location', 'rating', 'start_date', 'end_date', 'details', 'is_public']),
	verify.requireUser(),
	async (req, res) => {
		var place_id = await verify.storePlaceID(req.body.location.place_id);
		var sql =  req.body.id ? '' :	`
			insert into vacation(
				user_id,
				place_id,
				rating,
				start_date,
				end_date,
				details,
				is_public
			)
			select ?, ?, ?, ?, ?, ?, ?`;
		var result = await mysql.query(sql, [
			req.user.id,
			place_id,
			req.body.rating,
			req.body.start_date,
			req.body.end_date,
			req.body.details,
			req.body.is_public
		]);
		res.header('Location', result.insertId);
		res.sendStatus(201);
	}
);

//Used to update a vacation
router.put('/:id',
	verify.requireParams(['id']),
	verify.requireBody(['location', 'rating', 'start_date', 'end_date', 'details', 'is_public']),
	async (req, res) => {
		if(!await verify.canEditID('vacation', req.params.id, req, res)){
			return;
		}
		var place_id = await verify.storePlaceID(req.body.location.place_id);

		var sql = `
			update vacation
			set
				place_id = ?,
				rating = ?,
				start_date = ?,
				end_date = ?,
				details = ?,
				is_public = ?
			where id = ?`;
		await mysql.query(sql, [
			place_id,
			req.body.rating,
			req.body.start_date,
			req.body.end_date,
			req.body.details,
			req.body.is_public,
			req.params.id
		]);

		res.sendStatus(200);
	}
);

//Used to delete a vacation
router.delete('/:id',
	verify.requireParams(['id']),
	async(req, res) => {
		if(!await verify.canEditID('vacation', req.params.id, req, res)){
			return;
		}

		var sql = 'delete from attraction where vacation_id = ?';
		await mysql.query(sql, [req.params.id]);

		sql = 'delete from vacation where id = ?';
		await mysql.query(sql, [req.params.id]);
		res.sendStatus(200);
	}
);

module.exports = router;
