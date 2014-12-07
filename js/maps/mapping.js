// ***************************************** Newly adapted
	// Important global vars
	var gi; // to be used as the geoInstance instantiation, holding the map and such.
	var marker; // Global for marker code?

	var geocoder = new google.maps.Geocoder();
	var lat = 43.6631001;
	var lng = -79.4105665;
	var latlng = new google.maps.LatLng(lat,lng);
	var map;

	$(window).load(function() {
		initialize();
		addMarker(latlng);
	});

	function initialize() {
		var mapOptions = {
			zoom: 14,
			scrollwheel: false,
			center: latlng,
			draggable: true,
			zoomControl: true,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE,
				position: google.maps.ControlPosition.RIGHT_CENTER
			},
			scaleControl: true,
			panControl: false,
			navigationControl: false,
			mapTypeId: 'roadmap',
			streetViewControl: false
		}
		map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	}

	// Sam's function for splash
	function center_starting_coords() {
		if(!starting_lat || !starting_lng) {
			var starting_lat = 43.6525025;
			var starting_lng = -79.3728182;
			if(geolocated_lat != "" && geolocated_lon != "") {
				starting_lat = geolocated_lat;
				starting_lng = geolocated_lon;
			}
		}
		scrollMap(starting_lat,starting_lng);

		// Now, just in case, close the infobox.
		infobox.close();
	}

	// Based on Rodney's suggestion to help with polygon-based centroids, converted to function (rather than prototype).
	function my_getBounds(polygon){
		var bounds = new google.maps.LatLngBounds();
		polygon.getPath().forEach(function(element,index){bounds.extend(element)})
		return bounds;
	}

// --------------------------------------------------------------- Old functions, to be updated

	function scrollMapHTML(position) {
		if (!geolocated) {
			var loc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			geolocated_position = position;
			geolocated_loc = loc;
			geolocated_lat = position.coords.latitude;
			geolocated_lon = position.coords.longitude;
		}
		user_touched_dropdowns = 2;
	}

	function scrollMapHTMLOnce(position) {
		if (!geolocated) {
			//console.log("scrollMapHTMLOnce...");
			scrollMapHTML(position);
			geolocated = true;
			buttonClickHandler();
		}
	}

	function scrollMap(lat,lng) {
		// Scrolls the map so that it is centered at (position.coords.latitude, position.coords.longitude).
		if(!lat || !lng) {
			console.log("Error in scrollMap: bad coordinates passed: " + lat + ", " + lng);
			return "Error";
		}
		latlng = new google.maps.LatLng(lat, lng);
		map.panTo(latlng); // .setCenter
		if(marker)
			marker.setPosition(latlng);
		else {
			var image = {
				url: 'images/gcbc_marker.png',
				// This marker is 20 pixels wide by 32 pixels tall.
				size: new google.maps.Size(32, 34),
				// The origin for this image is 0,0.
				origin: new google.maps.Point(0,0),
				// The anchor for this image is the base of the flagpole at 0,32.
				anchor: new google.maps.Point(16, 39)
			};

			marker = new google.maps.Marker({
											map: map,
											icon: image,
											position: latlng
											});
		}
	}

	function addMarker(latlng, url, image_src) {
		if(!latlng	|| latlng	== "") { return false; }
		if(!url		|| url		== "") { url = "incident.php"; }
		if(!image	|| image	== "") { image_src	= 'images/gcbc_marker.png'; }

		var image = {
			url: image_src,
			// This marker is 20 pixels wide by 32 pixels tall.
			size: new google.maps.Size(32, 34),
			// The origin for this image is 0,0.
			origin: new google.maps.Point(0,0),
			// The anchor for this image is the base of the flagpole at 0,32.
			anchor: new google.maps.Point(16, 39)
		};

		var marker = new google.maps.Marker({
			map: map,
			icon: image,
			position: latlng
		});
		google.maps.event.addListener(marker, 'click', function() {
			window.location = url;
		});
	}


	function handleError(error) {
		// Update a div element with error.message.
		showInContentWindowWarning("Could not determine location from web browser. Please click on map or enter an address above.");
		console.log("Location service failed. Check browser settings.");
	}

	function buttonClickHandler() {
		// Cancel the updates when the user clicks a button.
	}

