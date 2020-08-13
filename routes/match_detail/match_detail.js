const axios = require('axios')
const util = require('util')

module.exports = async function (fastify, opts, done) {
	
	const fastapi_ip = fastify.fastapi_ip
	
	fastify.get('/match_detail/:match_id/', async (req, res) => {

		let url = `http://${fastapi_ip}:8000/match_detail/${req.params.match_id}/`

		await axios.post(url).then(function (api_response) {
			let urls = []
			let platform = api_response.data.telemetry_data.platform
			let player_name = api_response.data.telemetry_data.player_data.player_name
			urls.push({href: `/user/${player_name}/platform/${platform}/`, text: `${player_name}'s profile`})

			return res.code(200).view('match_detail.html', {
				telemetry_data: api_response.data.telemetry_data,
				base_address: fastify.base_address,
				urls: urls
			})
		}).catch(function (api_response) {
			return res.code(500).view('error.html', {
				error: error
			})
		})
	})

	done()

}