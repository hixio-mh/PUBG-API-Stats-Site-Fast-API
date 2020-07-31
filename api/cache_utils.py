from models import Cache
from datetime import datetime, timedelta
import base64

async def get_from_cache(cache_key):

	import pickle

	cache = await Cache.filter(cache_key=cache_key).first()

	if cache:

		if cache.expires < datetime.utcnow():

			await cache.delete()

		else:

			cache_content = cache.content
			cache_content = pickle.loads(base64.b64decode(cache_content.encode()))
			return cache_content

	return None

async def delete_from_cache(cache_key):

	await Cache.filter(cache_key=cache_key).delete()

	return True

async def cache_touch(cache_key, minutes):

	cache = await Cache.filter(cache_key=cache_key).first()

	if cache:

		expires = cache.expires + timedelta(minutes=minutes)

		cache.expires = expires
		await cache.save()
		return True

	return False

async def create_cache(cache_key, content, minutes=30):

	import pickle

	pickle_protocol = pickle.HIGHEST_PROTOCOL

	cache = Cache.filter(cache_key=cache_key)
	cache_exists = await cache.exists()

	if not cache_exists:

		expires = datetime.utcnow() + timedelta(minutes=minutes)
		pickled = pickle.dumps(content, pickle_protocol)
		b64encoded = base64.b64encode(pickled).decode('latin1')

		try:
			cache = Cache(
				cache_key=cache_key,
				content=b64encoded,
				expires=expires
			)

			await cache.save()
			return True
		except:
			return False

	return False