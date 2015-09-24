// GLOBALS
var projection, 
	path, 
	svg, 
	attributeArray = [], 
	currentAttribute = 0, 
	playing = false;

var sliderScale,
	slider;

var allCafeDataObj = {};
var yearsVisitedArray = [],
	currentyear = 2009,
	lastyear;

var tips;

var essayBoxShown = false;


function init() {
	setMap();
}

function setMap() {

	var width = 1000,
		height = 600;	

	projection = d3.geo.albers()
		.scale( 350000 )
		.rotate( [122.4413,0] )
		.center( [0, 37.7595] )
		.translate( [width/2, height/2] );

	path = d3.geo.path()
					.projection(projection);

	svg = d3.select("#map")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	loadData();
	// loadCafeData();

}

function loadData() {
  queue()
    .defer(d3.json, "data/airbnb_neighborhoods.json")
    .defer(d3.json, "data/sf_roads.json")
    .defer(d3.csv, "data/rent.csv")
    .await(processData);
}

function processData(error, airbnbFile, roadsFile, rentData) {
	var neighbourhoods = airbnbFile.features;

	for (var i in neighbourhoods) {
		for (var j in rentData) {
  		if (neighbourhoods[i].properties.neighbourhood == rentData[j].neighbourhood) {
  			for (var k in rentData[i]) {
  				if (k != 'neighbourhood' && k != 'neighbourhood_group') {
  					if (attributeArray.indexOf(k) == -1) {
  						attributeArray.push(k);
  					}
  					neighbourhoods[i].properties[k] = Number(rentData[j][k]);
  				}
  			}
  			break;
  		}
		}
	}

	for (var i in attributeArray) {
		attributeArray[i] = parseInt(attributeArray[i]);
	}

	// console.log(topojson.mesh(roadsFile, roadsFile.objects.sf))
	// console.log(airbnbFile.features)

	drawMap(airbnbFile, roadsFile);
}

function drawMap(airbnbFile, roadsFile) {

	// draws road boundaries
	var roads = svg.append("g");

	roads.append('path')
		.datum(topojson.mesh(roadsFile, roadsFile.objects.sf))
		.attr("class", "road")
		.attr('d', path)
		.attr("fill", "transparent")
		.attr("stroke", "#000")
		.attr("stroke-width", 0.14);

	// draws neighborhood boundaries
	var neighborhoods = svg.append("g");

	neighborhoods.selectAll(".neighbourhood")
		 .data(airbnbFile.features)
		 .enter()
		 .append('path')
		 .attr('class', 'neighbourhood')
		 .attr('d', path)
	   .attr("stroke", "#FFFFFF")
	   .attr("stroke-width", 1)
		 .attr('fill', "#2d5ebf")
		 .attr('fill-opacity', function(d) {
			 return getColor(d.properties[attributeArray[currentAttribute]]);
		 })
		 .on("mouseover", function(d) {
		 		
		 	 if (d3.select(this).attr("stroke-width") == 1) {
		 	 	d3.select(this).attr("stroke-width", 3);
		 	 }
		 })
		 .on("click", function(d) {

		 	 d3.selectAll(".neighbourhood")
		 	 	.attr('fill', "#2d5ebf")
		 	 	.attr('fill-opacity', function(d) {
			 		return getColor(d.properties[attributeArray[currentAttribute]]);
		 		})

		 	 d3.select(this)
		 	 	 .attr("fill", "#47b1bc")
		 	 	 .attr("fill-opacity", 0.65);

    		
    		d3.select('#currentRent')
    			.text(function () {
    				if (d.properties[currentyear] == 0) {
    					return "no data"
    				} else {
    				return d.properties[currentyear];
    				}
    			})

    		d3.select('#currentNeighborhood')
    			.text(function () {
    				return d.properties.neighbourhood;

    			})
		  }
		)
		 .on("mouseout", function(d) {
				if (d3.select(this).attr("stroke-width") == 3) {
		 	 		d3.select(this).attr("stroke-width", 1);
		 	 }
		 });

	setupLightBox();
	loadCafeData();
}

