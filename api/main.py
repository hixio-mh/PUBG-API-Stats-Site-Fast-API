import sys
from functions import (
	build_url, build_lifetime_url, make_request, correct_perspective, correct_mode,
	build_player_url, get_player_matches, retrieve_player_season_stats, build_player_account_id_url,
	make_request, build_match_url, get_match_telemetry_from_match, get_match_data, create_leaderboard_for_match, get_player_match_id,
	parse_player_matches,  player_placement_format, get_platform, build_leaderboard_url
)

from models import *

from datetime import datetime, timedelta
import time

import settings as api_settings

from tortoise import Tortoise, run_async
from tortoise.query_utils import Q
from fastapi import FastAPI, BackgroundTasks, HTTPException
from initialiser import init
import base64
import route_models
from dateutil.parser import parse

from cache_utils import *

import json
import asyncio

app = FastAPI(
	title='PUBG API FastAPI Wrapper',
	description='Created by Luke Elam. Open Source PUBG Stats site for Console and PC. GitHub: https://github.com/dstlny/PUBG-API-Stats-Site-Fast-API',
	version='1.0',
	docs_url=None,
	redoc_url=None
)
init(app)

@app.get("/status/")
async def status():
	return {"status": "OK"}

@app.post("/search/")
async def search(parameters: route_models.Player, background_tasks: BackgroundTasks):

	start_time = time.time()

	platform = parameters.platform
	player_name = parameters.player_name

	player_response_cache_key = api_settings.PLAYER_RESPONSE_CACHE_KEY.format(player_name, platform)

	cached_player_response = await get_from_cache(player_response_cache_key)

	if cached_player_response:
		return cached_player_response

	player_request_cache_key = api_settings.PLAYER_REQUEST_CACHE_KEY.format(player_name, platform)

	platform_url = build_url(platform)
	player_url = build_player_url(base_url=platform_url, player_name=player_name)

	cached_player_request = await get_from_cache(player_request_cache_key)

	if not cached_player_request or 'data' not in cached_player_request:
		player_request = make_request(player_url)
		await create_cache(
			cache_key=player_request_cache_key,
			content=player_request,
			minutes=30
		)
	else:
		player_request = cached_player_request

	ajax_data = {}

	if 'data' in player_request:

		api_ids = await Match.all().only('api_id').distinct().values_list('api_id', flat=True)

		if isinstance(player_request['data'], list):
			player_id = player_request['data'][0]['id']
			player_data_length = (
				len(player_request['data'][0]['relationships']['matches']['data']),
				[
					match for match in player_request['data'][0]['relationships']['matches']['data'] if get_player_match_id(player_id, match['id']) not in api_ids
				]
			) 
		else:
			player_id = player_request['data']['id']
			player_data_length = (
				len(player_request['data']['relationships']['matches']['data']),
				[
					match for match in player_request['data']['relationships']['matches']['data'] if get_player_match_id(player_id, match['id']) not in api_ids
				]
			) 

		if player_data_length[0] > 0:

			ajax_data['player_id'] = player_id
			ajax_data['player_name']  = player_name
			length_of_matches = len(player_data_length[1])
			matches = player_data_length[1]

			if length_of_matches > 0:

				ajax_data['currently_processing'] = True
				background_tasks.add_task(
					get_player_matches,
					player_id,
					platform_url,
					matches
				)

			else:
				ajax_data['message'] =  "No new matches to process for this user."
				ajax_data['no_new_matches'] = True

		else:
			ajax_data['error'] = "Sorry, looks like this player has not played any matches in the last 14 days."

	else:
		ajax_data['error'] = "Sorry, looks like this player does not exist."

	await create_cache(
		cache_key=player_response_cache_key,
		content=ajax_data,
		minutes=2
	)

	return ajax_data

