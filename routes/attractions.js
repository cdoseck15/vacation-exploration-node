var router = require('express').Router();
const mysql = require('../middleware/mysql');
const verify = require('../middleware/verify');
const googleAPI = require('../middleware/googleAPI');

//Gets the list of attractions for a given vacation
router.get('/vacations/:id/attractions',
	async (req, res) => {
		if (!await verify.canViewID('vacation', req.params.id, req, res)){
			return;
		}

		var sql = `
			select id, place_id
			from attraction
			where vacation_id = ?
			order by id`;
		var result = await mysql.query(sql, [req.params.id]);
		var attractions = await Promise.all(
			result.map(async attraction => {
				var value = await googleAPI.getLocation(['place_id', 'name'], attraction.place_id);
				return {
					id: attraction.id,
					location: {...value}
				};
			})
		);
		res.send(attractions);
	}
);

//Posts a new attraction for a given vacation
router.post('/vacations/:id/attractions',
	verify.requireParams(['id']),
	verify.requireBody(['location']),
	async (req, res) => {
		if(!await verify.canEditID('vacation', req.params.id, req, res)){
			return;
		}
		var sql = `
			insert into attraction(vacation_id, place_id)
			select ?, ?`;
		var place_id = await verify.storePlaceID(req.body.location.place_id);
		var result = await mysql.query(sql, [req.params.id, place_id]);
		res.header('Location', result.insertId);
		res.sendStatus(201);
	}
);

//Deletes an attraction for a given vacation and attraction
router.delete('/vacations/:vacation_id/attractions/:attraction_id',
	verify.requireParams(['vacation_id', 'attraction_id']),
	async(req, res) => {
		if(!await verify.canEditID('vacation', req.params.vacation_id, req, res)){
			return;
		}
		if(!await verify.canEditID('attraction', req.params.attraction_id, req, res)){
			return;
		}

		var sql = `
			delete from attraction 
			where vacation_id = ? 
				and id = ?`;
		await mysql.query(sql, [req.params.vacation_id, req.params.attraction_id]);
		res.sendStatus(200);
	}
);

module.exports = router;
