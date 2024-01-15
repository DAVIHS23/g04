// Define variables and constants in the global scope
const svg = d3.select("#map");
const width = +svg.attr("width");
const height = +svg.attr("height");
const projection = d3.geoMercator().translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

let routeDelays = {};
let colorScale = d3.scaleLinear().domain([-65, 0, 146.33]).range(["#0041C2", "#00ff00", "#8B0000"]);


// Create a clip path to restrict the drawing area
svg.append("defs").append("clipPath")
    .attr("id", "map-clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

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

    // Initial load of all data
    loadData("All", "All");
});

// Event listener for season selector change
document.getElementById("seasonSelector").addEventListener("change", function () {
    const selectedSeason = this.value;
    const selectedAircraftTypes = getSelectedAircraftTypes();
    loadData(selectedSeason, selectedAircraftTypes);
});

// Event listener for aircraft type selector change
document.getElementById("aircraftTypeSelector").addEventListener("change", function () {
    const selectedAircraftTypes = getSelectedAircraftTypes();
    const selectedSeason = document.getElementById("seasonSelector").value;
    loadData(selectedSeason, selectedAircraftTypes);
});

// Function to get selected aircraft types
function getSelectedAircraftTypes() {
    return Array.from(document.getElementById("aircraftTypeSelector").selectedOptions, option => option.value);
}

// Load the CSV data based on the selected season and aircraft types
function loadData(selectedSeason, selectedAircraftTypes) {
    console.log("Loading data for season:", selectedSeason, "and aircraft types:", selectedAircraftTypes);

    d3.csv("Data/Flights.csv").then(data => {
        let routes = {};

        data.forEach(d => {
            // Check if the current data point matches the selected season and aircraft type(s)
            if ((selectedSeason === "All" || d.SEASON === selectedSeason) &&
                (selectedAircraftTypes.length === 0 || selectedAircraftTypes.includes("All") || selectedAircraftTypes.includes(d.AIRCRAFT_TYPE))) {
                let routeKey = d.FROM + "-" + d.TO;
                if (!routes[routeKey]) {
                    routes[routeKey] = {
                        from: d.FROM,
                        to: d.TO,
                        count: 0,
                        totalDelay: 0,
                        totalFlightTime: 0,
                        latFrom: +d.LAT_FROM,
                        lonFrom: +d.LON_FROM,
                        latTo: +d.LAT_TO,
                        lonTo: +d.LON_TO
                    };
                }
                routes[routeKey].count++;
                routes[routeKey].totalDelay += +d.DELAY_IN_MIN;

                // Manually extract hours, minutes, and seconds from the "HH:MM:SS" format
                const flightTimeParts = d.FLIGHT_TIME.match(/(\d{2}):(\d{2}):(\d{2})/);
                if (flightTimeParts) {
                    const hours = parseInt(flightTimeParts[1], 10);
                    const minutes = parseInt(flightTimeParts[2], 10);
                    const seconds = parseInt(flightTimeParts[3], 10);

                    // Calculate total flight time in seconds
                    const totalFlightTimeSeconds = (hours * 3600) + (minutes * 60) + seconds;
                    routes[routeKey].totalFlightTime += totalFlightTimeSeconds;
                }
            }
        });

        let routeData = Object.values(routes).map(route => {
            route.averageDelay = route.totalDelay / route.count;

            // Calculate average flight time in seconds and convert it to "HH:MM:SS" format
            const averageFlightTimeSeconds = route.totalFlightTime / route.count;
            const averageHours = Math.floor(averageFlightTimeSeconds / 3600);
            const averageMinutes = Math.floor((averageFlightTimeSeconds % 3600) / 60);
            const averageSeconds = Math.floor(averageFlightTimeSeconds % 60);

            route.averageFlightTime = `${String(averageHours).padStart(2, '0')}:${String(averageMinutes).padStart(2, '0')}:${String(averageSeconds).padStart(2, '0')}`;

            return {
                type: "LineString",
                coordinates: [
                    [route.lonFrom, route.latFrom],
                    [route.lonTo, route.latTo]
                ],
                averageDelay: route.averageDelay,
                averageFlightTime: route.averageFlightTime,
                count: route.count,
                from: route.from,
                to: route.to
            };
        });

        // Clear existing connections before drawing new ones
        svg.select("#connections").remove();

        // Draw the filtered routes
        drawRoutes(routeData);
    });
}

// Function to dynamically define the color scale
function getColorScale(data) {
    // Calculate the minimum and maximum delay values from the data
    const delayValues = data.map(d => d.averageDelay);
    const minDelay = d3.min(delayValues);
    const maxDelay = d3.max(delayValues);

    // Define the range of colors you want to use
    const colorRange = ["#0041C2", "#00ff00", "#8B0000"]; // Modify this array as needed

    // Create a linear scale mapping delay values to colors
    return d3.scaleLinear()
        .domain([minDelay, 0, maxDelay]) // Use minDelay and maxDelay as the domain
        .range(colorRange);
}

