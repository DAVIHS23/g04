// Define dimensions and margins for the graph
const margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 50
    },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Append the svg object to the div with id 'chart'
const svg = d3.select("#linechart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Parse the date / time
const parseDate = d3.timeParse("%d.%m.%Y");
const parseYear = d3.timeParse("%Y");

// Set the ranges
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

// Define the line
const valueline = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.totalDelay));

let summaryData; // Declare summaryData here

// Read and process the data
d3.csv("Data/Flights.csv").then(function (data) {
    // Filter for positive delays and summarize per year
    let filteredData = data.filter(d => +d.DELAY_IN_MIN > 0);
    summaryData = d3.rollups(filteredData, v => d3.sum(v, d => +d.DELAY_IN_MIN), d => parseDate(d.DATE).getFullYear())
        .map(d => ({
            year: new Date(d[0], 0, 1), // Create a Date object for the year
            totalDelay: d[1]
        }));

    console.log("Summary Data:", summaryData); // Debugging

    // Scale the range of the data
    x.domain(d3.extent(summaryData, d => d.year));
    y.domain([0, d3.max(summaryData, d => d.totalDelay)]);

    // Add the valueline path
    svg.append("path")
    .data([summaryData])
    .attr("class", "line")
    .attr("d", valueline)
    .attr("fill", "none")       // Ensure the path is not filled
    .attr("stroke", "steelblue") // Set the color of the line
    .attr("stroke-width", "2");  // Set the width of the line

// Determine the minimum and maximum dates in your dataset
const minDate = d3.min(filteredData, d => parseDate(d.DATE));
const maxDate = d3.max(filteredData, d => parseDate(d.DATE));

// Set the X-axis domain to cover the full date range
x.domain([minDate, maxDate]);

// Create the X-axis with the updated domain
svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));
    
    
    
    
    
    
    
    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
});
// Brushing functionality will be added here


const brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("end", brushed);




// Create a separate group for the brush
const brushGroup = svg.append("g")
    .attr("class", "brush")
    .call(brush);


// Define a function to handle brushing
function brushed(event) {
    if (!event.selection) return; // Ignore empty selections

    const [x0, x1] = event.selection.map(x.invert);
    console.log("Brush Selection Start Date:", x0);
    console.log("Brush Selection End Date:", x1);

    // Filter the data based on the brush extent
    let filteredData = summaryData.filter(d => {
        return d.year >= x0 && d.year <= x1;
    });

    // Update the x and y domains
    x.domain(d3.extent(filteredData, d => d.year));
    y.domain([0, d3.max(filteredData, d => d.totalDelay)]);

    // Update the valueline with a transition
svg.select(".line")
    .datum(filteredData)
    .transition()
    .duration(500)
    .attr("d", valueline);


    // Update the X Axis
    svg.select(".x-axis")
        .call(d3.axisBottom(x));
}
