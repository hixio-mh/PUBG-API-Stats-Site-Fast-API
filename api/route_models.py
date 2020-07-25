from pydantic import BaseModel
from typing import Optional

class Player(BaseModel):
	player_name: Optional[str] = None
	platform: Optional[str] = None
	ranked: Optional[bool] = None
	api_id: Optional[str] = None

class Match(BaseModel):
	match_id: int

class Leaderboard(BaseModel):
	season_id: str
	platform: str
	game_mode: str