// ***************************************** Newly adapted
	// Important global vars
	var gi; // to be used as the geoInstance instantiation, holding the map and such.
	var marker; // Global for marker code?

	var geocoder = new google.maps.Geocoder();
	var lat = 43.6631001;
	var lng = -79.4105665;
	var map;

	$(window).load(function() { initialize(); });

	function initialize() {
		var latlng = new google.maps.LatLng(lat,lng);
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
			} else if (typeof geoip_data != "undefined" &&  geoip_data['city'] && geoip_data['region']) {
				center_on_city(geoip_data['city'], geoip_data['region']);
				return true;
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


// *********************************************** Completely new and unsorted functions ************************/

	function decode_poly_query(qstring, delimiter) {
		if(!qstring		|| qstring		== "")		{ console.log("Error in decode_poly_query"); return; }
		if(!delimiter	|| delimiter	== "")		{ delimiter = ","; }

		var datalist = qstring.split(delimiter);
		var polydata = {};
		for (var i = 0; i < datalist.length; i++) {
			var datum = datalist[i].split("=");
			polydata[datum[0]] = datum[1];
		}
		return polydata;
	}
	function decode_polydata_name(name_string) {
		if(!name_string) { return false; }
		return decodeURIComponent(name_string).split('+').join(' ');
	}


// ************************************************ A new take on older ideas ***********************************/

function polygon_clicked_wrapper(layer,e,placemark) {
	return pbmaps.polygon_clicked(layer,e,placemark);
}
function item_clicked_wrapper(layer,e,placemark) {
	return pbmaps.item_clicked(layer,e,placemark);
}

	var pbmaps = {
		// --------------------- Event handlers and response functions ---------------------
			// For polygons and map stuff
				// Newer, updated polygon click handler
				polygon_clicked: function(layer,e,placemark) {
					var polydata	= geoDecodeNameString(placemark.name);
					var latLng		= e.latLng;

					// Use the other method accordingly.
					this.center_polyclick(polydata,latLng);
					if(typeof default_neighbourhoodChanged == "undefined" || default_neighbourhoodChanged == true) {
						window.location.hash = encodeURIComponent(decode_polydata_name(polydata['name'])) + "/" + polydata['store_id'];
					}
					this.show_city_dropdown(); // Just in case
				},

				// Original! Polygon click handler
				polygon_clicked_old: function(polydata,latLng) {
					console.log("called polygon_clicked version in mapping_rd.js!");
					if(!polydata	|| polydata	== "") { console.log("Error in polygon_clicked, no polydata!"); return; }

					// Use the other method accordingly.
					this.center_polyclick(polydata,latLng);
					if(typeof default_neighbourhoodChanged == "undefined" || default_neighbourhoodChanged == true) {
						window.location.hash = encodeURIComponent(decode_polydata_name(polydata['name'])) + "/" + polydata['store_id'];
					}
				},

				// Arguments optional. If given any args, the first one sets the innerHTML of .mouse-tooltip
				tooltip_html: function() {
					if(arguments.length <= 0) {
						return $(".mouse-tooltip").html();
					} else {
						return $(".mouse-tooltip").html(arguments[0]);
					}
				},

				item_clicked: function(layer,e,placemark) {
					var polydata	= geoDecodeNameString(placemark.name);
					var latLng		= e.latLng;
					var lat			= latLng.lat();
					var lng			= latLng.lng();

					// Center the map on the clicked item
					scrollMap(lat,lng);
					infobox.show();
					$("#infobox .btn_small").hide();
					if($("#neighbourhoodName").html() != "" && $("#neighbourhoodName").html() != "false") {
						infobox.open(map,marker);
					}
					$("#neighbourhoodName").html(decode_polydata_name(polydata['name']));
					setTimeout(function() { $("#neighbourhoodName").html(decode_polydata_name(polydata['name'])); }, 50);

					$(".infobox-btn-link").removeAttr("href");
					$(".infobox-btn-link").attr("href",window.location.href);
				},

		// --------------------- Funcs affecting the map graphics -----------------------------------
			// Given polydata and optional latLng, center on the appropriate neighbourhood
			center_polyclick: function(polydata,latLng) {
				if(!polydata	|| polydata	== "") { console.log("Error in center_polyclick, no polydata!"); return; }
				if(!latLng		|| latLng	== "") { latLng = ""; }

				// To eval: setting up the neighbourhood here.
				this.setNeighbourhood_wrapper(polydata);

				// Set the infobox appropriately
				if($("#neighbourhoodName").html() != "" && $("#neighbourhoodName").html() != "false") {
					infobox.open(map,marker);
				}

				var name 	= decode_polydata_name(polydata['name']);
				var id		= polydata['store_id'];
				if(latLng != "") {
					var opts_to_pass		= {};
					opts_to_pass['lat']		= latLng.lat();
					opts_to_pass['lng']		= latLng.lng();
					center_on_id(id,opts_to_pass);
				}
			},

			// Helper function to turn polydata into relevant info for calling setNeighbourhood global func.
			setNeighbourhood_wrapper: function(polydata) {

				// Set up vars we will need
					var neighbourhood_object	= comms_by_id[polydata['store_id']];
					var infobox_hood			= $('#neighbourhoodName');

				// Check for errors
					if(!infobox_hood && retrySet < 6) {
						retrySet++;
						setTimeout(function() {this.setNeighbourhood_wrapper(polydata)},100);
						return;
					} else { retrySet = 0; }
					if(!neighbourhood_object) {
						console.log("Data error: store_id from polygon not found in comms_by_id. Here's polydata: ");
						console.log(polydata);
						infobox_hood.html("Disabled neighbourhood! Sorry!");
						unset_buttons(true);
						return;
					}

				// Set globals
					selectedNeighbourhood = neighbourhood_object['name'];

				// Call the primary setNeighbourhood function
				setNeighbourhood(selectedNeighbourhood, "", neighbourhood_object['parent_id'], polydata, polydata['store_id']);
			},

			// Map setup
			setup_interactions: function() {
				// Set up the infobox
				$("#infobox").show();
			},

		// ------------------------- Funcs affecting the forms ------------------------
			show_city_dropdown: function(name) {
				if(!name || name == "") {
					var hood_id = $(".neighbourhood").find("option:selected").attr("data-formid");
					if(!hood_id || !comms_by_id[hood_id]) { return false; }
					var parent_id = comms_by_id[hood_id]['parent_id'];
					name = comms_by_id[parent_id]['name'];
				}
				$(".city").val(name);
				setTimeout(function() { $(".city").val(name); }, 50); // just in case it lags
				return true;
			},

			setForms: function(polydata) {
				if(!polydata) { console.log("Error: no polydata in pbmaps.setForms!"); return false; }
				var neighbourhood_object	= comms_by_id[polydata['store_id']];
				var selectedNeighbourhood	= neighbourhood_object['name'];
				var parentid				= neighbourhood_object['parent_id'];
				var parentname				= comms_by_id[parentid]['name'];

				$(".city").val(parentname);
				cityChanged(parentname,parentid);
				$(".neighbourhood").val(selectedNeighbourhood);
				set_buttons();
				this.show_city_dropdown();
			}
	};


// --------------------------------------------------------------- Old functions, to be updated

	function set_address_input() {
		$(".address-input").bind("keypress",function(event) {
			if(event.which == 13) {
				event.preventDefault();
				encodeAddress();
				set_buttons();
			}
		});
		$(".address-go-button").bind("click",function() {
			CLogRecoder.addInfoFromSplash('address_entered_button_pressed', '', $(".address-input").val());
			encodeAddress("","","", true); // pagejump flag is set to true -- use simply encodeAddress(); to restore default.
			set_buttons();
		});
	}

	function setBaseColour(geoXmlDoc) {
		for(var n = 0; n < gi.layers.length; n++) {
			var geoXmlDoc = gi.layers[n].geoXmlDoc;
			if(!geoXmlDoc || typeof geoXmlDoc.gpolygons === "undefined") { break; }

			for (var i=0; i<geoXmlDoc.gpolygons.length; i++) {
				geoXmlDoc.placemarks[i].polygon.normalStyle = {fillColor: "#1dafec", strokeColor: "#1dafec", fillOpacity: 0.2, strokeWidth: 2, strokeOpacity: 1};
				geoXmlDoc.placemarks[i].polygon.setOptions(geoXmlDoc.placemarks[i].polygon.normalStyle);
			}
		}
	}


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

		gi.geocoder.geocode( { 'address': address}, function(results, status) {
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
		gi.geocoder.geocode({'latLng': latlng}, function(results, status) {
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

	function setup_province_selectors() {
		$(".province-selector").show();

		$(".province-button").on("click tap",function() {
			province_changed(this,true);
		});

		// Set the cities that we should center in on, per province.
		comms_by_id[59].cityForCenter = 58; // Toronto
		comms_by_id[251].cityForCenter = 443; // Vancouver

		if(geoip_data['region'] == "BC") {
			province_changed($(".bc-button")[0]);
		} else {
			province_changed($(".on-button")[0]);
		}
	}

	// Method of adding cities to $(".city") via JS instead of PHP
	function rewrite_cities (province_id, selector) {
		if(!province_id	|| province_id	== "") { province_id	= 59;		}
		if(!selector	|| selector 	== "") { selector		= ".city";	}

		var output = '<option value="" disabled selected>Select City</option>';
		for (var i in comms) {
			if(comms[i].type == 2 && comms[i].parent_id == province_id) { // It's a city! -- Does it have children?
				if(has_children(comms[i])) { // Only list it if it has a child!
					output += "<option class='" + comms[i].name + " cityid" + comms[i].id + "' data-formid='" + comms[i].id;
					output += "' value='" + comms[i].name + "'>" + comms[i].name + "</option>";
				}
			}
		}
		$(selector).html(output);
	}

	// Similar to rewrite_cities, but for the map overlay in the neighbourhood pages, not the splash
	// A bit of a legacy, from Sam's work on the new_rd from July 2014
	function setup_map_overlay_neighbourhoods () {
		var output = '<option value="" disabled selected>Select City</option>';
		for (var i in comms) {
			if(comms[i].type == 2) { // It's a city! -- Does it have children?
				if(has_children(comms[i])) { // Only list it if it has a child!
					output += "<option id=" + comms[i].name + " class=cityid" + comms[i].id + " data-formid=" + comms[i].id;
					output += " value=" + comms[i].name + ">" + comms[i].name + "</option>";
				}
			}
		}
		$(".city").html(output);
		$(".city").change(function(e) { cityChange_user(this);      }); // Pass in the DOM object of the city being passed in.
	}

	function get_polygon_center(id) {
		var thepolygon		= get_polygon_by_id(id);
		return my_getBounds(thepolygon).getCenter();
	}

	function get_polygon_by_id(id) {
		if(!id || id == "") { return false; }

		for(var n = 0; n < gi.layers.length; n++) {
			var geoXmlDoc = gi.layers[n].geoXmlDoc;
			if(!geoXmlDoc || typeof geoXmlDoc.gpolygons === "undefined") { break; }

			for (var i=0; i<geoXmlDoc.gpolygons.length; i++) {
				var neighbourhood_polydata	= decode_poly_query(geoXmlDoc.gpolygons[i].name);
				var neighbourhood_id		= decode_polydata_name(neighbourhood_polydata['store_id']);
				if(neighbourhood_id == id) {
					return geoXmlDoc.gpolygons[i];
				}
			}
		}
	}

	// Takes a location item for GPS coordinates; returns the ID of a neighbourhood if within our network (by using polygons).
	function getNeighbourhood_from_loc(loc) {
		var indexToUse = -1;
		for(var n = 0; n < gi.layers.length; n++) {
			var geoXmlDoc = gi.layers[n].geoXmlDoc;
			if(!geoXmlDoc || typeof geoXmlDoc.gpolygons === "undefined") { break; }

			for (var i=0; i<geoXmlDoc.gpolygons.length; i++) {
				if(geoXmlDoc.placemarks[i].polygon.getVisible()) {
					if(!google.maps.geometry || !google.maps.geometry.poly) { continue; }
					if (google.maps.geometry.poly.containsLocation(loc,geoXmlDoc.gpolygons[i])) {
						var neighbourhood_polydata	= decode_poly_query(geoXmlDoc.placemarks[i].name);
						return neighbourhood_polydata['store_id'];
					}
				}
			}
		}
		if(indexToUse == -1) {
			return false;
		}
	}

	// Center on the IP-based geolocated city
	function geocity() {
		return center_on_city(geoip_data['city'],geoip_data['region']);
	}

	function handle_map_tooltip() {
		// Track mouse position while hovering over map, so that tooltip can work in geo_pb.js
		var tooltip = $(".mouse-tooltip");
		$("#map-canvas").mousemove(function(e) {
			if(infobox_mouseover || !poly_mouseover) {
				tooltip.hide();
				return;
			}
			mouse_x = e.clientX;
			mouse_y = e.clientY;
			tooltip.css("top",mouse_y - 40).css("left",mouse_x-20).show(); // Position this above the mouse, slightly.
			if(tooltip.height() > 20) {
				tooltip.css("top",mouse_y-20-tooltip.height());
			}
		});
		// Hovering over the infobox? Adjust a global var accordingly.
		$("#infobox").mouseover(function(e) {
			infobox_mouseover = true;
		});
		$("#infobox").mouseout(function(e) {
			infobox_mouseover = false;
		});

		$("#map-canvas").mouseout(function(e) {
			tooltip.hide();
		});
		$("#map_overlay, #infobox, #header, .midsection").mouseover(function(e) {
			tooltip.hide();
		});
	}

	// Highlight the polygon that currently occupies the map center.
	function highlight_centered_polygon() {
		var loc = map.center;
		try {
			if(!gi.layers || !gi.layers[0].geoXmlDoc || !gi.layers[0].geoXmlDoc.gpolygons) { return false; }
		} catch(err) { return false; }
		for(var n = 0; n < gi.layers.length; n++) {
			var geoXmlDoc = gi.layers[n].geoXmlDoc;
			if(!geoXmlDoc || typeof geoXmlDoc.gpolygons === "undefined") { break; }

			for (var i = 0; i < geoXmlDoc.gpolygons.length; i++) {
				try {
					if (geoXmlDoc.placemarks[i].polygon.getVisible()) {
						if (google.maps.geometry.poly.containsLocation(loc,geoXmlDoc.gpolygons[i])) {

							setBaseColour(geoXmlDoc);
							geoXmlDoc.placemarks[i].polygon.normalStyle = {fillColor: "#AAAAAA", strokeColor: "#FFAAAA", fillOpacity: 0.3, strokeWidth: 5, strokeOpacity: 1};
							geoXmlDoc.placemarks[i].polygon.setOptions(geoXmlDoc.placemarks[i].polygon.normalStyle);
							break;
						}
					}
				} catch (err) {
					// Do nothing.
				}
			}
		}
	}

	function no_location_recovery() {
		geocity();
		var message = "Sorry, we were unable to determine your location.<br/><br/>";
		message += "Please check your browser settings, and be sure to enable location services.";
		display_modal("My Location",message);
		return false;
	}

	// Recenter the map based on the user's current geolocation, or display an error message.
	function my_location() {
		CLogRecoder.addInfoFromSplash('my_location_button_pressed');
		if(geolocated_hood_name != "" && geolocated_hood_name != false) { geolocated = true; }

		if (!geolocated) {
			return no_location_recovery();
		}

		// If we have these things set, always scroll!
		scrollMap(geolocated_lat,geolocated_lon);

		if(!geolocated_hood_name || !geolocated_hood_id) {
			if(geolocated_loc != "") { // Means it has been found/set.
				var found_hood	= getNeighbourhood_from_loc(geolocated_loc);
				if(found_hood == false) {
					infobox.close();
					return false;
				} else {
					geolocated_hood_id		= found_hood;
					geolocated_hood_name	= comms_by_id[found_hood].name;
				}
			}
		} // implicit else
		$("#neighbourhoodName").html(geolocated_hood_name);
		setNeighbourhood(geolocated_hood_name);
		pbmaps.show_city_dropdown();
		highlight_centered_polygon();
		window.location.hash = encodeURIComponent(geolocated_hood_name) + "/" + geolocated_hood_id;

		return;
	}

	// Cause user to jump to page for neighbourhood based on their current geolocation.
	function my_location_jump(e) {
		CLogRecoder.addInfoFromSplash('my_location_button_pressed');

		if (!geolocated) {
			return no_location_recovery();
		}

		var specified_neighbourhood		= geolocated_hood_name;
		var specified_hood_id			= geolocated_hood_id;

		if(!geolocated_hood_id || !geolocated_hood_name) {
			var found_hood = getNeighbourhood_from_loc(geolocated_loc);
			if(found_hood == "" || found_hood == false) {
				return no_location_recovery();
			} else {
				specified_hood_id			= found_hood;
				specified_neighbourhood		= comms_by_id[found_hood].name;
			}
		}

		var message = "It looks like you are connecting from " + specified_neighbourhood + ". We will send you over to that neighbourhood now. Wait just one second while we load the page...";
		display_modal("Loading " + specified_neighbourhood + "...",message);
		var withinbox = elem_ancestor_with_id($(e.target)).attr("id"); // Check the elem 4 units up in the DOM from the clicked button.
		var endingurl = go_list[withinbox];
		squery = "";
		if (withinbox == "businesses") {
			squery = $("#businesses .biz-only input").val();
			if (squery != "") {
				withinbox = "businesses2";
				endingurl = go_list.businesses2 + squery;
			}
		}
		var path = pbsitehost;
		path += comms_by_id[specified_hood_id].path;
		// And now we redirect!
		window.location = path + endingurl;
	}

	function neighbourhoodChanged_by_id(id) {
		if(!id || id == "" || typeof comms_by_id[id] == "undefined") { console.log("Error: bad id ("+id+") in neighbourhoodChanged_by_id"); return false; }
		var selected_id = id;

		// Set the global - the user touched a dropdown!
		if(user_touched_dropdowns == 0) { user_touched_dropdowns = 1; }

		// First, let's grab some data about the neighbourhood just selected.
		var selected_city_id	= comms_by_id[id]['parent_id'];
		var selected_n			= comms_by_id[id]['name'];

		current_neighbourhood = selected_n; // set the global
		selectedNeighbourhood = selected_n;

		// Set the URL hashtag for easy reload.
		if(typeof default_neighbourhoodChanged == "undefined") { default_neighbourhoodChanged = true; }
		if(typeof default_neighbourhoodChanged == "undefined" || default_neighbourhoodChanged == true) {
			window.location.hash = encodeURIComponent(selected_n) + "/" + selected_id;
		}

		if(selected_n) { $("#neighbourhoodName").html(selected_n);}
		if($("#neighbourhoodName").html() != "" && $("#neighbourhoodName").html() != "false") {
			infobox.open(map,marker);
		}
		center_on_id(selected_id);

		// Change infobox.
		setNeighbourhood(selected_n, false, selected_city_id,"",selected_id);
		set_buttons();
		pbmaps.show_city_dropdown();
		setTimeout(function() { check_links(); }, 150);
		setTimeout(function() { $(".neighbourhood").val(selected_n); }, 100); // To address mobile bug: option doesn't always change properly on phones.
	}

	function neighbourhoodChanged(details, id) {
		if($(".neighbourhood").html() == "") { return false; } // Don't do anything if it's empty. Don't worry about it!
		if(arguments.length == 0) { console.log("Error: no args in neighbourhoodChanged!"); return false; }
		if(!id || id == "") {
			id = $(details).find("option:selected").attr("data-formid"); // Grab id of selected neighbourhood, to match above json.
		}
		if(id) { return neighbourhoodChanged_by_id(id); }
		else { console.log("Error in neighbourhoodChanged."); return false; }

	}

	function _process_hash_neighbourhood(hash,hood_id) {
		var parent_id = "";
		if(!hood_id) { hood_id = find_neighbourhood_by_name(hash).id; }
		else { parent_id = comms_by_id[hood_id]['parent_id']; }

		hash_for_neighbourhood = hash;
		setNeighbourhood(hash,"","","",hood_id);
		center_on_id(hood_id);
		set_buttons();
	}

	function _process_hash_city(hash) {
		hash_for_neighbourhood = hash;
		cityChanged(hash);
		center_on_city(hash);
		unset_buttons(true);
	}

	// Process the page hash
	// Go to appropriate section - or jump to neighbourhood.
	function process_hash() {
		var hash			= decodeURIComponent(window.location.hash);
		if(hash == "" || hash == "#_=_") { return center_starting_coords(); }

		// If there is a hash, let's process it.
		var hstring			= hash.substring(1);
		hash_when_loaded	= hash;
		var hood_data		= hstring.capitalize().split('/');
		var hood_name		= decodeURIComponent(hood_data[0]);
		var hood_id			= false;

		if(hood_data.length > 1 && hood_data[1].length > 1)	{
			hood_id 		= hood_data[1];
		}

		if (find_city_by_name(hood_name)) {
			_process_hash_city(hood_name);
			setTimeout(function() { _process_hash_city(hood_name); }, 150);
			hash_to_hood = true;
			return;
		} else if (find_neighbourhood_by_name(hood_name)) {
			_process_hash_neighbourhood(hood_name,hood_id);
			hash_to_hood = true;
			return;
		}

		common_process_hash(hash.split('/')[0]);
	}

	function common_process_hash(hash) {
		if(!hash || hash == "" || hash == undefined) { hash = decodeURIComponent(window.location.hash); }

		// Since this part has been delegated here:
		center_starting_coords();

		// Now let's look out for any of those join/login prompts.
		if (hash == "#join" || hash == "#signup") {
			fnShowJoinForm();
		} else if (hash == "#login" || hash == "#signin") {
			fnShowLoginForm();
		} else if (hash == "#welcome") {
			fnShowWelcomeForm();
		} else if ($(hash).length > 0){
			fnScrollTo($(hash),-52,400);
		}
	}


	function set_biz_input() {
		$(".biz-input").bind("keypress",function(event) {
			if(event.which == 13) {
				event.preventDefault();
				var selected_n = $(document).find(".neighbourhood option:selected").val();
				if (selected_n == "Neighbourhood") {
					selected_n = $(document).find("option:selected").val();
				}
				var thisbox = $(this);
				var path = pbsitehost;
				for(var i=0;i<comms.length; i++) {
					if(comms[i].name == selected_n) {
						path += comms[i].path;
						break;
					}
				}
				squery = $("#businesses .biz-only input").val();
				path += go_list.businesses2 + squery;
				// window.location = path;
			}
		});
	}

	// Helper functions for set_buttons - complex enough that this object was necessary.
	var pb_set_buttons = {
		// Set the find buttons appropriately.
		find_buttons: function(hood_obj,hood_name) {
			if(!hood_obj) { return false; }

			$(".find-button-link").removeAttr("href");

			// Set links on the "find-buttons"
			for(var key in go_list) {
				var fallback_link = pbsitehost;
				fallback_link += hood_obj.path;
				if(key == "businesses2") { continue; }

				if (key == "businesses") {
					var squery = $("#businesses .biz-only input").val();
					var keyval = squery == "" ? "businesses" : "businesses2"
					fallback_link += go_list[keyval] + squery;
				} else {
					fallback_link += go_list[key];
				}

				$("#" + key + " .find-button-link").attr("href",fallback_link);

				// And now set the titles
				if(key == "map_overlay") {
					$("#" + key + " .find-button-link").attr("title","Go to " + hood_name);
				} else {
					$("#" + key + " .find-button-link").attr("title","Find " + key + " in " + hood_name);
				}
			}
			return true;
		},

		infobox: function(hood_obj,hood_name) {
			if(!hood_name) { console.log("Error: pb_set_buttons.infobox w/o hood_name"); return false; }

			$("#neighbourhoodName").html(hood_name);

			// Update the "go now" link
			$(".infobox-btn-link").removeAttr("href");
			$(".infobox-btn-link").attr("href",hood_obj.path);

			setTimeout(function() {
				$(".infobox-btn-link").attr("href",hood_obj.path);
				$("#neighbourhoodName").html(hood_name);
			}, 50); // Because this always lags!

			// Update title
			$("#infobox .btn_small").attr("title","Go to " + hood_name);
			return true;
		},

		// For the marker (image) right above the infobox.
		marker: function(hood_obj,hood_name) {
			if(!hood_obj) {return false;}
			if(marker) {
				marker.unbind('click'); // First unbind all previous listeners.
				google.maps.event.addListener(marker, 'click', function() {
					window.location = "/" + hood_obj.path;
					return; // Not entirely necessary, but oh well.
				});
			}
			return true;
		},

		// Set the my_location button accordingly.
		my_location: function(hood_obj,hood_name) {
			// Set my_location_neighbourhood to set those buttons accordingly.
			var my_home_neighbourhood = geolocated_hood_name;
			var my_work_neighbourhood = geolocated_hood_name;
			if(geolocated_hood_name == "") {
				my_location_neighbourhood = hood_name;
			}
		}
	}

	// This function needs a good cleanup!
	function set_buttons(hood_obj) {
		if(!hood_obj && $(".neighbourhood").val() == null)	{ return false; } // Error

		if(!hood_obj)	{ hood_obj = comms_by_id[$(".neighbourhood").find("option:selected").attr("data-formid")]; }
		var hood_name = hood_obj['name'];

		// Slide up/down buttons in map_overlay and below
		$(".find-button").stop().clearQueue().slideDown('slow');
		$(".select_neighbourhood_prompt").stop().clearQueue().slideUp();

		pb_set_buttons.infobox		(hood_obj, hood_name);
		pb_set_buttons.marker		(hood_obj, hood_name);
		pb_set_buttons.find_buttons	(hood_obj, hood_name);
		setTimeout(function() {
			pbmaps.show_city_dropdown();
		},500);
	}
	function set_menus_by_id(id) {
		if(!id)									{ console.log("No id given in set_menus_by_id");	return false; }
		var hood_obj		= comms_by_id[id];
		if(typeof hood_obj == "undefined")		{ console.log("Bad id given in set_menus_by_id");	return false; }

		if(hood_obj['type'] == 2) { // It's a city! Update accordingly.
			$(".city").val(hood_obj['name']);
			cityChanged(hood_obj['name'],hood_obj['id']);
			return;
		} // implicit else

		var parent_obj = comms_by_id[hood_obj['parent_id']];

		$(".city").val(parent_obj['name']);
		cityChanged(parent_obj['name'],parent_obj['id']);
		$(".neighbourhood").val(hood_obj['name']);
		set_buttons(hood_obj);
	}

	function setMenus(hood_name, iscity, parentid, polydata,id) {
		if(!id			|| id			== "")	{ id = false; }
		if(id)									{ return set_menus_by_id(id); }
		if(!hood_name 	|| hood_name 	== "")	{ return false;  } // That's an error!
		var neighbourhood_object = false;

		if(!iscity   || iscity == "")   { iscity = false;	}
		if(!parentid || parentid == "") { parentid = 0;		}
		if(!polydata || polydata == "") { polydata = false;
		} else { // If given polydata, use it!
			// pbmaps.setForms(polydata);
		}

		if(iscity) {
			$(".city").val(hood_name);
			console.log("iscity in setmenus");
			cityChanged(hood_name);
			return;
		} // implicit else

		var parentname = $(".cityid" + parentid).html();
		var neighbourhood_object = find_neighbourhood_by_name(hood_name,parentname);
		parentid = neighbourhood_object.parent_id;

		$(".city").val(parentname);
		cityChanged(parentname,parentid);
		$(".neighbourhood").val(hood_name);
		set_buttons();
	}

	// Given a neighbourhood or city name, return "city" or "neighbourhood" type.
	function typeof_neighbourhood(name) {
		for(var i=0;i<comms.length; i++) {
			if(comms[i].name == name) {
				switch (comms[i].type) {
					case(4):
						return "country";
					case(3):
						return "province";
					case(2):
						return "city";
					case(1):
						return "neighbourhood";
					default:
						return "Not 1-4";
				}
			}
		}
		return "Not found.";
	}

	function unset_buttons (definitely_unset) {
		if(!definitely_unset) { definitely_unset = false; }
		current_neighbourhood = $(".neighbourhood").val();
		if((current_neighbourhood != "" || current_neighbourhood != null) && !definitely_unset) { return 1; }
		$(".location-button").unbind();
		$(".biz-input").unbind("keypress");

		$("#map_overlay .find-button").stop().clearQueue().slideUp('slow');
		$(".find-button-link").removeAttr("href");
		$(".infobox-btn-link").removeAttr("href");
		$(".find-button-link, .infobox-btn-link").attr("title","You must select a neighbourhood first!");

		$(".select_neighbourhood_prompt").slideDown();
		$(".find-button").slideUp();
	}
