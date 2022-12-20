const mysql = require('./mysql');
const googleAPI = require('./googleAPI');

//Makes sure that there is a user logged in
module.exports.requireUser = () => {
	return (req, res, next) => {
		if(!req.user){
			res.sendStatus(401);
			return;
		}
		next();
	};
};

//Makes sure wanted query values exist
module.exports.requireQueries =  (queries) => {
	return (req, res, next) => {
		for(var i = 0; i < queries.length; i++){
			if (!(queries[i] in req.query)){
				res.status(400).send('Must include ' + queries[i] + ' in the query');
				return;
			}
		}
		next();
	};
};

//Makes sure wanted param values exist
module.exports.requireParams =  (params) => {
	return (req, res, next) => {
		for(var i = 0; i < params.length; i++){
			if (!(params[i] in req.params)){
				res.status(400).send('Must include ' + params[i] + ' in the params');
				return;
			}
		}
		next();
	};
};

//Makes sure wanted body values exist
module.exports.requireBody =  (body) => {
	return (req, res, next) => {
		for(var i = 0; i < body.length; i++){
			if (!(body[i] in req.body)){
				res.status(400).send('Must include ' + body[i] + ' in the body');
				return;
			}
		}
		next();
	};
};

//This funciton is centralized logic that will respond with a 403 unauthorized if the id is not valid for the user to view
module.exports.canViewID = async (table, id, req, res) => {
	var sql;
	var params;

	if(table.toLowerCase() == 'vacation'){
		sql = `
			select 1
			from vacation
			where id = ?
			  and (is_public = 1
		`;
		params = [id];

		//Only need to check the user if a user is logged in. Otherwise only have to check if it's public or not
		if (req.user) {
			sql = sql + `
			  or user_id = ?
				or user_id in (
					select user_id_1
					from friend
					where user_id_2 = ?
				)
			`;
			params.push(req.user.id, req.user.id);
		}
		sql = sql + ')';
	}
	else{
		throw 'Invalid use of canViewID function';
	}

	//If no records are returned from the query then it is unauthorized
	var result = (await mysql.query(sql, params))[0];
	if(!result){
		res.sendStatus(403);
	}
	return result;
};

//This funciton is centralized logic that will respond with a 403 unauthorized if the id is not valid for the user to edit
module.exports.canEditID = async (table, id, req, res) => {
	var sql;
	var params;

	//There are no values that anyone that isn't logged in is able to edit
	if(!req.user){
		res.sendStatus(401);
		return false;
	}

	if(table.toLowerCase() == 'vacation'){
		sql = `
			select 1
			from vacation
			where id = ?
			  and user_id = ?
		`;
		params = [id, req.user.id];
	}
	else if(table.toLowerCase() == 'attraction'){
		sql = `
			select 1
			from
			  attraction a,
			  vacation v
			where a.id = ?
			  and a.vacation_id = v.id
			  and v.user_id = ?`;
		params = [id, req.user.id];
	}
	else{
		throw 'Invalid use of canEditID function';
	}

	//If no records are returned from the query then it is unauthorized
	var result = (await mysql.query(sql, params))[0];
	if(!result){
		res.sendStatus(403);
	}
	return result;
};

//Chekcs the place_id age and stores a new one if it is over 180 days old
module.exports.storePlaceID = async (place_id) => {
	const insertSQL = `
		insert into place_id(place_id, refresh_date)
		select ?, current_timestamp`;

	var sql = `
		select datediff(refresh_date, current_timestamp) days_old
		from place_id
		where place_id = ?`;
	var result = await mysql.query(sql, [place_id]);
	//If this place_id exists already check if it needs updated.
	//If it dosn't exist then create it
	//Have to wait on queries so that the new place_id is in the database before we do anything with it
	if(result[0]){
		//If the place_id is over 180 days old it could use refreshing
		if(result[0].days_old > 180){
			var newPlaceID = googleAPI.refreshedPlaceID(place_id);
			//Update everything stored to the new place_id
			if(newPlaceID != place_id){
				//Have to insert new ID first so that we don't break foreign key constraints
				await mysql.query(insertSQL, [newPlaceID]);

				//Update existing tables that have the place_id in them to the new place_id
				sql = `
					update vacation
					set place_id = ?
					where place_id = ?`;
				await mysql.query(sql, [newPlaceID, place_id]);

				sql = `
					update attraction
					set place_id = ?
					where place_id = ?`;
				await mysql.query(sql, [newPlaceID, place_id]);

				//Delete old place_id as it is not valid anymore
				sql = `
					delete from place_id
					where place_id = ?`;
				await mysql.query(sql, [place_id]);
			}
			//ID hasn't changed so update the timestamp in the database
			else{
				sql = `
				update place_id
				set refresh_date = current_timestamp
				where place_id = ?`;
				await mysql.query(sql, [newPlaceID, place_id]);
				return place_id;
			}
		}
		//Doesn't need refreshed
		else{
			return place_id;
		}
	}
	//No id found so insert it into db
	else{
		await mysql.query(insertSQL, [place_id]);
		return place_id;
	}
};