@app.post("/retrieve_matches/")
async def retrieve_matches(parameters: route_models.Player):
	
	api_id = parameters.api_id
	current_player = await Player.filter(api_id=api_id).first()

	if current_player:

		match_data_cache_key = api_settings.PLAYER_MATCH_DATA_CACHE_KEY.format(api_id)
		match_data = await get_match_data(api_id, current_player.id)
		match_data_count = await match_data.count()
		match_data_exists = await match_data.exists()

		cached_ajax_data  = await get_from_cache(match_data_cache_key)

		if cached_ajax_data:
			if not(match_data_count > len(cached_ajax_data['data'])):
				return cached_ajax_data
		
		ajax_data = {}

		if match_data_exists:

			from ago import human
			import time

			match_ids =  await match_data.distinct().values_list('match_id', flat=True)
			match_data = await match_data

			ajax_data = {
				'data':[
					{	
						'id': roster.match.id,
						'map': roster.match.map.name if roster.match.map else None,
						'mode': f'{roster.match.mode.upper()}<br>' + '<span class="badge badge-success">Ranked</span>' if roster.match.match_type and 'comp' in roster.match.match_type  else f'{roster.match.mode.upper()}<br><span class="badge badge-secondary">Not Ranked</span>',
						'raw_mode': f'{roster.match.mode.upper()}',
						'date_created': {
							'display': datetime.strftime(roster.match.created, '%d/%m/%Y %H:%M:%S'), ## this is what will display in the datatable.
							'timestamp': datetime.timestamp(roster.match.created) ## this is what the datatable will sort by
						},
						'time_since': human(roster.match.created),
						'team_details': ''.join(
							[
								f"{x.player_name}: {x.kills} kill(s) | {x.damage} damage<br>" for x in await roster.participants.all()
							]
						),
						'team_details_object': [
							{
								'kills': x.kills,
								'player_name': x.player_name,
								'damage': x.damage
							} async for x in roster.participants
						],
						'team_placement': player_placement_format(roster.match.total_teams, roster.placement),
						'actions': f'<a href="/match_detail/{roster.match.api_id}/" class="btn btn-link btn-sm active" role="button">View Match</a>',
						'btn_link': f"/match_detail/{roster.match.api_id}/"
					} for roster in match_data
				],
				'api_id': current_player.api_id,
				'match_ids': match_ids
			}

			await create_cache(
				cache_key=match_data_cache_key,
				content=ajax_data,
				minutes=0.1
			)

		else:

			message = "It would seem no TPP/FPP (SOLO, DUO, SQUAD) matches exist for this user for the last 14 days."

			ajax_data = {
				'error': message,
				'api_id': api_id
			}

		return ajax_data

	else:

		raise HTTPException(status_code=404, detail="No player with id {} found".format(api_id))
 
@app.post("/retrieve_season_stats/")
async def retrieve_season_stats(parameters: route_models.Player):

	api_id = parameters.api_id
	is_ranked = parameters.ranked
	platform = parameters.platform

	if is_ranked:
		season_stats_cache_key = api_settings.PLAYER_RANKED_SEASON_STATS_CACHE_KEY.format(api_id)
	else:
		season_stats_cache_key = api_settings.PLAYER_SEASON_STATS_CACHE_KEY.format(api_id)

	cached_ajax_data  = await get_from_cache(season_stats_cache_key)

	if cached_ajax_data:
		return cached_ajax_data

	current_player = await Player.filter(api_id=api_id).first()

	await retrieve_player_season_stats(api_id,  platform, is_ranked)

	season_stats_queryset = await PlayerSeasonStats.filter(
		player_id=current_player.id,
		season__is_current=True,
		season__platform=platform,
		is_ranked=is_ranked
	).prefetch_related('season', 'player')

	if is_ranked:

		ajax_data = [
			{
				f"ranked_{x.mode.lower().replace('-', '_')}_season_stats": correct_mode(x.mode.replace('_', ' ')).upper(),
				f"ranked_{x.mode.lower().replace('-', '_')}_season_matches": "{} {}".format(x.rounds_played, 'Matches Played'),
				f"ranked_{x.mode.lower().replace('-', '_')}_season_kills__text": 'Overall Kills',
				f"ranked_{x.mode.lower().replace('-', '_')}_season_kills__figure": x.kills,
				f"ranked_{x.mode.lower().replace('-', '_')}_season_damage__text": 'Overal Damage Dealt',
				f"ranked_{x.mode.lower().replace('-', '_')}_season_damage__figure": str(x.damage_dealt),
				f"ranked_{x.mode.lower().replace('-', '_')}_season_longest_kill__text": 'Longest Kill',
				f"ranked_{x.mode.lower().replace('-', '_')}_season_longest_kill__figure": str(x.longest_kill),
				f"ranked_{x.mode.lower().replace('-', '_')}_season_headshots__text": 'Overall Headshot kills',
				f"ranked_{x.mode.lower().replace('-', '_')}_season_headshots__figure": x.headshot_kills
			} for x in season_stats_queryset
		]

	else:

		ajax_data = [
			{
				f"{x.mode.lower().replace('-', '_')}_season_stats": correct_mode(x.mode.replace('_', ' ')).upper(),
				f"{x.mode.lower().replace('-', '_')}_season_matches": "{} {}".format(x.rounds_played, 'Matches Played'),
				f"{x.mode.lower().replace('-', '_')}_season_kills__text": 'Overall Kills',
				f"{x.mode.lower().replace('-', '_')}_season_kills__figure": x.kills,
				f"{x.mode.lower().replace('-', '_')}_season_damage__text": 'Overall Damage Dealt',
				f"{x.mode.lower().replace('-', '_')}_season_damage__figure": str(x.damage_dealt),
				f"{x.mode.lower().replace('-', '_')}_season_longest_kill__text": 'Longest Kill',
				f"{x.mode.lower().replace('-', '_')}_season_longest_kill__figure": str(x.longest_kill),
				f"{x.mode.lower().replace('-', '_')}_season_headshots__text": 'Overall Headshot kills',
				f"{x.mode.lower().replace('-', '_')}_season_headshots__figure": x.headshot_kills
			} for x in season_stats_queryset
		]

	if len(ajax_data) < 6:
		modes_not_added = set()
		all_game_modes = await PlayerSeasonStats.filter(mode__icontains='squad').values_list('mode', flat=True)
		for x in all_game_modes:
			if is_ranked:
				dict_key = f"ranked_{x.lower().replace('-', '_')}_season_stats"
			else:
				dict_key = f"{x.lower().replace('-', '_')}_season_stats"

			if not any(dict_key in x for x in ajax_data):
				modes_not_added.add(x)

		if dict_key:
			ajax_data += [
				{
					'container' :f"ranked_{x.lower().replace('-', '_')}_season_stats_container",
					'text': f"No ranked data available for {correct_mode(x.replace('_', ' ')).upper()}"
				} for x in modes_not_added
			]
		else:
			ajax_data += [
				{
					'container' :f"{x.lower().replace('-', '_')}_season_stats_container",
					'text':  f"No data available for {correct_mode(x.replace('_', ' ')).upper()}"
				} for x in modes_not_added
			]
			
	await create_cache(
		cache_key=season_stats_cache_key,
		content=ajax_data,
		minutes=2
	)

	return ajax_data

