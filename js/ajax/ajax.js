function frontend(){

};

function mapping(){

};

$(function(){
	$.ajax({
		url: 'http://goodcopbadcop.co/en/api/v1/incident_service.json',
		type: 'GET',
		dataType: "jsonp",
		error: function(result,a,b){
			console.log(":(");
			console.log(result, a, b);
		},
		success: function(result,a,b){
			console.log("Huzzah!");
			console.log(result);
			frontend();
			mapping();
		}
	});
});