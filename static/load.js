var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 1000 - margin.right - margin.left,
    height = 250 - margin.bottom - margin.right;
var scale = 4;
var xImScale = d3.scaleLinear().domain([0, scale]).range([0, width]);
var yImScale = d3.scaleLinear().domain([0, scale]).range([0, height]);
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("image", ":first-child")
      .attr("xlink:href", function(d){return "http://lstm.seas.harvard.edu/latex/img/7c99ded238.png";})
      .attr("width", width)
      .attr("height", height);

// add grid line config
var img_width = 160;
var img_height = 40;

// draw lines
for (var i = 0; i <= scale; i++) {
		svg.append("line", ":first-child")
				.attr("x1", xImScale(0))
				.attr("y1", yImScale(i))
				.attr("x2", xImScale(scale))
				.attr("y2", yImScale(i))
				.style("stroke", "black")
				.style("opacity", "0.3");
}
for (var i = 0; i <= scale; i++) {
		svg.append("line", ":first-child")
				.attr("y1", yImScale(0))
				.attr("x1", xImScale(i))
				.attr("y2", yImScale(scale))
				.attr("x2", xImScale(i))
				.style("stroke", "black")
				.style("opacity", "0.3")
}

var words = ["\\int", "3", "d", "x"];
var words_data = [];
for (var k = 0; k < words.length; k++) {
	var scores = [];
	for (var i = 0; i < scale; i++) {
		for (var j = 0; j < scale; j++) {
			scores.push({'row': i, 'col': j, 'score': Math.random()});
		}
	}
  words_data.push({'word': words[k], 'scores': scores});
}
console.log(scores);

function addRectangles(curScores) {
   // add rectangles
  svg.selectAll("rect").remove();
  var b = svg.selectAll("rect")
    .data(curScores)
    .enter()
    .append('rect')
    .attr("width", xImScale(1) - xImScale(0))
    .attr("height", yImScale(1) - yImScale(0))
    .attr('x', function(d) { return xImScale(d.col) })
    .attr('y', function(d) { return yImScale(d.row) });
  b.style("fill", "red")
      .style("opacity", function(d) {return d.score;} );
}

addRectangles(words_data[0].scores);

console.log(xImScale(1));
console.log(yImScale(1));


//Create the SVG Viewport
var svgContainer = d3.select("body").append("svg")
                                     .attr("width",1000)
                                     .attr("height",200);

//Add the SVG Text Element to the svgContainer
var text = svgContainer.selectAll("text")
                        .data(words_data)
                        .enter()
                        .append("text");
// .text(function(d) {return d.word.substr(0, 6);} );
//Add SVG Text Element Attributes
var textLabels = text
                 .attr("x", function(d, i) { return i * 80; })
                 .attr("y", function(d, i) { return 50; })
                 .on("mouseover", function(d, i) {addRectangles(words_data[i].scores);} )
                 .text( function (d) { return d.word; })
                 .attr("font-family", "sans-serif")
                 .attr("font-size", "20px")
                 .attr("fill", "red");
