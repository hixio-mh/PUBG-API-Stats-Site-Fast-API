const constants = require('../../constants')

module.exports = async function (fastify, opts, done) {

	fastify.get('/', async(req, res) => {

		return res.code(200).view('search.html', {
			platform_selections: constants.PLATFORM_SELECTIONS,
			base_address: fastify.base_address
		})

	})

	fastify.get('/user/:player_name/platform/:platform/', async(req, res) => {	
		
		let player_name = req.params.player_name
		let platform = req.params.platform

		let player_object = {
			href: `/user/${player_name}/platform/${platform}/`,
			text: `${player_name}'s profile` 
		}
		let urls = [player_object]

		return res.code(200).view('index.html', {
			platform_selections: constants.PLATFORM_SELECTIONS,
			gamemode_selections: constants.GAMEMODE_SELECTIONS,
			perspective_selections: constants.PERSPECTIVE_SELECTIONS,
			base_address: fastify.base_address,
			player_name: player_name,
			platform: platform,
			urls: urls
		}) 
	})

	done()
}