@app.post("/match_rosters/")
async def get_match_rosters(parameters: route_models.Match):

	match_id = parameters.match_id
	match = await Match.get(id=match_id)
	api_id = match.api_id
	
	match_roster_cache = api_settings.MATCH_ROSTER_CACHE_KEY.format(api_id)
	cached_ajax_data  = await get_from_cache(match_roster_cache)

	if cached_ajax_data:
		return cached_ajax_data

	account_id = api_id.split('_')[0]
	match_url = match.api_url

	if not match_url or api_id not in match_url:
		current_player = await Player.filter(api_id__iexact=account_id).first()
		match_id = api_id.split('_')[1]
		platform_url = current_player.platform_url
		match_url = build_match_url(platform_url, match_id)

	match_json = make_request(match_url)

	telemetry = await get_match_telemetry_from_match(
		match_json=match_json,
		match=match,
		return_early=True
	)

	rosters = await create_leaderboard_for_match(
		match_json=telemetry,
		telemetry=None,
		save=False
	)

	await create_cache(
		cache_key=match_roster_cache,
		content=rosters,
		minutes=60
	)

	return rosters

@app.post("/match_detail/{api_id}/")
async def match_detail(api_id):

	match_detail_cache_key = api_settings.MATCH_DETAIL_CACHE_KEY.format(api_id)
	cached_ajax_data = await get_from_cache(match_detail_cache_key)

	if cached_ajax_data:
		return cached_ajax_data

	match = await Match.get(api_id=api_id).prefetch_related('map')
	telemetry_objects = Telemetry.filter(match=match)

	split = match.api_id.split('_')
	account_id = split[0]
	match_id = split[1]

	current_player = await Player.filter(api_id=account_id).order_by('id').first()
	participant = await Participant.filter(player_id=current_player.id).order_by('id').first()
	player_name = participant.player_name

	if not await telemetry_objects.exists():
		
		match_url = match.api_url

		if not match_url or match_id not in match_url:
			platform_url = current_player.platform_url
			match_url = build_match_url(platform_url, match_id)

		match_json = make_request(match_url)
		match_type = match_json['data']['attributes']['matchType']

		await get_match_telemetry_from_match(
			match_json=match_json,
			match=match,
			return_early=False
		)

		telemetry = await Telemetry.filter(match=match).first()

	else:
		telemetry = await telemetry_objects.first()

	telemetry_events = TelemetryEvent.filter(telemetry=telemetry)

	log_match_start = await telemetry_events.get(event_type__iexact='LogMatchStart')
	total_match_kills = await telemetry_events.get(event_type__iexact='LogTotalMatchKills')
	log_match_end = await telemetry_events.get(event_type__iexact='LogMatchEnd')
	roster_telem = await TelemetryRoster.get(telemetry=telemetry)
	roster_participant = await RosterParticipant.filter(roster__match=match, participant__player=current_player).prefetch_related('participant').first()
	
	log_match_start_timestamp = parse(log_match_start.timestamp)
	log_match_start_timestamp = str(log_match_start_timestamp)

	if '+' in log_match_start_timestamp:
		log_match_start_timestamp = str(log_match_start_timestamp).split('+')[0]

	log_match_start_timestamp = str(log_match_start_timestamp).split('.')[0]
	log_match_end_timestamp = parse(log_match_end.timestamp)

	log_match_end_timestamp = str(log_match_end_timestamp)

	if '+' in log_match_end_timestamp:
		log_match_end_timestamp = str(log_match_end_timestamp).split('+')[0]

	log_match_end_timestamp = str(log_match_end_timestamp).split('.')[0]

	FMT = '%Y-%m-%d %H:%M:%S'
	
	elapased_time = datetime.strptime(log_match_end_timestamp, FMT) - datetime.strptime(log_match_start_timestamp, FMT)

	heals_items_used = await telemetry_events.filter(event_type__iexact='LogItemUseMed').count()
	boost_items_used = await telemetry_events.filter(event_type__iexact='LogItemUseBoost').count()

	ai_events = telemetry_events.filter(event_type__iexact='AICount')
	player_events = telemetry_events.filter(event_type__iexact='PlayerCount')

	ais = False
	ai_count = 0
	player_count = 0
	ai_percentage = 0.00
	
	if ai_events.exists():
		ai_count = await ai_events.first()
		ai_count = int(ai_count.description)
		ais = True

	if player_events.exists():
		player_count = await player_events.first()
		player_count = int(player_count.description)

	total_count = ai_count + player_count
	ai_percentage = round((ai_count / total_count) * 100)
	player_percentage =  round((player_count / total_count) * 100)

	telemetry_excluding_some_events = await telemetry_events.exclude(
		Q(event_type__iexact='LogTotalMatchKills') | Q(event_type__iexact='Roster') | Q(timestamp__isnull=True)
	)

	match_map_url = match.map.image_url
	map_name = match.map.name

	from ago import human

	telemetry_data = {
		'telemetry_data':{
			'platform': get_platform(current_player.platform_url),
			'match_data':{
				'match_id': match_id,
				'match_elapsed_time': f'{elapased_time} minutes',
				'match_map_name': map_name,
				'map_image': match_map_url,
				'time_since': human(match.created),
				'events': [
					{
						'timestamp': datetime.strftime(parse(x.timestamp), '%H:%M:%S'),
						'event': x.description,
						'killer_x_cord': x.killer_x_cord,
						'killer_y_cord': x.killer_y_cord,
						'victim_x_cord': x.victim_x_cord,
						'victim_y_cord': x.victim_y_cord
					} for x in telemetry_excluding_some_events
				],
				'player_breakdown':{
					'ais': ais,
					'ai_count': ai_count,
					'ai_percentage': ai_percentage,
					'player_count': player_count,
					'player_percentage': player_percentage,
					'total_count': total_count,
					'rosters': roster_telem.json,
				}
			},
			'player_data':{
				'player_kills': total_match_kills.description,
				'player_damage': roster_participant.participant.damage,
				'knocks': roster_participant.participant.knocks,
				'player_name': player_name,
				'boost_items_used': boost_items_used,
				'heals_items_used': heals_items_used
			}
		}
	}

	await create_cache(
		cache_key=match_detail_cache_key,
		content=telemetry_data,
		minutes=10
	)

	return telemetry_data


