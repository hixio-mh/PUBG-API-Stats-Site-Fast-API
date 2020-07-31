from tortoise import models
from tortoise import fields
from datetime import datetime

######################################################
# Tortoise Models
######################################################
class Map(models.Model):
	''' 
		This defines a Map from the PUBG API 
	'''

	id = fields.IntField(pk=True)
	name = fields.CharField(max_length=64)
	reference = fields.CharField(max_length=64)
	image_url = fields.CharField(max_length=255, null=True, blank=True)

	def __str__(self):
		return "{} ({})".format(self.name, self.reference)

class Match(models.Model):
	''' 
		This defines a Match from the PUBG API
	'''

	id = fields.IntField(pk=True)
	api_id = fields.CharField(max_length=255, unique=True)
	match_type = fields.CharField(max_length=255, null=True)
	created = fields.DatetimeField()
	api_url = fields.CharField(max_length=255)
	mode = fields.CharField(max_length=255, null=True)
	map = fields.ForeignKeyField('api.Map', on_delete=fields.CASCADE)
	is_custom_match = fields.IntField(null=True)
	total_teams = fields.IntField(null=True)

	def __str__(self):
		return "{} - {}".format(self.api_id, self.map.name)

class Cache(models.Model):
	''' 
		This is the database cache, this holds data such as cached player data
	'''

	id = fields.IntField(pk=True)
	cache_key = fields.CharField(max_length=255, unique=True)
	content = fields.TextField()
	expires = fields.DatetimeField()

	def is_expired(self):
		return self.expires < datetime.utcnow()

	def __str__(self):
		return "{} - {}".format(self.cache_key, self.expires)

class MatchParticipant(models.Model):
	''' 
		This defines a Participant in a give Match from the PUBG API
	'''

	id = fields.IntField(pk=True)
	match = fields.ForeignKeyField('api.Match', on_delete=fields.CASCADE)
	participant = fields.ForeignKeyField('api.Participant', on_delete=fields.CASCADE)

	def __str__(self):
		return "{} - {}".format(self.match.api_id, self.participant.player_name)

class Participant(models.Model):
	''' 
		This defines a Participant of a Match
	'''

	id = fields.IntField(pk=True)
	api_id = fields.CharField(max_length=255)
	player_name = fields.CharField(max_length=255)
	damage = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	kills = fields.IntField(null=True)
	knocks = fields.IntField(null=True)
	placement = fields.IntField(null=True)
	player = fields.ForeignKeyField('api.Player', on_delete=fields.CASCADE, null=True)
	is_ai = fields.BooleanField(default=False, null=True)

	swim_distance = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	ride_distance = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	walk_distance = fields.DecimalField(max_digits=10, decimal_places=2, null=True)

	def __str__(self):
		return "{} - {}".format(self.api_id, self.player_name)

class Player(models.Model):
	''' 
		This defines a Player from the PUBG API
	'''

	id = fields.IntField(pk=True)
	api_id = fields.CharField(max_length=255)
	platform_url = fields.CharField(max_length=255, null=True)
	api_url = fields.CharField(max_length=255)

	def __str__(self):
		return self.api_id

class PlayerSeasonStats(models.Model):
	''' 
		This defines a give Players Season Stats that have been pulled from the PUBG API
	'''

	id = fields.IntField(pk=True)
	mode = fields.CharField(max_length=255, null=True)
	assists = fields.IntField(null=True)
	boosts = fields.IntField(null=True)
	knocks = fields.IntField(null=True)
	daily_kills = fields.IntField(null=True)
	damage_dealt = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	days = fields.IntField(null=True)
	daily_wins = fields.IntField(null=True)
	headshot_kills = fields.IntField(null=True)
	heals = fields.IntField(null=True)
	kill_points = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	kills = fields.IntField(null=True)
	longest_kill = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	longest_time_survived = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	losses = fields.IntField(null=True)
	max_kill_streaks = fields.IntField(null=True)
	most_survival_time = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	rank_points = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	rank_points_title = fields.CharField(max_length=255, null=True)
	revives = fields.IntField(null=True)
	ride_distance = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	road_kills = fields.IntField(null=True)
	round_most_kills = fields.IntField(null=True)
	rounds_played = fields.IntField(null=True)
	suicides = fields.IntField(null=True)
	swim_distance = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	team_kills = fields.IntField(null=True)
	time_survived = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	top_10s = fields.IntField(null=True)
	vehicle_destroys = fields.IntField(null=True)
	walk_distance = fields.DecimalField(max_digits=10, decimal_places=2, null=True)
	weapons_acquired = fields.IntField(null=True)
	weekly_kills = fields.IntField(null=True)
	weekly_wins = fields.IntField(null=True)
	win_points = fields.IntField(null=True)
	wins = fields.IntField(null=True)
	player = fields.ForeignKeyField('api.Player', on_delete=fields.CASCADE, null=True)
	season = fields.ForeignKeyField('api.Season', on_delete=fields.CASCADE)
	
	is_ranked = fields.BooleanField(default=False, null=True)

	def __str__(self):
		return "{} - {}".format(self.player.name, self.season.api_id)