// Function to draw routes
function drawRoutes(routeData) {
    const connectionsGroup = svg.select("#container").append("g").attr('id', 'connections');

    connectionsGroup.selectAll(".connection")
        .data(routeData)
        .enter()
        .append("path")
        .attr("class", "connection")
        .attr("d", path)
        .style("stroke", d => colorScale(d.averageDelay)) // Keep the stroke color
        .style("fill", "none") // Remove the fill color
        .on('mouseover', showTooltip)
        .on('mouseout', hideTooltip);

    updateLegend(routeData); // Update the legend
}



//------------------------------------------------------------------------------------------------------------
//Zooming

// Enable zoom
const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .on('zoom', function (event) {
        svg.select('#container').attr('transform', event.transform);
    });

svg.call(zoom);

// Function to zoom in
function zoomIn() {
    zoom.scaleBy(svg.transition().duration(500), 1.3);
}

// Function to zoom out
function zoomOut() {
    zoom.scaleBy(svg.transition().duration(500), 0.7);
}

// Function to reset zoom
function resetZoom() {
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
}

// Add event listeners for buttons
d3.select('#zoom-in').on('click', zoomIn);
d3.select('#zoom-out').on('click', zoomOut);
d3.select('#reset-zoom').on('click', resetZoom);



//------------------------------------------------------------------------------------------------------------
//Tooltip definition

// Create a tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip_map")
    .style("opacity", 0);

// Function to show the tooltip
function showTooltip(event, d) {
    tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);

    tooltip.html(`
        <strong>Route:</strong> ${d.from} to ${d.to}<br/>
        <strong>Average Delay:</strong> ${d.averageDelay.toFixed(2)} minutes<br/>
        <strong>Average Flight Time:</strong> ${d.averageFlightTime}<br/> <!-- Added this line -->
        <strong>Number of Flights:</strong> ${d.count}
    `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
}

// Function to hide the tooltip
function hideTooltip() {
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}


//------------------------------------------------------------------------------------------------------------
//Formatting functions

// Function to format time in minutes to HH:MM format
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
}

// Function to format delay in minutes
function formatDelay(delay) {
    return delay >= 0 ? `+${delay}` : delay.toString();
}


// Function to convert time in HH:MM:SS format to minutes
function timeToMinutes(time) {
    if (typeof time !== 'string') {
        return NaN;
    }

    const [hours, minutes, seconds] = time.split(':').map(Number);
    const date = new Date(0, 0, 0, hours, minutes, seconds);
    return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}


//------------------------------------------------------------------------------------------------------------
//Definition of Legend


function updateLegend(data) {
  const legendContainer = d3.select("#legend-container-map");

  // Calculate the color scale dynamically based on the current data
  const getColorScale = function() {
    // Calculate the minimum and maximum delay values from the data
    const delayValues = data.map(d => d.averageDelay);
    const minDelay = d3.min(delayValues);
    const maxDelay = d3.max(delayValues);

    // Define the range of colors you want to use
    const colorRange = ["#0041C2", "#00ff00", "#8B0000"]; // Modify this array as needed

    // Create a linear scale mapping delay values to colors
    return d3.scaleLinear()
      .domain([minDelay, 0, maxDelay]) // Use minDelay and maxDelay as the domain
      .range(colorRange);
  };

  colorScale = getColorScale(); // Set colorScale globally

  // Create an SVG element for the updated legend
  const legend = legendContainer.select("svg");

  // Update color squares for the legend
  const colorScaleDomain = colorScale.domain();
  legend
    .selectAll(".legend-square")
    .data(colorScaleDomain)
    .attr("fill", d => colorScale(d));

  // Update labels for the legend
  const minDelay = Math.abs(colorScaleDomain[0]);
  const maxDelay = colorScaleDomain[2];
  const legendLabels = [`${minDelay.toFixed(2)} min earlier`, "On Time", `${maxDelay.toFixed(2)} min delayed`];
  legend
    .selectAll(".legend-label")
    .data(legendLabels)
    .text(d => d);
}


function createLegend() {
    const legendContainer = d3.select("#legend-container-map");

    // Create an SVG element for the legend
    const legend = legendContainer
        .append("svg")
        .attr("class", "legend")
        .attr("width", 250)
        .attr("height", 100);

    // Define the color scale's domain based on the actual domain
    const colorScaleDomain = colorScale.domain();

    // Create color squares for the legend using the color scale's domain
    legend
        .selectAll(".legend-square")
        .data(colorScaleDomain)
        .enter()
        .append("rect")
        .attr("class", "legend-square")
        .attr("x", 10)
        .attr("y", (d, i) => i * 20)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", d => colorScale(d));

    // Define the legend labels
    const legendLabels = colorScaleDomain.map(d => d.toFixed(2) + " min");

    // Add labels for the legend
    legend
        .selectAll(".legend-label")
        .data(legendLabels)
        .enter()
        .append("text")
        .attr("class", "legend-label")
        .attr("x", 40)
        .attr("y", (d, i) => i * 20 + 15)
        .text(d => d);
}

// Call the createLegend function to generate the legend
createLegend();

