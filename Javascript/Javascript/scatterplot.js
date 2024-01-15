// Custom parsing function to convert "HH:mm" time to minutes
function parseTimeToMinutes(timeString) {
    var match = timeString.match(/(\d+):(\d+)/);
    if (match) {
        var hours = parseInt(match[1], 10);
        var minutes = parseInt(match[2], 10);
        return hours * 60 + minutes;
    } else {
        return NaN; // Handle invalid time format gracefully
    }
}

d3.csv("Data/Flights.csv").then(function (data) {
    // Filter data for DELAY_IN_MIN > 0
    data = data.filter(function (d) {
        return +d.DELAY_IN_MIN > 0;
    });

    // Set the dimensions and margins of the graph
    var margin = {
        top: 10,
        right: 300,
        bottom: 40,
        left: 60
    };
    var width = 1100 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    var svg = d3.select("#scatterplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a clipping path
    var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    // Add X axis
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) {
            return +d.DELAY_IN_MIN;
        })])
        .nice()
        .range([0, width]);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) {
            return +parseTimeToMinutes(d.FLIGHT_TIME);
        })])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(10)); // Adjust the number of ticks as needed

    // Add a scale for bubble color
    var myColor = d3.scaleOrdinal()
        .domain(data.map(d => d.SEASON))
        .range(['#66c2a5', '#a6d854', '#ffd92f', '#e5c494']);

    // Add dots
    var dots = svg.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return x(+d.DELAY_IN_MIN);
        })
        .attr("cy", function (d) {
            return y(parseTimeToMinutes(d.FLIGHT_TIME));
        })
        .attr("r", 5)
        .style("fill", function (d) {
            return myColor(d.SEASON);
        })
        .attr("clip-path", "url(#clip)"); // Apply clipping

    // Create a brush behavior for zooming
    var brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("end", brushed);

    // Append the brush to the SVG
    var brushGroup = svg.append("g")
        .attr("class", "brush")
        .call(brush);

    // Function to update the scatterplot based on selected filters
    function updateScatterplot() {
        var selectedSeason = d3.select("#seasonSelector").node().value;
        var selectedAircraftTypes = Array.from(d3.select("#aircraftTypeSelector").selectAll("option:checked"), option => option.value);

        // Filter the data based on selected filters
        var filteredData = data.filter(function (d) {
            return (selectedSeason === "All" || d.SEASON === selectedSeason) &&
                (selectedAircraftTypes.includes("All") || selectedAircraftTypes.includes(d.AIRCRAFT_TYPE));
        });

        // Update the x and y domains based on filtered data
        var xMax = d3.max(filteredData, function (d) {
            return +d.DELAY_IN_MIN;
        });
        var yMax = d3.max(filteredData, function (d) {
            return +parseTimeToMinutes(d.FLIGHT_TIME);
        });

        x.domain([0, xMax]).nice();
        y.domain([0, yMax]).nice();

        // Update the x-axis and y-axis
        svg.select(".x-axis")
            .transition()
            .duration(500)
            .call(d3.axisBottom(x));

        svg.select(".y-axis")
            .transition()
            .duration(500)
            .call(d3.axisLeft(y));

        // Update the dots on the scatterplot based on filtered data
        dots.data(data)
            .style("display", function (d) {
                return (filteredData.includes(d)) ? "block" : "none";
            })
            .transition()
            .duration(500)
            .attr("cx", function (d) {
                return x(+d.DELAY_IN_MIN);
            })
            .attr("cy", function (d) {
                return y(parseTimeToMinutes(d.FLIGHT_TIME));
            });
    }

    // Add event listeners to the selectors to trigger the scatterplot update
    d3.select("#seasonSelector").on("change", updateScatterplot);
    d3.select("#aircraftTypeSelector").on("change", updateScatterplot);

    // Define the brushed function for zooming
    function brushed(event) {
        var selection = event.selection; // Get the brushed selection

        if (selection) {
            // Calculate new X and Y domains based on the brushed selection
            var xDomain = [x.invert(selection[0][0]), x.invert(selection[1][0])];
            var yDomain = [y.invert(selection[1][1]), y.invert(selection[0][1])];

            // Update X and Y scales
            x.domain(xDomain).nice();
            y.domain(yDomain).nice();

            // Update the circles based on the new domains
            dots.attr("cx", function (d) {
                return x(+d.DELAY_IN_MIN);
            }).attr("cy", function (d) {
                return y(parseTimeToMinutes(d.FLIGHT_TIME));
            });

            // Redraw X and Y axes
            svg.select(".x-axis").call(d3.axisBottom(x));
            svg.select(".y-axis").call(d3.axisLeft(y));

            // Clear the brush selection
            brushGroup.call(brush.move, null);
        }
    }

    // Add a double-click event handler to reset the zoom
    svg.on("dblclick", function () {
        // Reset the X and Y domains
        var newXDomain = [0, d3.max(data, function (d) {
            return +d.DELAY_IN_MIN;
        })];
        var newYDomain = [0, d3.max(data, function (d) {
            return +parseTimeToMinutes(d.FLIGHT_TIME);
        })];

        // Create transitions for the X and Y domains
        var xTransition = d3.transition().duration(500);
        var yTransition = d3.transition().duration(500);

        // Update the X and Y domains with transitions
        x.domain(newXDomain).nice();
        y.domain(newYDomain).nice();

        // Redraw the circles based on the new domains with transitions
        dots.transition().duration(500)
            .attr("cx", function (d) {
                return x(+d.DELAY_IN_MIN);
            })
            .attr("cy", function (d) {
                return y(parseTimeToMinutes(d.FLIGHT_TIME));
            });

        // Redraw X and Y axes with transitions
        svg.select(".x-axis").transition(xTransition).call(d3.axisBottom(x));
        svg.select(".y-axis").transition(yTransition).call(d3.axisLeft(y));

        // Clear the brush selection
        brushGroup.call(brush.move, null);
    });

    // Add X axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.top + 20)
        .text("Delay in Minutes");

    // Add Y axis label
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -margin.top)
        .text("Flight Time in Minutes");


    // Create a color legend container inside the scatterplot SVG
    var legendContainer = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(" + (width + 30) + ",50)"); // Adjust the position within the scatterplot

    // Create legend items
    var legendItems = legendContainer.selectAll(".legend-item")
        .data(["WINTER", "FRÜHLING", "SOMMER", "HERBST"]) // Use the same domain as in your color scale
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", function (d, i) {
            return "translate(0," + (i * 25) + ")"; // Adjust the vertical spacing between legend items
        });

    // Add colored rectangles as legend symbols
    legendItems.append("rect")
        .attr("width", 15) // Set the width of the color box
        .attr("height", 15) // Set the height of the color box
        .style("fill", function (d) {
            return myColor(d); // Use your color scale to get the fill color
        });

    // Add legend text
    legendItems.append("text")
        .attr("x", 20) // Adjust the horizontal position of the text
        .attr("y", 10) // Adjust the vertical position of the text
        .text(function (d) {
            return d; // Display the season name as text
        });

});