class Roster(models.Model):
	''' 
		This defines a give Roster in a given Match
	'''

	id = fields.IntField(pk=True)
	api_id = fields.CharField(max_length=255)
	placement = fields.IntField(null=True)
	match = fields.ForeignKeyField('api.Match', on_delete=fields.CASCADE)
	participants = fields.ManyToManyField('api.Participant', through='Rosterparticipant')

	def __str__(self):
		return f"{self.api_id} - {self.match.api_id}"

class RosterParticipant(models.Model):
	''' 
		This defines a give Participant from a Roster in a given Match
	'''

	id = fields.IntField(pk=True)
	participant = fields.ForeignKeyField('api.Participant', on_delete=fields.CASCADE)
	roster = fields.ForeignKeyField('api.Roster', on_delete=fields.CASCADE)

	def __str__(self):
		return f"{self.id}"

class Season(models.Model):
	''' 
		This defines a give PUBG Season
	'''

	id = fields.IntField(pk=True)
	api_id = fields.CharField(max_length=255)
	is_current = fields.IntField(null=True)
	is_off_season = fields.IntField(null=True)
	api_url = fields.CharField(max_length=255)
	platform = fields.CharField(max_length=255)
	requires_region_shard = fields.BooleanField(default=False)
	
	def __str__(self):
		if self.is_current:
			return "{} - {} - {}".format(self.api_id, self.platform, 'Current')
		else:
			return "{} - {} - {}".format(self.api_id, self.platform, 'Not current')

class Telemetry(models.Model):
	''' 
		This defines the Telemtry for a given match
	'''

	id = fields.IntField(pk=True)
	api_id = fields.CharField(max_length=255)
	api_url = fields.CharField(max_length=255)
	created_at = fields.DatetimeField()
	match = fields.ForeignKeyField('api.Match', on_delete=fields.CASCADE)

	def __str__(self):
		return f"{self.api_id} - {self.match.api_id}"

class TelemetryEvent(models.Model):
	''' 
		This defines a Event for a matches Telemetry
	'''

	id = fields.IntField(pk=True)
	event_type = fields.CharField(max_length=255)
	timestamp = fields.CharField(max_length=255, null=True)
	description = fields.CharField(max_length=1000)
	telemetry = fields.ForeignKeyField('api.Telemetry', on_delete=fields.CASCADE)
	player =  fields.ForeignKeyField('api.Player', on_delete=fields.CASCADE, null=True)
	killer_x_cord = fields.FloatField(null=True) 
	killer_y_cord = fields.FloatField(null=True) 
	victim_x_cord = fields.FloatField(null=True) 
	victim_y_cord = fields.FloatField(null=True) 

	def __str__(self):
		return f"{self.timestamp} - {self.event_type} - {self.description}"

class ItemTypeLookup(models.Model):
	''' 
		This defines the Tyypes of Items from the PUBG API, that is used within the Telemetry
	'''

	id = fields.IntField(pk=True)
	name = fields.CharField(max_length=255)
	reference = fields.CharField(max_length=255)

	def __str__(self):
		return self.name

class TelemetryRoster(models.Model):
	''' 
		This defines a Roster from the Telemetry
	'''

	id = fields.IntField(pk=True)
	json = fields.JSONField()
	telemetry = fields.ForeignKeyField('api.Telemetry', on_delete=fields.CASCADE, null=True)

	def __str__(self):
		return self.json