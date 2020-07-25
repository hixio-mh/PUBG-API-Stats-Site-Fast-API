const axios = require('axios')

module.exports = async function (fastify, opts, done) {

	const django_ip = fastify.django_ip

	fastify.post('/retrieve_season_stats', async(req, res) => {

		let player_obj = {
			api_id: req.body.player_id,
			perspective: req.body.perspective,
			platform: req.body.platform,
			ranked: req.body.ranked
		}

		await axios.post(`http://${django_ip}:8000/retrieve_season_stats/`, player_obj).then(function (api_response) {
			return res.code(200).send(api_response.data)
		}).catch(function (api_response) {
			return res.code(500).view('error.html')
		})

	})

	done()
}