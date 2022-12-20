var router = require('express').Router();
const mysql = require('../middleware/mysql');
const verify = require('../middleware/verify');

//Used to get a static text given a description of the text
router.get('/:description', 
	verify.requireParams(['description']),
	async (req, res) => {
		var sql = `
			select 
				text 
			from 
				static_texts 
			where description = ?`;
		var result = await mysql.query(sql, [req.params.description]);
		res.send(result[0]);
	}
);

module.exports = router;