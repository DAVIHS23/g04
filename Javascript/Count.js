const margin = {
    top: 30,
    right: 30,
    bottom: 70,
    left: 60
};

const width = 400 - margin.left - margin.right;
const height = 200 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#kpi_nilu1")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

svg.append("rect")
    .attr("id", "circleBasicTooltip")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#f2f2f2");

// Assuming you have an HTML element with the id "tooltip"
const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden");

// Parse the Data
d3.csv("Merged_CSV.csv").then(data => {

    const maxValue = "AVG Delay" + d3.mean(data, d => +d.DELAY_IN_MIN);

    // X axis
    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.DATE)) // Assuming DATE is your x-axis property
        .padding(0.2);

    // Y axis
    const y = d3.scaleLinear()
        .range([height, 0])
        .domain([0, d3.max(data, d => +d.DELAY_IN_MIN)]);

    // Bars
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(maxValue);

    // Single circle
    const circle = svg.append("circle")
        .attr("r", 5)
        .attr("fill", "steelblue");

    // Add x-axis to tooltip
    tooltip.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Add y-axis to tooltip
    tooltip.append("g")
        .call(d3.axisLeft(y));

    circle.on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    function handleMouseOver(event, d) {
        // Update tooltip content and position
        tooltip.html(`<svg width='${width}' height='${height}'>
            <g transform='translate(0,${height})'><g class='x-axis'></g></g>
            <g class='y-axis'></g>
            <path class='line' d='${generateLine(data)}'></path></svg>`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 10}px`)
            .style("visibility", "visible");

        // Render x-axis in the tooltip
        tooltip.select(".x-axis").call(d3.axisBottom(x));

        // Render y-axis in the tooltip
        tooltip.select(".y-axis").call(d3.axisLeft(y));
    }

    function handleMouseOut() {
        // Hide the tooltip on mouseout
        tooltip.style("visibility", "hidden");
    }

    function generateLine(data) {
        const line = d3.line()
            .x(d => x(d.DATE)) // Assuming DATE is your x-axis property
            .y(d => y(+d.DELAY_IN_MIN)); // Assuming DELAY_IN_MIN is your y-axis property

        return line(data);
    }
});