function loadCafeData() {
	queue()
    .defer(d3.json, "data/cafes_2009_links.json")
    .defer(d3.json, "data/cafes_2010_links.json")
    .defer(d3.json, "data/cafes_2011_links.json")
    .defer(d3.json, "data/cafes_2012_links.json")
    .defer(d3.json, "data/cafes_2013-1_links.json")
    .defer(d3.json, "data/cafes_2013-2_links.json")
    .defer(d3.json, "data/cafes_2014-1_links.json")
    .defer(d3.json, "data/cafes_2014-2_links.json")
    .defer(d3.json, "data/cafes_2015-1_links.json")
    .defer(d3.json, "data/cafes_2015-2_links.json")
    .await(storeCafesInArray);
}

function storeCafesInArray() {
	var allCafeData = Array.prototype.slice.call(arguments);
	allCafeData.shift();	// gets rid of 'error' - default first arg in queue arguments

  // store cafedata in an object with key-value pairs 
  // where (key: year, object: corresponding cafe data)
  for (var i in allCafeData) {
  	allCafeDataObj[(i*1 + 2009)] = allCafeData[i];
  }
	
	// console.log(allCafeDataObj);
	drawBaseMap(allCafeDataObj);
	createSlider(allCafeDataObj);
}

function drawBaseMap(allCafeDataObj) {
	drawCafes(allCafeDataObj[2009]);
}

// draws cafes for single year layer
function drawCafes(cafeData) {
	// console.log(cafeData)

	var yearAsClass = "year" + cafeData.year.toString();
	// console.log(yearAsClass);

	// draws center coffeeshop radius
	var coffeeShops = svg.append("g");

	coffeeShops.selectAll("circle")
		.data(cafeData.features)
		.enter()
		.append("circle")
		.attr("class", yearAsClass)
		.attr("opacity", 0)
		.attr("stroke", "#999")
		.attr("stroke-width", 0.06)
		.attr("r",2)
		.attr("cx", function (d) {
			return projection(d.geometry.coordinates)[0];
		})
		.attr("cy", function (d) {
			return projection(d.geometry.coordinates)[1];
		})
		.attr("fill", "#de1028")
		.transition()
		.duration(1000)
		.attr("opacity", 0.6);

	// draws outer coffeeshop radius
	var coffeeShopsOverlay = svg.append("g");
	coffeeShopsOverlay.selectAll("circle")
		.data(cafeData.features)
		.enter()
		.append("circle")
		.attr("class", yearAsClass)
		.attr("opacity", 0)
		.attr("r",5)
		.attr("cx", function (d) {
			return projection(d.geometry.coordinates)[0]
		})
		.attr("cy", function (d) {
			return projection(d.geometry.coordinates)[1]
		})
		.attr("fill", "#e8221b")
		.attr("stroke", "#999")
		.attr("stroke-width", 0.06)
		.transition()
		.duration(1000)
		.attr("opacity", 0.15);

	// draws outer coffeeshop radius
	var tips = svg.append("g");
	tips.selectAll("circle")
		.data(cafeData.features)
		.enter()
		.append("circle")
		.attr("class", 'tip')
		.attr("opacity", 0.0)
		.attr("r",3)
		.attr("cx", function (d) {
			return projection(d.geometry.coordinates)[0]
		})
		.attr("cy", function (d) {
			return projection(d.geometry.coordinates)[1]
		})
		.attr("fill", 'black');
  
	var tip = d3.tip()
							.attr('class', 'd3-tip')
							.offset(function (d) { return [18, 20+3*d.properties.Name.length] })
							.html(function (d) { return d.properties.Name })

	d3.selectAll('circle').call(tip);

	// opens link to yelp page for coffeeshop
	d3.selectAll(".tip")
		.on('mouseover', function (d) {
			if (d3.select(this).attr('opacity') == 0) {
				d3.select(this).attr('opacity', 0.6);
			}
			tip.show(d)

		})
		.on('mouseout', function (d) {
			if (d3.select(this).attr('opacity') == 0.6) {
				d3.select(this).attr('opacity', 0);
			}
			tip.hide(d)
		})
		.on("click", function(d) {
			window.open(d.link, '_newtab');
		});
}

// remove cafes for single year layer
function removeCafes(cafeData) {
	var yearAsClass = "year" + cafeData.year.toString();

	d3.selectAll("." + yearAsClass)
		.transition()
		.duration(1000)
		.style("opacity", 0)
		.remove();
}


