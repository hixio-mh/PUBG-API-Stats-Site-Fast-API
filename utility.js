const axios = require('axios')

async function checkStatusPromise(django_ip){
	return await axios.get(`http://${django_ip}:8000/status/`)
	.then(api_response => {
		if(api_response.status == 200 && api_response.data.status == 'OK'){
			return true
		} else {
			return false
		}
	})
	.catch(error => {
		return false
	})
}

function checkStatusLog(django_ip){
	let url = `http://${django_ip}:8000/status/`

	axios.get(url)
	.then(api_response => {
		if(api_response.status == 200 && api_response.data.status == 'OK'){
			console.log(`Backend Django service up and running on port ${8000}!`)
		}
	})
	.catch(error => {
		console.log(`Seems Backend services are down...`)
	})
}

function checkStatusReturn(django_ip){
	axios.get(`http://${django_ip}:8000/status/`)
	.then(api_response => {
		if(api_response.status == 200 && api_response.data.status == 'OK'){
			return false
		}
	})
	.catch(error => {
		return true
	})
}

module.exports = {
	checkStatusPromise: checkStatusPromise,
	checkStatusLog: checkStatusLog,
	checkStatusReturn: checkStatusReturn
}