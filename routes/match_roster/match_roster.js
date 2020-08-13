const axios = require('axios')

module.exports = async function (fastify, opts, done) {

	const fastapi_ip = fastify.fastapi_ip

	fastify.get('/match_rosters/:match_id/', async (req, res) => {

		let url = `http://${fastapi_ip}:8000/match_rosters/`
		
		await axios.post(url, { match_id: req.params.match_id }).then(function (api_response) {
			return res.code(200).send({
				rosters: api_response.data,
				base_address: fastify.base_address
			})
		}).catch(function (error) {
			return res.code(500).view('error.html', {
				error: error
			})
		})
	
	})

	done()

}