const margin = {
    top: 30,
    right: 30,
    bottom: 70,
    left: 60
};

const width = 200 - margin.left - margin.right;
const height = 200 - margin.top - margin.bottom;

// Append the SVG object to the body of the page
const svg = d3.select("#kpi_nilu")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#f2f2f2");

// Parse the Data
d3.csv("Merged_CSV.csv").then(data => {

    const maxDelayFlight = d3.max(data, d => +d.DELAY_IN_MIN);
    const maxDelayEntry = data.find(d => +d.DELAY_IN_MIN === maxDelayFlight);

    const tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden");

    const maxValue = "MAX Delay in Min: " + maxDelayFlight;

    // X axis
    const x = d3.scaleBand()
        .range([0, width])
        .domain(["DELAY_IN_MIN"]) // Only one value in the domain
        .padding(0.2);

    // Bars
    svg.append("text")
        .attr("x", x("DELAY_IN_MIN") + x.bandwidth() / 2)
        .attr("y", height - 10) // Adjust this value to position the text
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(maxValue);

    const circles = svg.selectAll(".circle-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "circle-group")
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    circles.append("circle")
        .attr("cx", x("DELAY_IN_MIN") + x.bandwidth() / 2) // Adjust the x position as needed
        .attr("cy", height / 2) // Adjust the y position as needed
        .attr("r", 5)
        .attr("fill", "steelblue")
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    function handleMouseOver(event, d) {
        // Update tooltip content and position
        tooltip.html("Flight with the highest delay: " + maxDelayEntry.FLIGHT + ", Delay: " + maxDelayFlight + " minutes")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px")
            .style("visibility", "visible");
    }

    function handleMouseOut() {
        // Hide the tooltip on mouseout
        tooltip.style("visibility", "hidden");
    }
});
