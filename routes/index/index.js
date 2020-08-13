const constants = require('../../constants')
const axios = require('axios')

module.exports = async function (fastify, opts, done) {

	const fastapi_ip = fastify.fastapi_ip

	fastify.get('/', async(req, res) => {

		return res.code(200).view('search.html', {
			platform_selections: constants.PLATFORM_SELECTIONS,
			base_address: fastify.base_address
		})

	})

	fastify.get('/user/:player_name/', async(req, res) => {	
		
		let player_name = req.params.player_name

		let player_object = {
			href: `user/${player_name}/`,
			text: `${player_name}'s profile` 
		}
		let urls = [player_object]

		let url = `http://${fastapi_ip}:8000/player/`

		await axios.post(url, { player_name: player_name }).then(function (api_response) {

			let account_id = api_response.data.api_id
			let platform = api_response.data.platform
			
			return res.code(200).view('index.html', {
				platform_selections: constants.PLATFORM_SELECTIONS,
				gamemode_selections: constants.GAMEMODE_SELECTIONS,
				perspective_selections: constants.PERSPECTIVE_SELECTIONS,
				base_address: fastify.base_address,
				player_name: player_name,
				platform: platform,
				urls: urls,
				account_id: account_id
			}) 

		}).catch(function (error) {
			return res.code(500).view('error.html', {
				error: error
			})
		})

	})

	done()
}