function sequenceMap(allCafeDataObj, year) {

  yearsVisitedArray.push(year);		// keep track of what years visited

  lastyear = currentyear;	// constantly update lastyear and currentyear
  currentyear = year;
  // console.log(lastyear);
  // console.log(currentyear);

  if (lastyear <= currentyear) {
    drawCafes(allCafeDataObj[year]);	// only draw new cafes if year is increasing
  }
  if (lastyear > currentyear) {
  	removeCafes(allCafeDataObj[lastyear]);	// remove cafes if going back in time
  }

  d3.selectAll('.neighbourhood')
  	.transition()  
    .duration(1000)  
    .attr('fill-opacity', function(d) {
      return getColor(d.properties[attributeArray[currentAttribute]]);  // fill in neighborhoods with corresponding color
    })
}

function getColor(valueIn) {
	var color = d3.scale.linear() // create a linear scale
    .domain([0, 4100])  // input uses min and max values
    .range([.1,1]);   // output for opacity between .3 and 1 %
  return color(valueIn);  // return that number to the caller
}

function createSlider(allCafeData) {
	var val = slider ? slider.value() : 0;

	var axis = d3.svg.axis()	// create axis with labels corresponding to janky year #s
							 .orient("bottom")
							 .tickPadding(5)
							 .tickFormat(function (d) {
							 		var mapper = {
							 			2009: "PRE-'10",
							 			2010: "'10",
							 			2011: "'11",
							 			2012: "'12",
							 			2013: "'13",
							 			2014: "",
							 			2015: "'14",
							 			2016: "",
							 			2017: "'15",
							 			2018: ""
							 		}
							 		return mapper[d]
							 	});

	// console.log(attributeArray);
	slider = d3.slider().axis(axis).min(2009).max(2018).step(1)
							.on("slide", function(evt, value) {
							 d3.selectAll('.neighbourhood')
						   currentAttribute = attributeArray.indexOf(value);
						   sequenceMap(allCafeDataObj, value);		// value keeps track of current year
						  d3.select("#currentYear")	// display current year in sidebar
    						.text(function () {
							 		var mapper = {
							 			2009: "pre-2010",
							 			2010: "June 2010",
							 			2011: "June 2011",
							 			2012: "June 2012",
							 			2013: "February 2013",
							 			2014: "August 2013",
							 			2015: "February 2014",
							 			2016: "August 2014",
							 			2017: "February 2015",
							 			2018: "August 2015"
							 		}
							 		return mapper[currentyear];
    						})
						  })
							.value(val);

	d3.select("#slider-div")
		.call(slider);

	d3.selectAll("a.d3-slider-handle").style("top","-10px");

}

// function animateMap(allCafeData) {

//   var timer;  // create timer object
//   d3.select('#play')  
//     .on('click', function() {  // when user clicks the play button
//       if(playing == false) {  // if the map is currently playing
//         timer = setInterval(function(){   // set a JS interval
//           if(currentAttribute < attributeArray.length-1) {  
//               currentAttribute +=1;  // increment the current attribute counter
//           } else {
//               currentAttribute = 0;  // or reset it to zero
//           }
//           sequenceMap(allCafeData);  // update the representation of the map 

//           d3.select('#clock').html(attributeArray[currentAttribute]);  // update the clock
//         }, 3000);
      
//         d3.select(this).html('stop');  // change the button label to stop
//         playing = true;   // change the status of the animation
//       } else {    // else if is currently playing
//         clearInterval(timer);   // stop the animation by clearing the interval
//         d3.select(this).html('play');   // change the button label to play
//         playing = false;   // change the status again
//       }
//   });
// }

function setupLightBox() {
	$('#showMore').click(function(e) {
		e.preventDefault();
		window.location.hash = '#/description';
		essayBoxShown = !essayBoxShown;
		if (essayBoxShown) {
			$('#essayBox').css('display', 'block');
			$('#essayBox').animate({'opacity':1.0}, 500);
			$(this).text('... back to map ');
		} else {
			closeEssayBox();
			$(this).text('... more ');
		}
	});
;
	$('#essayBox').click(function () {
		closeEssayBox();
		$('#showMore').text('... more ');
	});

	$('#backToMap').on('click', function (e) {
		e.preventDefault();
		closeEssayBox();
		$('#showMore').text('... more')
	});
}

function closeEssayBox() {
	$('#essayBox').animate({'opacity':0}, 500, function () {
		$('#essayBox').css('display', 'none');
	})

	essayBoxShown = false;
}

window.onload = init();  // wahoo
