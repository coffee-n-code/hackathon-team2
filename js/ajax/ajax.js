$(function(){
	$.ajax({
		url: 'http://goodcopbadcop.co/en/api/v1/incident_service.json',
		type: 'GET',
		dataType: 'jsonp',
		success: function(){
			console.log("Huzzah!");
		}
	});
});