/* ************************************************** Geolocating the User *********************************/
	function getGeolocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(scrollMapHTMLOnce,geolocationError);
		} else {
			console.log("Geolocation is not supported by this browser.");
		}
	}

	function geolocationError(error) {
		switch(error.code) {
			case error.PERMISSION_DENIED:
				var message = "User denied the request for Geolocation."
				break;
			case error.POSITION_UNAVAILABLE:
				var message = "Location information is unavailable."
				break;
			case error.TIMEOUT:
				var message = "The request to get user location timed out."
				break;
			case error.UNKNOWN_ERROR:
			default:
				var message = "An unknown error occurred."
				break;
		}
		console.log(message);
	}


/* ************************************************** Form2.js ********************************************/
	// Caching geolocation results.
	var geolocated_city				= localStorage.getItem("geolocated_city")		? localStorage.getItem("geolocated_city")		: "";
	var geolocated_city_id			= localStorage.getItem("geolocated_city_id")	? localStorage.getItem("geolocated_city_id")	: "";
	var geolocated_hood_name		= localStorage.getItem("geolocated_hood_name")	? localStorage.getItem("geolocated_hood_name")	: "";
	var geolocated_hood_id			= localStorage.getItem("geolocated_hood_id")	? localStorage.getItem("geolocated_hood_id")	: "";
	var geolocated_lat				= localStorage.getItem("geolocated_lat")		? localStorage.getItem("geolocated_lat")		: "";
	var geolocated_lon				= localStorage.getItem("geolocated_lon")		? localStorage.getItem("geolocated_lon")		: "";
	var geolocated_region			= "";
	var geolocated_country			= "";
	var global_city_is_on_list		= false;
	var geolocated_loc				= localStorage.getItem("geolocated_loc")		? localStorage.getItem("geolocated_loc")		: "";
	var geolocated_position			= "";
	var geolocation_attempts		= 0;
	var geolocated					= false;

	// Globals for user interactions and such
	var user_touched_dropdowns		= 0; // This var can have 3 states: 0 = not geolocated & haven't touched; 1 = not geolocated & has touched; 2 = geolocated, doesn't matter if touched.
	var current_neighbourhood		= "";
	var geocity_attempts			= 0;
	var should_display_map			= true; // (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? false : true;
	var realestate_overlay			= false;
	var infobox_hidden				= false;

	// Globals to track mouse position
	var mouse_x;
	var mouse_y;
	var infobox_mouseover		= false;
	var poly_mouseover			= false;
	var poly_hovered_name		= false;

	// Globals for hash that page was loaded with.
	var hash_when_loaded		= window.location.hash;
	var hash_for_neighbourhood	= false;
	var hash_to_hood			= false;

	// Globals for communities with duplicated names
	var neighbourhood_homonyms	= {}; // Filled up by how_many_neighbourhoods_by_name()

	// Support the current province active
	var current_province		= "";

	function _center_on_id_ajax_caller(id, hood_name) {
		if(!id || !hood_name) { console.log("Error: _center_on_id_ajax_caller called without proper args!"); return false; }

		var ajaxlink = centroid_by_id_url + encodeURIComponent(id); // Name already on it.
		$.ajax(ajaxlink).done(function(resp) {
			if(typeof resp['error'] != "undefined") {
				console.log("Error: ajax error code " + resp['error']['code'] + " in center_on_id, msg: " + resp['error']['message']);
				return false;
			}
			if(typeof resp['point'] == "undefined" || typeof resp['point']['lat'] == "undefined") {
				console.log("Error: bad ajax response (no [point][lat]) in _center_on_id_ajax_caller. Trying again in 1s...");
				setTimeout(function() { center_on_id(id); }, 1000);
				return false;
			}
			if(isNaN(resp["point"]["lat"]) || resp["point"]["lat"] == 0) {
				console.log("Bad ajax response in center_on_id, lat: " + resp["point"]["lat"] + " lng: " + resp["point"]["lng"]);
				return false;
			}
			if(isNaN(resp["point"]["lat"]) || resp["point"]["lat"] == 0) { console.log("Error: ajax fail in center_on_id, with id: " + id); return false; }
			_center_on_neighbourhood(resp["point"]["lat"], resp["point"]["lng"], hood_name);
		});
	}

	// A much better alternative to all the below solutions, which center the map based on a name. This one takes an ID instead and should be able to center on any neighbourhood type
	function center_on_id(id,optionals) {
		// Make sure that this can run properly.
		if(!id			|| id			== "") 	{ console.log("Error: no id or bad id given in center_on_id. The id: " + id); return false; }
		if(!optionals	|| optionals	== "")	{ optionals = {}; }
		var hood_obj = comms_by_id[id];
		if(!hood_obj) { console.log("Error: in center_on_id, could not find neighbourhood with id: " + id); return false; } // And then don't do anything else, like re-center

		// Establish the vars that we will need to call _center_on_neighbourhood
		var hood_name	= hood_obj['name'];
		var parent_id	= hood_obj['parent_id'];
		var lat, lng	= false; // Where to center
		lat = (typeof optionals.lat == "undefined")? lat : optionals.lat;
		lng = (typeof optionals.lng == "undefined")? lng : optionals.lng;

		// If we have not received a (lat,lng), then infer one from the polygon.
		try {
			if(!lat || !lng) {
				var polyCenter		= get_polygon_center(id);
				lat					= polyCenter.lat();
				lng					= polyCenter.lng();
			}
		} catch(err) { void(0); } // Probably fine -- errors will frequently be thrown here once the page has loaded, before the polygons are all there!

		// Now center accordingly on that polygon.
		if(lat && lng) {
			_center_on_neighbourhood(lat,lng,hood_name);
		} else {
			_center_on_id_ajax_caller(id, hood_name);
		}

		// Do the standard stuff: be sure to set the neighbourhood appropriately.
		set_hood_by_id(id);
		setTimeout(function() {
			pbmaps.show_city_dropdown();
		},500);

		return true;
	}

	// Center on the first child (as found by has_children() ) of a given neighbourhood -- if it has children.
	function center_on_child(prov_id) {
		if(!has_children(comms_by_id[prov_id])) { return false; } // The call to has_children will PLANT a "foundChild" field into comms_by_id[prov_id] - to be clear on data-passing

		var child_city_name	= "";
		var child_city_id	= "";

		if(comms_by_id[prov_id].cityForCenter) {
			child_city_name	= comms_by_id[comms_by_id[prov_id].cityForCenter].name;
			child_city_id	= comms_by_id[prov_id].cityForCenter;
		} else {
			child_city_name	= comms_by_id[comms_by_id[prov_id].foundChild].name;
			child_city_id	= comms_by_id[prov_id].foundChild;
		}

		center_on_city(child_city_name, comms_by_id[prov_id]['name']);

		return true;
	}

	// Center on a given province -- pass in name, ID, or both!
	function center_on_province(prov_name,prov_id) {
		if(!prov_name && !prov_id) {
			prov_name	= current_province;
			prov_id		= $(".province-button.selected").attr("data-formid");
		}
		if(!prov_id) { return false; }

		if(has_children(comms_by_id[prov_id])) { center_on_child(prov_id); } else { return false; }
	}

	// Center the map on a given city, when the user changes accordingly
	function center_on_city(name,province) {
		if(!name		|| name		== "")		{ console.log("Error: center_on_city called with no name!"); return; }
		if(!province	|| province	== "")		{ province = current_province; }

		// Let's use Google Maps API to locate that city!
		encodeAddress(false,false,(name + ", " + province),false,true,false);
		$("#neighbourhoodName").html(name);
		infobox.close();
		$(".neighbourhood").val(null);
		return 1;
	}

	// Helper function for center_on_neighbourhood -- convenient wrapper given lat and lon.
	function _center_on_neighbourhood(lat,lon,name,city_id) {
		if(!city_id || city_id == "") { city_id = false;}
		scrollMap(lat,lon);
		highlight_centered_polygon();
		setNeighbourhood(name, false, city_id);
		if($("#neighbourhoodName").html() != "" && $("#neighbourhoodName").html() != "false") {
			infobox.open(map,marker);
		}
		if(map.getZoom() < 7) { map.setZoom(14); }
	}

	// Center the map on a given neighbourhood; pass in neighbourhood by name.
	function center_on_neighbourhood(name, con_callbacks, lat, lon, required_city_id) {
		if(!name) { console.log("No name provided in center_on_neighbourhood"); return 1; }
		if(!con_callbacks || con_callbacks=="")	{ con_callbacks = 0; }
		if(!lat || lat == "" || isNaN(lat))		{ lat = ""; }
		if(!lon || lon == "" || isNaN(lon))		{ lon = ""; }
		if(!required_city_id || required_city_id == "")		{
			required_city_id = (how_many_neighbourhoods_by_name(name) > 1) ? $(".city").val() : false;
		}
		var returnvalue = true;

		//This helps performance so much!
		if(how_many_neighbourhoods_by_name(name) <= 1) { required_city_id = false; }

		current_neighbourhood = name;
		selectedNeighbourhood = name;
		if($("#neighbourhoodName").html() != "" && $("#neighbourhoodName").html() != "false") {
			infobox.open(map,marker);
		}

		if(lat != "" && lon != "") {
			_center_on_neighbourhood(lat,lon,name);
		} else if (required_city_id) {
			setNeighbourhood_placeholder("Loading..."); // This is a temporary UI placeholder
			var ajaxlink = centroid_by_name_url + encodeURIComponent(name); // Name already on it.
			ajaxlink += "&map=Neighbourhoods&parent_id=" + required_city_id;
			$.ajax(ajaxlink).done(function(resp) {
				if(typeof resp['error'] != "undefined") {
					console.log("Error: ajax error code " + resp['error']['code'] + " in center_on_neighbourhood, req_city branch, msg: " + resp['error']['message']);
					return false;
				}
				if(isNaN(resp["point"]["lat"]) || resp["point"]["lat"] == 0) {
					console.log("Bad ajax response in center_on_neighbourhood, req_city branch, lat: " + resp["point"]["lat"] + " lng: " + resp["point"]["lng"]);
					returnvalue = false;
					return false;
				}
				scrollMap(resp["point"]["lat"], resp["point"]['lng']);
				highlight_centered_polygon();
			});
		} else {
			// This ajaxlink is deprecated and does not work properly anymore, as of 2014.11.01 -- Sam is sorting out ways around ever calling this.
			var ajaxlink = centroid_by_name_url + encodeURIComponent(name); // Name already on it.
			$.ajax(ajaxlink).done(function(resp) {
				if(typeof resp['error'] != "undefined") {
					console.log("Error: ajax error code " + resp['error']['code'] + " in center_on_neighbourhood, else branch, msg: " + resp['error']['message']);
					return false;
				}
				if(isNaN(resp["point"]["lat"]) || resp["point"]["lat"] == 0) {
					console.log("Bad ajax response in center_on_neighbourhood, else branch, lat: " + resp["point"]["lat"] + " lng: " + resp["point"]["lng"]);
					returnvalue = false;
					return false;
				}
				scrollMap(resp["point"]["lat"], resp["point"]["lng"]);
				highlight_centered_polygon();
			});
		}
		pbmaps.show_city_dropdown();
		return returnvalue;
	}

	function check_links() {
		if(current_neighbourhood != "") {
			set_buttons();
		} else {
			unset_buttons();
		}
	}

	function set_province(prov_name) {
		if(!prov_name) { return false; }
		return province_changed($("." + prov_name.toLowerCase().replace(" ","-") + "-button")[0]);
	}

	function province_changed(prov_DOM_elem, center_map) {
		if(!center_map || center_map == "") { center_map = false; }

		// Get the province, and set all corresponding buttons to selected
		var province		= $(prov_DOM_elem).attr("data-province");
		var province_id		= $(prov_DOM_elem).attr("data-formid");
		if(province == current_province) {
			return false;
		}

		current_province = province;
		rewrite_cities(province_id);

		// Display buttons as selected accordingly.
		$(".province-button").removeClass("selected");
		$("." + province.toLowerCase() + "-button").addClass("selected");

		if(center_map) { center_on_province(province,province_id); }
		return true;
	}

	// Quick function to work effectively when the user switches the city dropdown.
	// Takes as argument the DOM object of a city.
	function cityChange_user(city_DOM_object) {
		if(user_touched_dropdowns == 0) { user_touched_dropdowns = 1; }
		var selected_city	= $(city_DOM_object).val();
		var city_id			= $(city_DOM_object).find("option:selected").attr("data-formid");
		if(typeof default_neighbourhoodChanged == "undefined" || default_neighbourhoodChanged == true) { window.location.hash = encodeURIComponent(selected_city) + "/" + city_id; }
		cityChanged(selected_city,city_id);

		center_on_city(selected_city);
		setNeighbourhood("");
		unset_buttons(true);
	}

	// In case of any trouble, let's load the cached version here.
	function cityChanged(selected_city,city_id) {
		if(!city_id) {
			try { city_id = find_city_by_name(selected_city).id; }
			catch (err) { console.log("In cityChanged, couldn't find a city by name: " + selected_city); return false; }
		}

		var parent_province_obj = comms_by_id[comms_by_id[city_id].parent_id];
		if(typeof parent_province_obj != "undefined" && parent_province_obj['name'] != current_province) {
			set_province(parent_province_obj['name']);
		}

		current_neighbourhood = "";
		check_links();

		// Double check that we have not accidentally received a neighbourhood or province, instead of city! (2014.11.04 bug)
		var main_city_obj	= comms_by_id[city_id];
		var city_parent_obj	= comms_by_id[main_city_obj['parent_id']];
		if(main_city_obj['type'] != 2) {
			if(typeof city_parent_obj == "undefined" || main_city_obj['type'] == 3) { // We've been given a province!
				return false; // don't change the city dropdown. Doesn't need it really.
			} else if(main_city_obj['name'] == city_parent_obj['name']) { // We've been given a neighbourhood! Fix it!
				city_id = city_parent_obj['id'];
			}
		}

		var output = "";
		for (var i in comms) {
			if (comms[i].parent_id == city_id) {
				output += "<option class='neighbourhood_select parent" + comms[i].parent_id + "' data-formid='" + comms[i].id + "' data-parentid='" + comms[i].parent_id + "' value='" + escapeHTML(comms[i].name);
				output += "'> " + comms[i].name + "</option>";
			}
		}
		if (output == "") {
			// This shouldn't happen, but just in case it does...
			output += "<option disabled class='neighbourhood_prompt2'>" + "Sorry! No neighbourhoods found in " + selected_city + "</option>";
		}
		$(".city").val(selected_city);
		$(".neighbourhood").html(output);
	}

	// Helper function for page jumps within encodeAddress
	function _encodeAddress_pagejump() {
		display_modal("Loading...","Just a second while we match that address to a neighbourhood and bring you to that page.");
		var hoodid = $(".neighbourhood").find("option:selected").attr("data-formid");
		var linktogo = "/" + comms_by_id[hoodid].path;
		window.location = linktogo;
		setTimeout(function() {
			$("#myModal .modal-body").append("<p>It looks like the address you entered is in " + selectedNeighbourhood + ". If this page does not automatically redirect, please click <a href='" + linktogo + "'>here</a>.</p>");
		},3000);
	}


	// Takes address, returns GPS coordinates.
	// Sam's modification of the Google Maps API -- not to be confused with existing codeAddress()
	function encodeAddress(show_infobox, show_neighbourhood, specified_address, page_jump, scroll_and_exit, show_modal) {
		var address = "";
		if(!show_infobox 		|| show_infobox			== "")	{ show_infobox = true;}
		if(!show_neighbourhood	|| show_neighbourhood	== "")	{ show_neighbourhood = true;}
		if(!page_jump			|| page_jump			== "")	{ page_jump = false; }
		if(!scroll_and_exit		|| scroll_and_exit		== "")	{ scroll_and_exit = false; }
		if(typeof show_modal==="undefined" || show_modal== "")	{ show_modal = true;}
		if(!specified_address	|| specified_address	== "")	{ address = $(".address-input").val(); // ...
		} else													{ address = specified_address;}
		if(address.toLowerCase() == "make money") {
			realestate_overlay = true;
			$(".address-input").val("Sales mode on");
			setTimeout(function() { $(".address-input").val(null); },3000)
			return;
		}

		geocoder.geocode( { 'address': address}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var loc = results[0].geometry.location;
				var lat = loc.lat();
				var lon = loc.lng();

				var coded_hood_id		= getNeighbourhood_from_loc(loc,true);
				var found_neighbourhood = coded_hood_id == false ? false : true;
				var coded_hood			= false;
				if(coded_hood_id) {
					coded_hood			= comms_by_id[coded_hood_id]; // The object itself.
					setNeighbourhood(coded_hood['name'],"",coded_hood['parent_id'],"",coded_hood['id']);
				}
				setTimeout(function() {check_links();}, 50);

				if(!show_infobox) {
					infobox.close();
				} // Else it will be opened above by setNeighbourhood

				if(scroll_and_exit) {
					scrollMap(lat,lon);
					return 1;
				}

				if (show_neighbourhood && found_neighbourhood) {
					checkNeighbourhood(loc,lat,lon,"","","",true);
					if(page_jump) { _encodeAddress_pagejump(); }
				}
				if(!found_neighbourhood) {
					infobox.close();
					var message = "<h3>You'll need to include a city name in your search or select from the drop-down menu below.</h3><p>If your city isn't in the dropdown menu, don't worry. It will be soon!</p>";
					if(geolocated_hood_name != "" && geolocated_hood_name != false) {
						center_on_neighbourhood(geolocated_hood_name);
					} else {
						scrollMap(lat,lon);
					}
					if(show_modal) {
						display_modal("Outside our network",message,"New search");
					}
				}
				check_links();
				return;
			} else {
				if(show_modal) {
					display_modal("Location Error","Sorry, we were unable to find this location on our map. Please be sure to enter a city and/or postal code along with your address.");
				}
				return false;
			}
		});
	}

	// Takes coordinates --> returns address
	function encodeLatLng(lat,lng) { // Based on Google Maps API
		var latlng = new google.maps.LatLng(lat, lng);
		geocoder.geocode({'latLng': latlng}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				if (results[1]) {
					$("#approx_address").html(results[1].formatted_address);
				} else {
					console.log('No results found while trying to encode LatLng coordinates.');
				}
			} else {
				console.log('Geocoder failed due to: ' + status);
			}
		});
	}

	// Helper function - determine by JS, does this community have children? -- pass in the community by reference
	function has_children(hood_obj) {
		if(!hood_obj) { return false; }
		// Have we checked this one already? If so, return whatever we found.
		if(typeof hood_obj.haschildren != "undefined") {
			return hood_obj.haschildren;
		}

		var search_id = hood_obj.id;
		for(var i in comms) {
			if(comms[i].parent_id == search_id) { // Congeofirmed with a single example.
				hood_obj.haschildren			= true;
				hood_obj.foundChild				= i;
				return true;
			}
		}
		// Determined, after an exhaustive search that no, this comm does not have children.
		hood_obj.haschildren = false;
		return false;
	}

	// Helper function to count how many neighbourhoods by a given name
	// Uses neighbourhood_homonyms object as a cache.
	function how_many_neighbourhoods_by_name(name) {
		if(!name) { return; }
		if(typeof neighbourhood_homonyms[name] != "undefined") { return neighbourhood_homonyms[name]["count"]; }

		var count = 0;
		var parentlist = [];
		for(var i = 0; i<comms.length;i++) {
			if(comms[i].name.toLowerCase() == name.toLowerCase()) {
				count += 1;
				parentlist.push(comms[i].parent_id);
			}
		}
		neighbourhood_homonyms[name] = {"count": count, "parents": parentlist } ;
		return count;
	}

	// Take neighbourhood name --> returns neighbourhood object.
	// Optionally pass in the name of the parent_city.
	function find_neighbourhood_by_name(name,city_needed) {
		if(!name		|| name == ""		) { return; }
		if(!city_needed	|| city_needed == "") { city_needed = 0; }

		for(var i = 0; i<comms.length;i++) {
			if(comms[i].name.toLowerCase() == name.toLowerCase()) {
				if(city_needed == 0) { // Do we care to check the parent city? If city_needed == 0, then we do not care.
					return comms[i];
				} else { // So we do care about the city_needed!
					var parent_id = find_neighbourhood_by_name(city_needed).id;
					if(parent_id == comms[i].parent_id) {
						return comms[i];
					}
				}
			}
		}
		return false;
	}

	// Take city name --> returns city object.
	function find_city_by_name(name) {
		if(!name)			 { return; }

		for(var i = 0; i<comms.length;i++) {
			if(comms[i].type == 2 && comms[i].name.toLowerCase() == name.toLowerCase()) {
				return comms[i];
			}
		}
		return false;
	}

	// Returns JSON element from comms[i] for parent of neighbourhood, given name of that neighbourhood
	// Pass in a neighbourhood name as name
	function find_parent(name,x) {
		if(!x) { x = find_neighbourhood_by_name(name); }
		for(var i = 0; i<comms.length;i++) {
			if(comms[i].id == x.parent_id) {
				return comms[i];
			}
		}
	}

	// Take a (lat,lon) location; set the geolocated_city global.
	// Helper function to perform an ajax call and find a city by location.
	// Used to help to geolocate the city more reliably than geocity
	function set_geolocated_city(lat,lon,neighbourhood, polydata) {
		if(!lat || !lon )	{ console.log("You're misusing set_geolocated_city!"); return; }
		if(!neighbourhood)	{ neighbourhood	= false; }
		if(!polydata)		{ polydata		= false; }

		if(neighbourhood) {
			if(how_many_neighbourhoods_by_name(neighbourhood) <= 1) {
				neighbourhood_object 	= find_neighbourhood_by_name(neighbourhood);
				geolocated_city_id 		= neighbourhood_object['parent_id'];
				geolocated_city 		= comms_by_id[geolocated_city_id].name;
				return;
			}
		}

		try {
			$.ajax(getcity_api_url + "lat=" + lat + "&lng=" + lon).done(function(resp) {
				// Many things might go wrong with the ajax call...error catchers!
				if(typeof resp == "undefined")		  { console.log("set_geolocated_city ajax fail"); return; }
				if(typeof resp.error != "undefined")	{ console.log("Ajax error! In set_geolocated_city"); return; }
				if(typeof resp.match[0] == "undefined") { console.log("No match! In set_geolocated_city"); return; }

				var cityid 			= resp.match[0].id; // ID # for the city we want.
				geolocated_city 	= comms_by_id[cityid].name;
				geolocated_city_id 	= cityid;
			});
		}
		catch(err) {
			console.log("Error thrown in set_geolocated_city, lat: " + lat + "; lon: " + lon);
			console.log(err);
		}
	}

	function no_location_recovery() {
		geocity();
		var message = "Sorry, we were unable to determine your location.<br/><br/>";
		message += "Please check your browser settings, and be sure to enable location services.";
		display_modal("My Location",message);
		return false;
	}