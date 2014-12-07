function constructSrc(data, index){
	var src = data[index]['Evidence Piece'][0].field_media_url['und'][0].display_url.replace('https://www.youtube.com/watch?v=','');
	return src;
};

function displayData(data){
	$('#mostRecent').find('h4.incident').text(data[0].node_title);
	$('#mostRecent').find('.video-thumbnail').attr('href', data[0]['Evidence Piece'][0].field_media_url['und'][0].display_url);
	$('#mostRecent').find('.video-thumbnail').html('<iframe width="250" height="150" src="//www.youtube.com/embed/'+constructSrc(data, 0)+'" frameborder="0" allowfullscreen></iframe>');
	$('#highestRated').find('h4.incident').text(data[2].node_title);
	$('#highestRated').find('.video-thumbnail').attr('href', data[2]['Evidence Piece'][0].field_media_url['und'][0].display_url);
	$('#highestRated').find('.video-thumbnail').html('<iframe width="250" height="150" src="//www.youtube.com/embed/'+constructSrc(data, 2)+'" frameborder="0" allowfullscreen></iframe>');
	$('#lowestRated').find('h4.incident').text(data[1].node_title);
	$('#lowestRated').find('.video-thumbnail').attr('href', data[1]['Evidence Piece'][0].field_media_url['und'][0].display_url);
	$('#lowestRated').find('.video-thumbnail').html('<iframe width="250" height="150" src="//www.youtube.com/embed/'+constructSrc(data, 1)+'" frameborder="0" allowfullscreen></iframe>');
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
