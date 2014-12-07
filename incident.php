<?php 
	print_r($_REQUEST);

?>

<!DOCTYPE html>
<html>
	<head prefix="">

		<title>Police Accountability</title>

		<?php include("includes/_header.php"); ?>

		<div class="container-fluid">
			<div class="row">

				<section class="col-md-9" id="video">
				<!-- Video -->
					<iframe width="560" height="315" src="//www.youtube.com/embed/POn2DcIbUpA" frameborder="0" allowfullscreen></iframe>
					<!-- Details -->
					<div class="incident-details">
						<h2 id="videoTitle"><strong>Officer Mustache pulls man out of vehicle</strong></h2>
						<h3 id="officer"><strong>Officer:</strong> Officer Mustache</h3>
						<h3 id="precinct"><strong>Precinct:</strong> Union Station Precinct</h3>
						<h3 id="location"><strong>Location:</strong> University of Toronto St. George Campus</h3>
						<!-- Incident summary -->
						<p id="incident">Officer Mustache pulled over James Webbs when he was driving in the University of Toronto campus. The officer approached Webbs and immediately tried to pull him out of the truck, Webbs fought back until another officer intervened.</p>
						<!-- Votes -->
						<ul class="votes">
							<li class="btn btn-success"><span class="glyphicon glyphicon-thumbs-up"></span> Up Votes</li>
							<li class="btn btn-danger"><span class="glyphicon glyphicon-thumbs-down"></span> Down Votes</li>
						</ul>	
					</div>
				</section>
				<!-- Related incidents -->
				<aside class="col-md-3" id="related">
				<h4>Related Incidents</h4>
					<ul class="relat>d-incidents">
						<li><h5><strong>Kitten saved by officer</strong></h5>
							<p>Officer Mittens saves a rescues a kitten from a tree at University of Toronto, St. George Campus<a href="#"> View</a></p>
							
						</li>
						<li><h5><strong>Man on segway attacked by officer</strong></h5>
							<p>Officer Mustache attacks man on a segway near Young and Dundas <a href="#"> View</a></p>
							
						</li>
						<li><h5><strong>Officer pulls gun out on young skateboarder</strong></h5>
							<p>Officer Mustache pulls out gun on 15 year old skateboarder near Union Station<a href="#"> View</a></p>
						</li>
					</ul>
				</aside>
			</div>
		</div>

		<?php include("includes/_footer.php"); ?>
	</body>	
</html>
