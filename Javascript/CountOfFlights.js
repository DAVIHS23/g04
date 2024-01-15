const margin = {
    top: 30,
    right: 30,
    bottom: 70,
    left: 60
};

const width = 200 - margin.left - margin.right;
const height = 200 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#kpi_nilu3")
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

    const totalCount = "Nr of Flights: " + data.length;

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
        .text(totalCount);
});
