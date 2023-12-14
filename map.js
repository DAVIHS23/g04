// Define variables and constants in the global scope
const svg = d3.select("#map");
const width = +svg.attr("width");
const height = +svg.attr("height");
const projection = d3.geoMercator().scale(150).translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

// Create a clip path to restrict the drawing area
svg.append("defs").append("clipPath")
    .attr("id", "map-clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

let resetTimer;

// Enable zoom
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', function (event) {
        const { transform } = event;

        // Apply the zoom transformation only to the world map
        svg.select('#world-map')
            .attr('transform', `translate(${transform.x}, ${transform.y}) scale(${transform.k})`);

        // Apply a separate zoom transformation to the connections
        svg.select('#connections')
            .attr('transform', `translate(${transform.x}, ${transform.y}) scale(${transform.k})`);

        // Clear existing timer
        clearTimeout(resetTimer);

        // Set a timer to reset the zoom after 2 seconds
        resetTimer = setTimeout(() => {
            svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
        }, 2000);
    });

svg.call(zoom);

// Disable dragging for the map
svg.select('#world-map').style('pointer-events', 'none');

// Load the world map and connections
d3.json("https://unpkg.com/world-atlas@1/world/110m.json").then(worldData => {
    // Create a group for both the world map and connections
    const container = svg.append("g").attr('id', 'container').attr("clip-path", "url(#map-clip)");

    // Create a group for the world map
    const worldMapGroup = container.append("g").attr('id', 'world-map');

    worldMapGroup.selectAll("path")
        .data(topojson.feature(worldData, worldData.objects.countries).features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "#b8b8b8")
        .style("stroke", "#fff")
        .style("stroke-width", 0.5);

    // Load the CSV data without filtering
    loadAllData();
});

// Load the CSV data without filtering
function loadAllData() {
    console.log("Loading all data");

    d3.csv("Merged_CSV.csv").then(data => {
        console.log("CSV Data:", data);

        // Remove existing paths
        svg.selectAll(".connection").remove();

        // Create a group for the connections
        const connectionsGroup = svg.select("#container").append("g").attr('id', 'connections');

        const link = data.map(d => ({
            type: "LineString",
            coordinates: [
                [parseFloat(d.lon_from), parseFloat(d.lat_from)],
                [parseFloat(d.lon_To), parseFloat(d.lat_To)]
            ]
        }));

        // Add the connections to the separate group
        connectionsGroup.selectAll(".connection")
            .data(link)
            .enter()
            .append("path")
            .attr("class", "connection")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", "#69b3a2")
            .style("stroke-width", 2);
    });
}

// Event listener for dropdown change
document.getElementById("seasonSelector").addEventListener("change", function () {
    const selectedSeason = this.value;

    if (selectedSeason === "All") {
        loadAllData(); // Load all data without filtering
    } else {
        loadFilteredData(selectedSeason); // Load data with filtering
    }
});

// Load the CSV data based on the selected season
function loadFilteredData(selectedSeason) {
    console.log("Loading data for season:", selectedSeason);

    d3.csv("Merged_CSV.csv").then(data => {
        console.log("CSV Data:", data);
        const filteredData = data.filter(d => d.SEASON === selectedSeason);

        // Select the existing connections group
        const connectionsGroup = svg.select("#connections");

        // Update existing connections based on filtered data
        const link = filteredData.map(d => ({
            type: "LineString",
            coordinates: [
                [parseFloat(d.lon_from), parseFloat(d.lat_from)],
                [parseFloat(d.lon_To), parseFloat(d.lat_To)]
            ]
        }));

        // Select all existing connections, bind new data, and update
        const connections = connectionsGroup.selectAll(".connection")
            .data(link);

        // Remove connections that are no longer needed
        connections.exit().remove();

        // Add new connections
        connections.enter()
            .append("path")
            .attr("class", "connection")
            .merge(connections)
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", "#69b3a2")
            .style("stroke-width", 2);
    });
}
