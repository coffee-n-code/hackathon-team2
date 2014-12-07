// ***************************************** Newly adapted
	// Important global vars
	var gi; // to be used as the geoInstance instantiation, holding the map and such.
	var marker; // Global for marker code?

	var geocoder = new google.maps.Geocoder();
	var lat = 38.7442;
	var lng = -90.305300;
	var latlng = new google.maps.LatLng(lat,lng);
	var map;



// --------------------- The window load function...

	$(window).load(function() {
		initialize();
		addMarker(latlng);
		getGeolocation();
	});




// ------------------------------- Now for the bulk of the mapping functions

	function initialize() {
		var mapOptions = {
			zoom: 10,
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

	function incident_ajax_callback(data) {
		if(!data)	{ console.log("Error: no data given in incident_ajax_callback."); }

		for(var i = 0 ; i < data.length; i++) {
			addIncident(data[i]);
		}
	}

	function addIncident(incident) {
		var latlng		= new google.maps.LatLng(incident['location_latitude'], incident['location_longitude']);

		addMarker(latlng);
	}


	function addMarker(latlng, url, image_src) {
		if(!latlng	|| latlng	== "") { return false; }
		if(!url		|| url		== "") { url = "incident.php"; }
		if(!image	|| image	== "") { image_src	= 'images/bad-marker.png'; }

		var image = {
			url: image_src,
			// This marker is 20 pixels wide by 32 pixels tall.
			size: new google.maps.Size(35,45),
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


	function no_location_recovery() {
		geocity();
		var message = "Sorry, we were unable to determine your location.<br/><br/>";
		message += "Please check your browser settings, and be sure to enable location services.";
		display_modal("My Location",message);
		return false;
	}