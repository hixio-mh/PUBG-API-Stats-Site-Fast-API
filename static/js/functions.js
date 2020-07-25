'use strict';

var table; 

$(document).ready(function() {

	var app = {	
		table_rosters: {},
		season_requested : {
			ranked: false,
			normal: false
		},
		times_requested: 0,
		seen_match_ids: [],
		down: false,
		tries: 0,
		no_matches: false,
		retrieved: false,
		ranked_showing: false,
		matches_as_cards: false,
		cards: [],

		serialiseForm: function(){
			return $('#search_form').serialize();
		},
		getPlayerName: function(){
			return document.getElementById("id_player_name").value
		},
		getLastPlayerName: function(){
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
			document.getElementById("id_player_name").value = set_to
		},
		setLastPlayerName: function(set_to){
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
		loadResultsDataTable: function(){
			let that = this;

			that.getResults()
	
			setInterval(function() {
				that.getResults()
			}, 20000);
	
			that.seasonStatToggle(that.getPerspective(), this.ranked_showing)
		},
		clearSeasonStats: function(){
			var elements = ['duo_season_stats','duo_season_matches','duo_season_damage__figure','duo_season_damage__text','duo_season_headshots__figure','duo_season_headshots__text','duo_season_kills__figure','duo_season_kills__text','duo_season_longest_kill__figure','duo_season_longest_kill__text','duo_fpp_season_stats','duo_fpp_season_matches','duo_fpp_season_damage__figure','duo_fpp_season_damage__text','duo_fpp_season_headshots__figure','duo_fpp_season_headshots__text','duo_fpp_season_kills__figure','duo_fpp_season_kills__text','duo_fpp_season_longest_kill__figure','duo_fpp_season_longest_kill__text','solo_fpp_season_stats','solo_fpp_season_matches','solo_fpp_season_damage__figure','solo_fpp_season_damage__text','solo_fpp_season_headshots__figure','solo_fpp_season_headshots__text','solo_fpp_season_kills__figure','solo_fpp_season_kills__text','solo_fpp_season_longest_kill__figure','solo_fpp_season_longest_kill__text','solo_season_stats','solo_season_matches','solo_season_damage__figure','solo_season_damage__text','solo_season_headshots__figure','solo_season_headshots__text','solo_season_kills__figure','solo_season_kills__text','solo_season_longest_kill__figure','solo_season_longest_kill__text','squad_season_stats','squad_season_matches','squad_season_damage__figure','squad_season_damage__text','squad_season_headshots__figure','squad_season_headshots__text','squad_season_kills__figure','squad_season_kills__text','squad_season_longest_kill__figure','squad_season_longest_kill__text','squad_fpp_season_stats','squad_fpp_season_matches','squad_fpp_season_damage__figure','squad_fpp_season_damage__text','squad_fpp_season_headshots__figure','squad_fpp_season_headshots__text','squad_fpp_season_kills__figure','squad_fpp_season_kills__text','squad_fpp_season_longest_kill__figure','squad_fpp_season_longest_kill__text']
			let len;
			for (let i = 0, len=elements.length; i < len; i++){
				document.getElementById(elements[i]).innerHTML = ''

				if(elements[i].includes('squad')){
					document.getElementById(`ranked_`+elements[i]).innerHTML = ''
				}
			}
		},
		filterResults(){
			let game_mode = this.getGameMode()
			let perspective = this.getPerspective()
			let not_matching_criteria_message = $('#not_matching')

			let filter = this.getGameModeFilter(game_mode, perspective)
			
			if(filter){

				let cards_not_matching_filter  = $(`.roster_card:not([data-game-mode*='${filter}'])`);
				let cards_matching_filter = $(`.roster_card[data-game-mode*='${filter}']`);

				if(this.matches_as_cards){
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
				if(this.matches_as_cards){
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
				(ranked && this.season_requested.ranked)
				|| 
				(!ranked && this.season_requested.normal)
			){
				return
			}

			let that = this
			
			if(ranked){
				$("#ranked_season_stats").LoadingOverlay("show");
			} else {
				$("#season_stats").LoadingOverlay("show");
			}

			$.ajax({
				data: {
					player_id: that.getPlayerId(),
					platform: that.getPlatform(),
					perspective: that.getPerspective(),
					ranked: ranked
				},
				type: 'POST',
				url: that.getSeasonsEndpoint()
			}).done(function(data){

				if(ranked){
					that.season_requested.ranked = true
				} else {
					that.season_requested.normal = true
				}

				let len = data.length;
				let key;

				let extras = []

				for (let i = 0; i < len; i++){
					for(key in data[i]){
						if(key !== 'container' && key !== 'text' && key !== 'keys'){
							document.getElementById(key).innerHTML = data[i][key]
						} else {
							if(key == 'container'){
								extras.push(data[i])
							}
						}
					}
				}

				if(extras.length > 0){
					let len = extras.length;
					for (let i = 0; i < len; i++){
						$(`#${extras[i].container}`).LoadingOverlay("show", {
							background: "rgba(255, 255, 255, 1)",
							image: false,
							fontawesome: `fa fa-exclamation-circle`,
							fontawesomeAutoResize: true,
							text: `${extras[i].text}`,
							textAutoResize: true,
							size: 40,
							maxSize: 40,
							minSize: 40
						});
					}
				}
					
				if(ranked){
					$("#ranked_season_stats").LoadingOverlay("hide", true);
				} else {
					$("#season_stats").LoadingOverlay("hide", true);
				}
				$('#seasons_container').show();
			}).fail(function(data){
				console.log(data)
			});
	
		},
		callForm: function(){
			let form_data = this.serialiseForm()
			let player_name = this.getPlayerName()
			let that = this
		
			if(player_name !== undefined && typeof player_name !== 'undefined'){
				let last_player_name = that.getLastPlayerName()
				if(last_player_name !== undefined && typeof last_player_name !== 'undefined'){
					if(player_name.trim() == last_player_name.trim()){
						that.retrieved = true
						if(that.season_requested.ranked){
							that.season_requested.ranked = true
						} else {
							that.season_requested.ranked = false
						}
						if(that.season_requested.normal){
							that.season_requested.normal = true
						} else {
							that.season_requested.normal = false
						}
					} else {
						that.retrieved = false
						$('.loadingoverlay, div.roster_card').remove()
						that.season_requested.ranked = false
						that.season_requested.normal = false
						$('#results_datatable').DataTable().clear().draw();
						that.seen_match_ids = []
						that.table_rosters = {}
						that.cards = []
						that.clearSeasonStats()
					}
				} else {
					that.retrieved = false
					$('.loadingoverlay, div.roster_card').remove()
					that.season_requested.ranked = false
					that.season_requested.normal = false
					$('#results_datatable').DataTable().clear().draw();
					that.seen_match_ids = []
					that.table_rosters = {}
					that.cards = []
					that.clearSeasonStats()
				}
			}
		
			that.times_requested = 0
		
			$.ajax({
				data: form_data,
				type: 'POST',
				url: $('#search_form').attr('action')   
			}).done(function(data){
				if(data.player_id && data.player_name){
					that.setPlayerName(data.player_name)
					that.setLastPlayerName(data.player_name)
					that.setPlayerId(data.player_id)
					if(!data.currently_processing){
						that.loadResultsDataTable();
						that.retrieved = true	
					} else {
						$("#error").hide()
						if(data.no_new_matches){
							let error = data.error || data.message
							$("#error").slideDown()
							$("#error_message").text(error);
							that.loadResultsDataTable();	
						} else {
							$("#currently_processing").slideDown()
							$('#currently_processing_message').text('Currently processing player, please bear with us...')
							setTimeout(function(){
								that.loadResultsDataTable();
							}, 1000*30);
							that.retrieved = true	
						}
					}
				} else if(data.error){
					$("#currently_processing").hide()
					$("#error").slideDown()
					$("#error_message").text(data.error);
				}
			}).fail(function(result){
				console.log(result)
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
			let len;
			let i;
				
			for (i=0, len=data.length; i < len; i++){
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
		getResults: function(){
			var data = {
				player_id: this.getPlayerId(),
				platform: this.getPlatform()
			}

			let that = this

			let display_as_cards = that.display_as_cards

			$.ajax({
				url: that.getMatchesEndpoint(),
				type:'POST',
				data: data,
			}).done(function(result){
				$('#seasons_container').show();
				if(result.data){
					let i;
					let match_id;
					let len;
					let player_name = that.getPlayerName();
					let kills;
					let len2;
					let map;
					let mode;
					let date_created;
					let team_placement;
					let team_details;
					let actions;
					let btn_link;
					let time_since;
					let team_details_object;
					let j;
					let card_template;
					let card;
					let raw_mode;
				
					that.setPlayerId(result.player_id)

					for (i = 0, len=result.data.length; i < len; i++){
						match_id = result.data[i].id
						if(!that.seen_match_ids.includes(match_id)){
							that.seen_match_ids.push(match_id)

							map = result.data[i].map
							mode = result.data[i].mode
							date_created = result.data[i].date_created
							team_placement = result.data[i].team_placement
							team_details = result.data[i].team_details
							actions = result.data[i].actions
							btn_link = result.data[i].btn_link
							raw_mode = result.data[i].raw_mode
							time_since = result.data[i].time_since
							team_details_object = result.data[i].team_details_object

							let row_node = table.row.add([
								'',
								map,
								mode,
								date_created,
								team_placement,
								team_details,
								actions
							]).node();
							$(row_node).attr("id", match_id);
							
							for (j = 0, len2=team_details_object.length; j < len2; j++){
								let player_object_name = team_details_object[j].player_name;
								if(player_object_name == player_name){
									kills = team_details_object[j].kills
								}
							}

							if(kills === undefined || typeof kills === 'undefined'){
								kills = 0
							}

							let generated_team_data = that.formatRosterCardTable(team_details_object)

							let display = 'display: inline-block';
							if(!display_as_cards){
								display = 'display: none;'
							} 

							card_template =  `
								<div class="col-md-4 roster_card" data-game-mode="${raw_mode.toLowerCase()}" style='margin-bottom: 15px; ${display}'>
									<div class="card shadow-sm">
										<div class="card-header">
											<span class='float-left'>${map}</span>
											<span class='float-right'>${time_since}</span>
										</div>
										<div class="card-body" style='padding: 20px'>
											<div class='row'>
												<a role="button" style='margin-left: 15px; margin-right: 15px' href="${btn_link}" class='btn btn-primary btn-block stretched-link'>View match</a>
											</div>
											<div class='row top-buffer'>
												<div class='col-md-6'>
													<span class="w-100 badge badge" style='padding: 20px; margin:0px; background-color: #f5f5f5'>
														<h6>Place<br>${team_placement}</h6>
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
																	<td class='card-body'>${date_created}</td>
																</tr>
																<tr>
																	<th class='card-header' width='40%'>Mode</th>
																	<td class='card-body'>${mode}</td>
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

							card = {
								date_created: date_created,
								template: card_template
							}
							that.cards.push(card)
						}
					}

					if(that.cards){				
						that.cards.sort(function(a,b){
							// Turn your strings into dates, and then subtract them
							// to get a value that is either negative, positive, or zero.
							return new Date(b.date_created) - new Date(a.date_created);
						});	
						$('div.roster_card').remove()
			
						let cards_i;
						let cards_len;
			
						for (cards_i = 0, cards_len=that.cards.length; cards_i < cards_len; cards_i++){
							$('#card_container_row').append(that.cards[cards_i].template)
						}
					}

					if(!that.matches_as_cards){
						table.draw(false)
					}

					that.no_matches = false
					$("#currently_processing").hide()
					that.filterResults()
				}
			}).fail(function(data){
				that.tries += 1
				that.no_matches = true
				if(that.tries > 6){
					$("#disconnected").show()
				}
				that.checkDown()
			});
		},
		getRosterForMatch: function(match_id, datatable_id){
			
			let that = this;

			if(!that.table_rosters[datatable_id]){
				
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

				that.table_rosters[datatable_id] = {
					actual_data: [],
					datatable: roster_table,
				}

				$(`#${datatable_id}`).LoadingOverlay("show");
			
				$.ajax({
					type: 'GET',
					url: `/match_rosters/${match_id}/`
				}).done(function(data){
					let rosters = data.rosters
					let i;
					let len;
					for (i = 0, len=rosters.length; i < len; i++){						
						that.table_rosters[datatable_id].actual_data.push({
							roster_rank: rosters[i].roster_rank,
							participant_objects: rosters[i].participant_objects,
						})
					}
					that.table_rosters[datatable_id].datatable.rows.add(that.table_rosters[datatable_id].actual_data).draw(false)
					$(`#${datatable_id}`).LoadingOverlay("hide", true);
				});
			} else {
				let roster_table = $(`#${datatable_id}`).DataTable({
					data: that.table_rosters[datatable_id].datatable.rows().data(),
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
				that.table_rosters[datatable_id].datatable = roster_table    
			}
		},
		seasonStatToggle: function(perspective) {
	
			if(!this.no_matches){
				switch(perspective){
					case 'fpp':
						if(this.ranked_showing){
							$('#fpp_row').show()
							$('#tpp_row').hide()
						} else {
							$('#ranked_fpp_row').show()
							$('#ranked_tpp_row').hide()
						}
						break;
					case 'tpp':
						if(this.ranked_showing){
							$('#ranked_tpp_row').show()
							$('#ranked_fpp_row').hide()
						} else {
							$('#tpp_row').show()
							$('#fpp_row').hide()
						}
						break;
					default:
						if(this.ranked_showing){
							$('#ranked_tpp_row, #ranked_fpp_row').show()
						} else {
							$('#tpp_row, #fpp_row').show()
						}
						break;
				}
			}
		
		},
		checkDown: function(){
			let that = this;
			$.ajax({
				type: 'GET',
				url:'/backend_status',
			}).done(function(data){
				if(data.backend_status == true){
					that.down = true
				} else {
					that.down = false
				}
			});
		}
		
	}

	$.fn.dataTable.moment('dd/mm/YYYY hh:ii:ss');

	table = $('#results_datatable').DataTable({
		data: [],
		paging: true,
		bFilter: true,
		bLengthChange: true,
		order: [
			[ 3, "asc" ]
		], 
		columns: [
			{ 
				className:'details-control',
				orderable: false,
				data: null,
				defaultContent: '',
			},
			{ width: '10%' }, // map
			{ width: '10%' }, // mode
			{ width: '15%' }, // created
			{ width: '10%' }, // placement
			{ width: '30%' }, // details
			{ width: '20%' }, // actions
		],
		pageLength: 25,
		order: [[ 3, "desc" ]],
		processing: true,
		language: {
			emptyTable: '<i class="fa fa-spinner fa-spin fa-fw"></i> '
		},
	});

	// Add event listener for opening and closing details
	table.on('click', 'td.details-control', function () {
		let tr = $(this).closest('tr');
		let id = tr[0].id
		let row = table.row(tr);

		let returned_obj = app.formatChildRow(id)
		let datatable_id = returned_obj.datatable_id
		let html = returned_obj.html

		if (row.child.isShown()) {
			row.child.hide();
			tr.removeClass('shown');
		} else {
			row.child(html).show();
			app.getRosterForMatch(id, datatable_id)
			tr.addClass('shown');
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
	});

	$('#results_datatable tfoot th').each(function(idx) {
		if(idx !== 0 && idx !== 6){
			var title = $(this).text();
			$(this).html('<input class="form-control" style="width: 100%;" type="text" placeholder="Search ' + title + '" />');
		}
	});
	
	// Apply the search
	table.columns().every(function(idx) {
		if(idx !== 0 && idx !== 6){
			var that = this;
		
			$('input', this.footer()).on('keyup change', function() {
				if (that.search() !== this.value) {
					that
					.search(this.value)
					.draw();
				}
			});
		}
	});

	app.hideInitial();

	$(document).on('submit', 'form#search_form', function(event){
		
		$("#season_stats_button").click(function(self) {
			if(!app.season_requested.normal){
				app.retrievePlayerSeasonStats(false)
			}
		});

		event.preventDefault()

		if(!app.retrieved){
			app.hideInitial();
		}

		app.clearAll(window);
		$('#seasons_container').hide();
		app.callForm()

	});

	$('#search_form').submit();
	window.cookies()
});