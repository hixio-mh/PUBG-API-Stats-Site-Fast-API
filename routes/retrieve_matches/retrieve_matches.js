const axios = require('axios')

module.exports = async function (fastify, opts, done) {

	const fastapi_ip = fastify.fastapi_ip

	fastify.post('/retrieve_matches', async(req, res) => {
		
		let player_obj = {
			api_id: req.body.player_id,
			game_mode: req.body.game_mode,
			perspective:  req.body.perspective,
			platform: req.body.platform,
			times_requested: req.body.times_requested,
			seen_match_ids: req.body.seen_match_ids
		}

		await axios.post(`http://${fastapi_ip}:8000/retrieve_matches/`, player_obj).then(function (api_response) {
			return res.code(200).send({
				message: api_response.data.message,
				data: api_response.data.data,
				player_id: api_response.data.api_id,
				error: api_response.data.error
			})
		}).catch(function (error) {
			return res.code(500).view('error.html', {
				error: error
			})
		})

	})

	done()

}