@app.post("/leaderboards/")
async def retrieve_leaderboard(parameters: route_models.Leaderboard):

	platform = parameters.platform
	season_id = parameters.season_id
	game_mode = parameters.game_mode
	
	leaderboard_cache_key = api_settings.LEADERBOARDS_CACHE_KEY.format(platform, season_id, game_mode)

	cached_ajax_data = await get_from_cache(leaderboard_cache_key)

	if cached_ajax_data:
		return cached_ajax_data

	platform_url = build_url(platform)
	leaderboard_url = build_leaderboard_url(
		base_url=platform_url,
		season_id=season_id,
		game_mode=game_mode
	)
	leaderboard_json = make_request(leaderboard_url)
	
	await create_cache(
		cache_key=leaderboard_cache_key,
		content=leaderboard_json,
		minutes=30
	)

	return leaderboard_json

@app.post("/seasons_for_platform/")
async def seasons_for_platform(parameters: route_models.Player):

	platform = parameters.platform

	seasons = await Season.filter(platform=platform)

	response = [
		{
			'value': season.api_id,
			'text': season.api_id,
			'attr': {
				'name': 'data-requires-shard',
				'value': season.requires_region_shard,
			}
		} for season in seasons
	]

	return response

@app.post("/player/")
async def get_player(parameters: route_models.Player):

	player_name = parameters.player_name

	participant = await Participant.filter(player_name__iexact=player_name).prefetch_related('player').order_by('-id').first()
	latest_participant = await participant

	return { 
		'platform': get_platform(latest_participant.player.platform_url),
		'api_id': latest_participant.player.api_id
	}

import uvicorn

if __name__ == "__main__":
	uvicorn.run(
		app=app,
		host="127.0.0.1",
		port=8000,
		loop='asyncio'
	)