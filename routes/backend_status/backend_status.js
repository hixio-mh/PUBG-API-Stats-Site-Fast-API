const utlity = require('../../utility')
const axios = require('axios')

module.exports = async function (fastify, opts, done) {
	
	fastify.get('/backend_status', async(req, res) => {

		await utlity.checkStatusPromise()
		.then(function(result) {
			return result
		})

	})

	done()
}