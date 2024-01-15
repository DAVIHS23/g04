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
        .on('mouseout', hideTooltip)
        .on('click', function (event, d) {
            const selectedRoute = d.from + "-" + d.to;
            // Filter the scatterplot data based on the selected route
            const filteredScatterplotData = scatterplotData.filter(function (scatterData) {
                return scatterData.FROM === d.from && scatterData.TO === d.to;
            });
            // Update the scatterplot with the filtered data
            updateScatterplot(filteredScatterplotData);
        });

    updateLegend(routeData); // Update the legend
}

//------------------------------------------------------------------------------------------------------------
// Scatterplot Code
// ... (Include your scatterplot code here)



