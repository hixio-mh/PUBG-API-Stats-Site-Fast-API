const axios = require('axios')
const constants = require('../../constants')

module.exports = async function (fastify, opts, done) {
	
	const fastapi_ip = fastify.fastapi_ip
	
	fastify.get('/leaderboards/:platform', async (req, res) => {

		let platform = req.params.platform

		let url = `http://${fastapi_ip}:8000/seasons_for_platform/`
		
		await axios.post(url, { platform: platform }).then(function (api_response) {
			let seasons = api_response.data
			let game_modes = [
				{
					value: 'solo',
					text: 'SOLO'
				},
				{
					value: 'solo-fpp',
					text: 'SOLO FPP'
				},
				{
					value: 'duo',
					text: 'DUO'
				},
				{
					value: 'duo-fpp',
					text: 'DUO FPP'
				},
				{
					value: 'squad',
					text: 'SQUAD'
				},
				{
					value: 'squad-fpp',
					text: 'SQUAD FPP'
				}
			]
			
			let regions = constants.PLATFORM_REGION_SELECTIONS.filter((item, index, array) => {
				if(platform == 'steam'){
					return item.value.includes('pc') || item.value == ''
				} else {
					return item.value.includes(platform)  || item.value == ''
				}
			})
			
			return res.code(200).view('leaderboards.html', {
				season_selections: seasons,
				game_mode_selection: game_modes,
				region_selection: regions,
				base_address: fastify.base_address,
				platform: platform
			})
		}).catch(function (error) {
			return res.code(500).view('error.html')
		})
		
	})

	fastify.get('/leaderboards/:platform/:season_id/:game_mode/', async (req, res) => {

		let platform = req.params.platform
		let season_id = req.params.season_id
		let game_mode = req.params.game_mode

		let url = `http://${fastapi_ip}:8000/leaderboards/`

		await axios.post(url, { platform: platform, season_id: season_id, game_mode: game_mode }).then(function (api_response) {
			return res.code(200).send(api_response.data)
		}).catch(function (error) {
			return res.code(500).view('error.html', {
				error: error
			})
		})
		
	})

	done()

}