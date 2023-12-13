import * as d3 from "/lib/d3v4.js";


//let max = d3.max(response.data, function(d, i) {
//    return data.DELAY_IN_MIN;
//});
//let min = d3.min(response.data, function(d, i) {
//    return data.DELAY_IN_MIN;
//});

//const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
//   .domain([min, max])



let zoom = d3.zoom()
    .on('zoom', () => {
        svg.attr('transform', d3.event.transform)
    });


// The svg
var svg = d3.select("#map"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Map and projection
var projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.4])

// A path generator
var path = d3.geoPath()
    .projection(projection)



// Load world shape AND list of connection
d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson") // World shape
    .defer(d3.csv, "Merged_CSV.csv") // Position of circles
    .await(ready);

function ready(error, dataGeo, data) {

    // Reformat the list of link. Note that columns in csv file are called long1, long2, lat1, lat2
    var link = []
    data.forEach(function (row) {
        source = [+row.lon_from, +row.lat_from]
        target = [+row.lon_To, +row.lat_To]
        topush = {
            type: "LineString",
            coordinates: [source, target]
        }
        link.push(topush)
    })

    // Draw the map
    svg.append("g")
        .selectAll("path")
        .data(dataGeo.features)
        .enter().append("path")
        .attr("fill", "#b8b8b8")
        .attr("d", d3.geoPath()
            .projection(projection)
        )
        .style("stroke", "#fff")
        .style("stroke-width", 0)

    // Add the path
    svg.selectAll("myPath")
        .data(link)
        .enter()
        .append("path")
        .attr("d", function (d) {
            return path(d)
        })
        .style("fill", "none")
        .style("stroke", "#69b3a2")
        .style("stroke-width", 2)

}


svg.call(zoom);
