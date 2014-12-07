	function close_modal() {
		$(".modal").modal("hide");
	}

	function alert(a) { display_modal(a); }

	function display_modal(title_text,body_text,ok_text) {
		var title_default = "A message from Good Cop Bad Cop";
		if(!title_text) { title_text	= title_default;								}
		if(!body_text)	{ body_text		= title_text; 		title_text = title_default;	}
		if(!ok_text)	{ ok_text		= "Ok";											}

		$("#myModalLabel").html(title_text);
		$("#myModal .modal-body").html(body_text);
		$("#myModal").modal('show');
		$("#modal-ok").html(ok_text);
	}

	function display_sidebar_modal(title_text,body_text,ok_text) {
		var title_default = "Sidebar";
		if(!title_text) { title_text	= title_default;								}
		if(!body_text)	{ body_text		= title_text; 		title_text = title_default;	}
		if(!ok_text)	{ ok_text		= "Close";											}

		$("#sidebar_modalLabel").html(title_text);
		$("#sidebar_modal .modal-body").html(body_text);
		$("#sidebar_modal").modal('show');
		$("#sidebar_modal").bind("keypress", function() {
			$("#sidebar_modal").bind("keyup",function() {
				$("#sidebar_modal").modal("hide");
			});
		});
		$("#sidebar_modal .modal-ok").html(ok_text);
	}

	function display_option_modal(title_text, body_text, yes_action, no_action, yes_text, no_text) {
		// Set the vars correctly.
		if(!title_text) { title_text	= "You have a choice to make";	}
		if(!body_text)	{ body_text		= "Choose yes or no.";			}
		if(!yes_action) { yes_action	= function() { var x = 1; };	}
		if(!no_action)	{ no_action		= function() { var x = 1; };	}
		if(!yes_text)	{ yes_text		= "Yes";						}
		if(!no_text)	{ no_text		= "No";							}

		// Set up the text accordingly.
		$("#optionModalLabel").html(title_text);
		$("#optionModal .modal-body").html(body_text);
		$("#optionModalYes").html(yes_text);
		$("#optionModalNo").html(no_text);
		$("#optionModal").modal('show');

		// Bind actions for click, tap, or keyboard (enter and escape):
		$("#optionModalYes").bind("click tap",yes_action);
		$("#optionModalNo").bind("click tap",no_action);
	}

	// Pass in a DOM element for the image that you want to display.
	function display_image_modal(image, title_text) {
		// Set the vars correctly.
		if(!image)				{ image			= $("img")[0]; 									} // Will usually be an adroll img, 1x1 px.
		if(!title_text) 		{ title_text	= image.title || image.alt || "Untitled image";	}

		// Set up the text accordingly.
		$("#imageModalLabel").html(title_text);
		$("#imageModal .modal-body").html($(image).clone());

		$("#imageModal").modal('show');
	}

	function load_url_to_modal(url,title) {
		if(!url		|| url == "")	{ return false; 						}
		if(!title	|| title == "")	{ title = "A message from Good Cop Bad Cop";	}

		$("#modal-content-holder").load(url, function() {
			display_modal(title,$("#modal-content-holder").html());
		});
	}
	function load_url_to_modal_with_two_buttons(url, title, func_callback, param1) {
		if(!url		|| url == "")	{ return false; 						}
		if(!title	|| title == "")	{ title = "A message from Good Cop Bad Cop";	}

		$("#optionModalYes").unbind();
		$("#optionModalNo").unbind();

		$("#modal-content-holder").html('');
		$("#modal-content-holder").load(url, function() {
			display_option_modal_ext(title, $("#modal-content-holder").html(), func_callback, false, 'Submit', 'Cancel', param1);
		});
	}

// --------------------------------------------- Added by Alex -----------------------------------------------------
function display_option_modal_ext(title_text, body_text, yes_action, no_action, yes_text, no_text, param_yes) {
	// Set the vars correctly.
	if(!title_text) { title_text	= "You have a choice to make";	}
	if(!body_text)	{ body_text		= "Choose yes or no.";			}
	if(!yes_action) { yes_action	= function() { var x = 1; };	}
	if(!no_action)	{ no_action		= function() { var x = 1; };	}
	if(!yes_text)	{ yes_text		= "Yes";						}
	if(!no_text)	{ no_text		= "No";							}

	// Set up the text accordingly.
	$("#optionModalLabel").html(title_text);
	$("#optionModal .modal-body").html(body_text);
	$("#optionModalYes").html(yes_text);
	$("#optionModalNo").html(no_text);
	$("#optionModal").modal('show');

	// Bind actions for click, tap, or keyboard (enter and escape):
	$("#optionModalYes").bind("click tap", function() {
		fnCallFunc(yes_action, [param_yes]);
	});
	$("#optionModalNo").bind("click tap", no_action);
}
function fnCallFunc(fn, args) {
	fn = (typeof fn == "function") ? fn : window[fn];
	return fn.apply(this, args || []);
}
