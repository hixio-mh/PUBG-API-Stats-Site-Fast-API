from fastapi import FastAPI
from tortoise.contrib.starlette import register_tortoise
import asyncio
from models import *

def init(app):
	"""
	Init routers and etc.
	:return:
	"""
	init_db(app)

def init_db(app):
	"""
	Init database models.
	:param app:
	:return:
	"""
	register_tortoise(
		app,
		config={
			"connections": {
				"default": {
					"engine": "tortoise.backends.mysql",
					"credentials": {
						"database": 'local2',
						"host": "127.0.0.1",
						"password": None,
						"port": 3306,
						"user": "root"
					}
				}
			},
			"apps": {
				'api': {
					"models": ["models"],
					"default_connection": "default",
				}
			},
		},
		generate_schemas=True
	)