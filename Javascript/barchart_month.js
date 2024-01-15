const margin = {
        top: 30,
        right: 30,
        bottom: 70,
        left: 60
    },
    width = 800 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

const svg = d3.select("#barchart_month")
    .append("svg")
    .style("visibility", "hidden")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

d3.select("#resetBarsButton").classed("hidden-button", true);

let originalData;

d3.csv("Data/Flights.csv").then(data => {
    originalData = data; // Store the original data

    // Filter out rows with DELAY_IN_MIN less than or equal to 0
    data = data.filter(d => +d.DELAY_IN_MIN > 0);

    const orderedMonths = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    const x = d3.scaleBand()
        .range([0, width])
        .domain(orderedMonths)
        .padding(0.2);

    // Use d3.rollup to calculate the sum for each unique month
    const aggregatedData = d3.rollup(
        data,
        v => d3.sum(v, d => +d.DELAY_IN_MIN),
        d => d.MONTH
    );

    const y = d3.scaleLinear()
        .domain([0, d3.max([...aggregatedData.values(), 0])]) // Use 0 as the minimum for the y-axis
        .range([height, 0]);

    // Define color scale
    const colorScale = d3.scaleOrdinal()
        .domain(orderedMonths)
        .range(['#66c2a5', '#66c2a5', '#e5c494', '#e5c494', '#e5c494', '#ffd92f', '#ffd92f', '#ffd92f', '#a6d854', '#a6d854', '#a6d854', '#66c2a5']);

    // Append X axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    // Append Y axis
    svg.append("g")
        .call(d3.axisLeft(y));

    // Initialize the chart with all months
    const bars = svg.selectAll("rect")
        .data([...aggregatedData])
        .enter()
        .append("rect")
        .attr("x", d => x(d[0]))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[1]))
        .attr("height", d => height - y(d[1]))
        .attr("fill", d => colorScale(d[0]))
        .append("title")
        .text(d => `Month: ${d[0]}\nTotal Delay: ${d[1]}`);

    // Event listener for the custom event
    document.addEventListener('seasonSelected', function (event) {
        const selectedSeason = event.detail;

        svg.style("visibility", "visible");
        
        d3.select("#resetBarsButton").classed("hidden-button", false);
        
        // Filter out rows with DELAY_IN_MIN less than or equal to 0
        const filteredMonths = data.filter(month => month.SEASON === selectedSeason);

        // Use d3.rollup to calculate the sum for each unique month
        const aggregatedFilteredData = d3.rollup(
            filteredMonths,
            v => d3.sum(v, d => +d.DELAY_IN_MIN),
            d => d.MONTH
        );

        // Update Y axis domain based on the aggregated data
        y.domain([0, d3.max([...aggregatedFilteredData.values(), 0])]); // Use 0 as the minimum for the y-axis

        // Update the bars
        svg.selectAll("rect")
            .data([...aggregatedFilteredData])
            .join("rect")
            .transition()
            .duration(500)
            .attr("x", d => x(d[0]))
            .attr("y", d => y(d[1]))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d[1]))
            .attr("fill", d => colorScale(d[0]))
            .select("title")
            .text(d => `Month: ${d[0]}\nTotal Delay: ${d[1]}`);

        // Update Y axis
        svg.select("g.axisLeft")
            .transition()
            .duration(500)
            .call(d3.axisLeft(y));
    });
    // Append X axis label
    svg.append("text")
        .attr("transform", `translate(${width / 2},${height + margin.top + 30})`)
        .style("text-anchor", "middle")
        .text("Months");

    // Append Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Total Delay in Minutes");
    // Add a button to reset bars
    d3.select("#resetBarsButton")
        .on("click", () => {
        svg.style("visibility", "hidden");
            // Update the bars to show all data
            svg.selectAll("rect")
                .data([...aggregatedData])
                .join("rect")
                .transition()
                .duration(500)
                .attr("x", d => x(d[0]))
                .attr("y", d => y(d[1]))
                .attr("width", x.bandwidth())
                .attr("height", d => height - y(d[1]))
                .attr("fill", d => colorScale(d[0]))
                .select("title")
                .text(d => `Month: ${d[0]}\nTotal Delay: ${d[1]}`);

        d3.select("#resetBarsButton").classed("hidden-button", true);
            // Reset Y axis
            y.domain([0, d3.max([...aggregatedData.values(), 0])]); // Use 0 as the minimum for the y-axis
            svg.select("g.axisLeft")
                .transition()
                .duration(500)
                .call(d3.axisLeft(y));
        });    
    
});
