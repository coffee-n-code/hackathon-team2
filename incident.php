<!DOCTYPE html>
<html>
	<head prefix="">

		<title>Police Accountability</title>

		<?php include("includes/_header.php"); ?>

		<div class="container-fluid">
			<div class="row">

				<section class="col-md-9" id="video">
				<!-- Video -->
					<iframe width="560" height="315" src="//www.youtube.com/embed/oYncQo8cwv0" frameborder="0" allowfullscreen></iframe>
					<!-- Details -->
					<div class="incident-details">
						<h2 id="videoTitle">Video Title</h2>
						<h3 id="officer">Police Officer Involved</h3>
						<h3 id="precinct">Precinct</h3>
						<h3 id="location">Location</h3>
						<!-- Incident summary -->
						<p id="incident">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet incidunt aliquid voluptatem, recusandae eveniet. Deserunt, distinctio est, iste odio aperiam vero laudantium unde ut rerum quia natus sunt, voluptates officia.</p>
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
					<ul class="related-incidents">
						<li><h5>Incident Title</h5>
							<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eius, alias. <a href="#">View</a></p>
							
						</li>
						<li><h5>Incident Title</h5>
							<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corporis labore hic eos aliquam nulla omnis vel quae. <a href="#">View</a></p>
							
						</li>
						<li><h5>Incident Title</h5>
							<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Molestiae ut nostrum nulla excepturi quis consectetur illo, dolorum placeat ducimus hic. <a href="#">View</a></p>
						</li>
					</ul>
				</aside>
			</div>
		</div>
	</body>	
</html>
