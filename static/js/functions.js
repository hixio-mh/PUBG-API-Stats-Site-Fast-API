var table; 

$(document).ready(function() {


	// disable errors...
	$.fn.dataTable.ext.errMode = 'none';

	var app = {	
		table_rosters: {},
		season_requested : {
			ranked: false,
			normal: false
		},
		seen_match_ids: [],
		actual_data: [],
		down: false,
		tries: 0,
		ranked_showing: false,
		matches_as_cards: false,
		cards: [],
		child_rows: [],

		getPlayerName: function(){
			return document.getElementById("player_name").value
		},
		getPlatform: function(){
			return document.getElementById('id_platform').value
		},
		getPlayerId: function(){
			return document.getElementById('player_id').value
		},
		getGameMode: function(){
			return document.getElementById('id_game_mode').value
		},
		getPerspective: function(){
			return document.getElementById('id_perspective').value
		},
		getMatchesEndpoint: function(){
			return document.getElementById('retrieve_matches').value
		},
		getSeasonsEndpoint: function(){
			return document.getElementById('season_stats_endpoint').value
		},
		setPlayerName: function(set_to){
			document.getElementById("player_name").value = set_to
		},
		setPlatform: function(set_to){
			document.getElementById('id_platform').value = set_to
		},
		setPlayerId: function(set_to){
			document.getElementById('player_id').value = set_to
		},
		setGameMode: function(set_to){
			document.getElementById('id_game_mode').value = set_to
		},
		setPerspective: function(set_to){
			document.getElementById('id_perspective').value = set_to
		},
		clearSeasonStats: function(){
			var elements = ['duo_season_stats','duo_season_matches','duo_season_damage__figure','duo_season_damage__text','duo_season_headshots__figure','duo_season_headshots__text','duo_season_kills__figure','duo_season_kills__text','duo_season_longest_kill__figure','duo_season_longest_kill__text','duo_fpp_season_stats','duo_fpp_season_matches','duo_fpp_season_damage__figure','duo_fpp_season_damage__text','duo_fpp_season_headshots__figure','duo_fpp_season_headshots__text','duo_fpp_season_kills__figure','duo_fpp_season_kills__text','duo_fpp_season_longest_kill__figure','duo_fpp_season_longest_kill__text','solo_fpp_season_stats','solo_fpp_season_matches','solo_fpp_season_damage__figure','solo_fpp_season_damage__text','solo_fpp_season_headshots__figure','solo_fpp_season_headshots__text','solo_fpp_season_kills__figure','solo_fpp_season_kills__text','solo_fpp_season_longest_kill__figure','solo_fpp_season_longest_kill__text','solo_season_stats','solo_season_matches','solo_season_damage__figure','solo_season_damage__text','solo_season_headshots__figure','solo_season_headshots__text','solo_season_kills__figure','solo_season_kills__text','solo_season_longest_kill__figure','solo_season_longest_kill__text','squad_season_stats','squad_season_matches','squad_season_damage__figure','squad_season_damage__text','squad_season_headshots__figure','squad_season_headshots__text','squad_season_kills__figure','squad_season_kills__text','squad_season_longest_kill__figure','squad_season_longest_kill__text','squad_fpp_season_stats','squad_fpp_season_matches','squad_fpp_season_damage__figure','squad_fpp_season_damage__text','squad_fpp_season_headshots__figure','squad_fpp_season_headshots__text','squad_fpp_season_kills__figure','squad_fpp_season_kills__text','squad_fpp_season_longest_kill__figure','squad_fpp_season_longest_kill__text']

			for (let i = 0, len=elements.length; i < len; i++){
				document.getElementById(elements[i]).innerHTML = ''

				if(elements[i].includes('squad')){
					document.getElementById(`ranked_`+elements[i]).innerHTML = ''
				}
			}
		},
		filterResults(){
			let game_mode = app.getGameMode()
			let perspective = app.getPerspective()
			let not_matching_criteria_message = $('#not_matching')

			let filter = app.getGameModeFilter(game_mode, perspective)
			
			if(filter){

				let cards_not_matching_filter  = $(`.roster_card:not([data-game-mode*='${filter}'])`);
				let cards_matching_filter = $(`.roster_card[data-game-mode*='${filter}']`);

				if(app.matches_as_cards){
					$('#datatable_container').hide()
					$('#card_container').show()

					if(cards_matching_filter.length >= 1){
						not_matching_criteria_message.hide()
						cards_not_matching_filter.hide()
						cards_matching_filter.show()
					} else {
						not_matching_criteria_message.show()
						cards_not_matching_filter.hide()
						cards_matching_filter.hide()
					}

				} else {
					$('#datatable_container').show()
					$('#card_container').hide()
					table.columns(2).search(filter).draw();
				}
			} else {
				$(".roster_card").show();
				not_matching_criteria_message.hide()
				table.search('').columns().search('').draw();
				if(app.matches_as_cards){
					$('#datatable_container').hide()
					$('#card_container').show()
				} else {
					$('#datatable_container').show()
					$('#card_container').hide()
				}
			}
		},
		getGameModeFilter(game_mode, perspective){

			game_mode = game_mode == 'all' ? null : game_mode
			perspective = perspective == 'all' ? null : perspective

			if(!game_mode && !perspective){
				return
			}

			if(game_mode){

				if(perspective && game_mode !== 'tdm'){
					return `${game_mode}-${perspective}`
				} else {
					return `${game_mode}`
				}

			} else {
				if(perspective){
					return `${perspective}`
				}
			}

		},
		clearAll: function(window){
			let id = Math.max(
				window.setInterval(noop, 1000),
				window.setTimeout(noop, 1000)
			);
		  
			while (id--) {
				window.clearTimeout(id);
				window.clearInterval(id);
			}
		  
			function noop(){}
		},
		hideInitial: function (){
			$('#seasons_container').hide()
			$("#disconnected").hide();
			$("#currently_processing").hide();
		},
		retrievePlayerSeasonStats: function(ranked){

			if(
				(ranked && app.season_requested.ranked)
				|| 
				(!ranked && app.season_requested.normal)
			){
				return
			}
			
			if(ranked){
				$("#ranked_season_stats").LoadingOverlay("show");
			} else {
				$("#season_stats").LoadingOverlay("show");
			}

			$.ajax({
				data: {
					player_id: app.getPlayerId(),
					platform: app.getPlatform(),
					perspective: app.getPerspective(),
					ranked: ranked
				},
				type: 'POST',
				dataType: 'json',
				url: app.getSeasonsEndpoint()
			}).done(function(data){

				if(ranked){
					app.season_requested.ranked = true
				} else {
					app.season_requested.normal = true
				}

				for (let i = 0, len=data.length; i < len; i++){
					for(let key in data[i]){
						if(key !== 'container' && key !== 'text' && key !== 'keys'){
							document.getElementById(key).innerHTML = data[i][key]
						} else {
							if(key == 'container'){
								$(`#${data[i].container}`).LoadingOverlay("show", {
									background: "rgba(255, 255, 255, 1)",
									image: false,
									fontawesome: `fa fa-exclamation-circle`,
									fontawesomeAutoResize: true,
									text: `${data[i].text}`,
									textAutoResize: true,
									size: 40,
									maxSize: 40,
									minSize: 40
								});
							}
						}
					}
				}

				if(ranked){
					$("#ranked_season_stats").LoadingOverlay("hide", true);
				} else {
					$("#season_stats").LoadingOverlay("hide", true);
				}
				$('#seasons_container').show();
			}).fail(function(data){
				app.checkDown()
			});
	
		},
		formatChildRow: function(id) {
			let generated_datatable_id = `rosters_datatable_${id}`
		
			let generated_row_data =`
				<div class="col-md-12" style='padding: 10px;' id='${generated_datatable_id}_wrapper'>
					<table class='table table-condensed' id='${generated_datatable_id}' style='width: 100%'>
						<thead>
							<tr>
								<th width='20%%'>Rank</th>
								<th width='80%'>Team Details</th>
							</tr>
						</thead>
						<tbody>
						</tbody>
					</table>
				</div>`
		
			let obj = {
				datatable_id: generated_datatable_id,
				html: generated_row_data
			}
		
			return obj
		},
		formatRosterCardTable(data){
			let generated_table_rows = `
			<div class='col-md-12'>
				<table class="table table-bordered">
					<thead>
						<tr>
							<th class='card-header text-center'>Name</th>
							<th class='card-header text-center'>Kills</th>
							<th class='card-header text-center'>Damage</th>
						</tr>
					</thead>
					<tbody>
			`
				
			for (let i=0, len=data.length; i < len; i++){
				generated_table_rows += `
					<tr>
						<td class='text-center'>${data[i].player_name}</td>
						<td class='text-center'>${data[i].kills}</td>
						<td class='text-center'>${data[i].damage}</td>
					</tr>
				`
			}
			generated_table_rows += `
					</tbody>
				</table>
			</div>`
			
			return generated_table_rows
		
		},
		getRosterForMatch: function(match_id, datatable_id){

			if(!app.table_rosters[datatable_id]){
				
				let roster_table = $(`#${datatable_id}`).DataTable({
					columns: [
						{ data: 'roster_rank', width: '15%' }, // rank
						{ data: 'participant_objects', width: '85%' }, // rosters
					],
					order: [[ 0, "asc" ]],
					scrollY: "200px",
					scrollCollapse: true,
					paging: false,
					responsive: true
				});

				app.table_rosters[datatable_id] = {
					actual_data: [],
					datatable: roster_table,
				}

				$(`#${datatable_id}`).LoadingOverlay("show");
			
				$.ajax({
					type: 'GET',
					url: `/match_rosters/${match_id}/`
				}).done(function(data){
					let rosters = data.rosters
					for (let i = 0, len=rosters.length; i < len; i++){						
						app.table_rosters[datatable_id].actual_data.push({
							roster_rank: rosters[i].roster_rank,
							participant_objects: rosters[i].participant_objects,
						})
					}
					app.table_rosters[datatable_id].datatable.rows.add(app.table_rosters[datatable_id].actual_data).draw(false)
					$(`#${datatable_id}`).LoadingOverlay("hide", true);
				}).fail(function(error){
					app.checkDown()
				})
			} else {
				let roster_table = $(`#${datatable_id}`).DataTable({
					data: app.table_rosters[datatable_id].datatable.rows().data(),
					columns: [
						{ data: 'roster_rank', width: '15%' }, // rank
						{ data: 'participant_objects', width: '85%' }, // rosters
					],
					order: [[ 0, "asc" ]],
					scrollY: "200px",
					scrollCollapse: true,
					paging: false,
					responsive: true
				});
				roster_table.draw(false);
				app.table_rosters[datatable_id].datatable = roster_table    
			}
		},
		seasonStatToggle: function(perspective) {
	
			switch(perspective){
				case 'fpp':
					if(app.ranked_showing){
						$('#fpp_row').show()
						$('#tpp_row').hide()
					} else {
						$('#ranked_fpp_row').show()
						$('#ranked_tpp_row').hide()
					}
					break;
				case 'tpp':
					if(app.ranked_showing){
						$('#ranked_tpp_row').show()
						$('#ranked_fpp_row').hide()
					} else {
						$('#tpp_row').show()
						$('#fpp_row').hide()
					}
					break;
				default:
					if(app.ranked_showing){
						$('#ranked_tpp_row, #ranked_fpp_row').show()
					} else {
						$('#tpp_row, #fpp_row').show()
					}
					break;
			}

		},
		checkDown: function(){
			$.ajax({
				type: 'GET',
				url:'/backend_status',
			}).done(function(data){
				if(data.backend_status == true){
					app.down = true
				} else {
					app.down = false
				}
			});
		}
		
	}

	var player_name = app.getPlayerName();

	table = $('#results_datatable').DataTable({
		ajax:{
			url: app.getMatchesEndpoint(),
			type:'POST',
			data: {
				player_id: app.getPlayerId(),
				platform: app.getPlatform()
			},
			error: function (xhr, error, code){
                app.checkDown()
            },
			dataSrc: function (json) {
				let json_data = json.data
				let new_data = false

				if(json_data){
					for (let i = 0, len=json_data.length; i < len; i++){
						let match_id = json_data[i].id

						if(!app.seen_match_ids.includes(match_id)){
							app.actual_data.push(json_data[i])
							app.seen_match_ids.push(match_id)
							new_data = true

							let raw_mode = json_data[i].raw_mode
							let team_details_object = json_data[i].team_details_object
							let current_player = team_details_object.find(player => {
								return player.player_name == player_name
							})
							let kills = current_player.kills || 0

							let display = 'display: inline-block';
							if(!app.matches_as_cards){
								display = 'display: none;'
							} 

							let generated_team_data = app.formatRosterCardTable(team_details_object)
					
							card = {
								date_created: json_data[i].date_created.timestamp,
								template: `
								<div class="col-md-4 roster_card" data-game-mode="${raw_mode.toLowerCase()}" style='margin-bottom: 15px; ${display}'>
									<div class="card shadow-sm">
										<div class="card-header">
											<span class='float-left'>${json_data[i].map}</span>
											<span class='float-right'>${json_data[i].time_since}</span>
										</div>
										<div class="card-body" style='padding: 20px'>
											<div class='row'>
												<a role="button" style='margin-left: 15px; margin-right: 15px' href="${json_data[i].btn_link}" class='btn btn-primary btn-block stretched-link'>View match</a>
											</div>
											<div class='row top-buffer'>
												<div class='col-md-6'>
													<span class="w-100 badge badge" style='padding: 20px; margin:0px; background-color: #f5f5f5'>
														<h6>Place<br>${json_data[i].team_placement}</h6>
													</span>
												</div>
												<div class='col-md-6'>
													<span class="w-100 badge badge" style='padding: 20px; margin:0px; background-color: #f5f5f5'>
														<h6>Kills<br><b>${kills}</b></h6>
													</span>
												</div>
											</div>
											<div class='detailed'>
												<div class='row top-buffer'>
													<div class='col-md-12'>
														<table class="table table-bordered">
															<tbody>
																<tr>
																	<th class='card-header' width='40%'>Date Created</th>
																	<td class='card-body'>${json_data[i].date_created.display}</td>
																</tr>
																<tr>
																	<th class='card-header' width='40%'>Mode</th>
																	<td class='card-body'>${json_data[i].mode}</td>
																</tr>
															</tbody>
														</table>
													</div>
												</div>
												<div class='row top-buffer'>
													${generated_team_data}
												</div>
											</div>
										</div>
									</div>
								</div>
							`
							}
							app.cards.push(card)
						}
					}

					// if we actually have new data, then we can draw the cards
					if (new_data){
						// sort them by date			
						app.cards.sort(function(a,b){
							// Turn your strings into dates, and then subtract them
							// to get a value that is either negative, positive, or zero.
							return new Date(b.date_created) - new Date(a.date_created);
						});	

						// remove all the current cards
						$('div.roster_card').remove()
						
						// create them, in the correct order
						for (let cards_i = 0, cards_len=app.cards.length; cards_i < cards_len; cards_i++){
							$('#card_container_row').append(app.cards[cards_i].template)
						}

						if(app.matches_as_cards){
							$('#as_detailed_cards').click()
						}
					}
					
					// return the data	
					return app.actual_data
				} else {
					return []
				}
			}
		},
		createdRow: function (row, data, _) {
			// set the ID of the row, to the id of the match
			row.id = data.id
        },
		drawCallback: function(settings) {
			$('#seasons_container').show();

			// re-open previously opened rows pre refresh
			$.each(app.child_rows, function (i, id) {
				$('#' + id + ' td.details-control').trigger('click');
			});
		},
		columns: [
			{
				visible: false,
				orderable: false,
				data: 'id',
			},
			{ 
				className:'details-control',
				orderable: false,
				data: null,
				defaultContent: '',
			},
			{ width: '10%', data: 'map' }, // map
			{ width: '10%', data: 'mode' }, // mode
			{ width: '15%', data: {
               	 	_:    "date_created.display",
               		sort: "date_created.timestamp"
				} // created
			},
			{ width: '10%', data: 'team_placement' }, // placement
			{ width: '30%', data: 'team_details' }, // details
			{ width: '20%', data: 'actions' }, // actions
		],
		pageLength: 25,
		filter: true,
		deferRender: true,
		order: [[ 4, "desc" ]],
		language: {
			emptyTable: 'This player has either played no matches in the last 14 days, or we are currently processing this players matches.'
		},
	});

	// Add event listener for opening and closing details
	table.on('click', 'td.details-control', function () {
		let tr = $(this).closest('tr');
		let id = tr[0].id
		let idx = $.inArray(id, app.child_rows);
		let row = table.row(tr);

		let returned_obj = app.formatChildRow(id)
		let datatable_id = returned_obj.datatable_id
		let html = returned_obj.html

		if (row.child.isShown()) {
			row.child.hide();
			tr.removeClass('shown');

			app.child_rows.splice(idx, 1);
		} else {
			row.child(html).show();
			app.getRosterForMatch(id, datatable_id)
			tr.addClass('shown');

			if (idx === -1) {
				app.child_rows.push(id)
			}
		}
	});

	$('#as_table, #as_detailed_cards, #as_compact_cards, #id_game_mode, #id_perspective').on('click', function (event) {

		let id = $(this).attr('id')

		if(id.includes('table')){
			app.matches_as_cards = false
			$('#datatable_container').show()
			$('#card_container, .roster_card').hide()
			table.draw(false)
		} else if(id.includes('detailed')){
			app.matches_as_cards = true
			$('#datatable_container').hide()
			$('#card_container, .roster_card, .detailed').show()
		} else if(id.includes('compact')){
			app.matches_as_cards = true
			$('#datatable_container, .detailed').hide()
			$('#card_container, .roster_card').show()
		}
		app.filterResults()
	});

	function requestSeasonStats(self){
		let id = self.id
		let is_ranked = false;
		if(id == 'ranked-tab'){
			is_ranked = true
			app.ranked_showing = true
		} else {
			app.ranked_showing = false
		}
		app.retrievePlayerSeasonStats(is_ranked)
	}
	window.requestSeasonStats = requestSeasonStats

	// basically, lets destroy the roster tables because, well, we're going to the next (or prev) page - no need to keep it around
	table.on('page.dt', function() {
		app.table_rosters = {}
		app.child_rows = []
	});

	app.hideInitial();
	
	$("#season_stats_button").click(function(self) {
		if(!app.season_requested.normal){
			app.retrievePlayerSeasonStats(false)
		}
	});

	app.seasonStatToggle(app.getPerspective(), app.ranked_showing)

	app.clearAll(window);
	$('#seasons_container').hide();
		
	window.cookies()

	setInterval(function () {
		table.ajax.reload(null, false);
	}, 1000*30);
});