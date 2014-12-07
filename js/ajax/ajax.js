function displayData(data){
	$('#mostRecent').find('h4.incident').text(data.node_title);
	$('#videoTitle').text(data.node_title);
};


$(function(){
	$.ajax({
		url: 'http://goodcopbadcop.co/en/api/v1/incident_service',
		type: 'GET',
		dataType: "json",
		error: function(result,a,b){
			console.log(":(");
			console.log(result, a, b);
		},
		success: function(result,a,b){
			console.log("Huzzah!");
			console.log(result);
			var data = result;
			displayData(data);
			incident_ajax_callback(data);
		}
	});
});
