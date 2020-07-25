const fastify = require('fastify')({
	logger: true
})
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const { checkStatusLog } = require('./utility')

const django_ip = argv.django_ip || '127.0.0.1'
const base_address = argv.base_address || '127.0.0.1'

fastify.decorate('django_ip', django_ip)
fastify.decorate('base_address', base_address)

fastify.register(require('fastify-formbody'))
fastify.register(require('point-of-view'), {
	engine: {
		nunjucks: require('nunjucks')
	},
	templates: './templates/',
	includeViewExtension: false
})
fastify.register(require('fastify-static'), {
	root: path.join(__dirname, 'static'),
	prefix: '/static/'
})

// routes
fastify.register(require('./routes/index/index'))
fastify.register(require('./routes/search/search'))
fastify.register(require('./routes/retrieve_season_stats/retrieve_season_stats'))
fastify.register(require('./routes/retrieve_matches/retrieve_matches'))
fastify.register(require('./routes/backend_status/backend_status'))
fastify.register(require('./routes/match_detail/match_detail'))
fastify.register(require('./routes/match_roster/match_roster'))
fastify.register(require('./routes/leaderboards/leaderboards'))


fastify.listen(7009, async function (err, address){
	if (err) {
		console.error(err)
		process.exit(1)
	}
	console.log(`NodeJS up and running on port ${address}!`)
	checkStatusLog(django_ip)
})

module.exports.django_ip = django_ip