const axios = require('axios')

module.exports = async function (fastify, opts, done) {

	const fastapi_ip = fastify.fastapi_ip

	fastify.post('/retrieve_season_stats', async(req, res) => {

		let player_obj = {
			api_id: req.body.player_id,
			perspective: req.body.perspective,
			platform: req.body.platform,
			ranked: req.body.ranked
		}

		await axios.post(`http://${fastapi_ip}:8000/retrieve_season_stats/`, player_obj).then(function (api_response) {
			return res.code(200).send(api_response.data)
		}).catch(function (error) {
			return res.code(500).view('error.html', {
				error: error
			})
		})

	})

	done()
}