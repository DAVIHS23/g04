const margin = { top: 100, right: 30, bottom: 70, left: 60 },
  width = 400 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

const svg = d3.select("#barchart_year")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("Data/Flights.csv").then(data => {

  // Filter out rows with DELAY_IN_MIN less than or equal to 0
  data = data.filter(d => +d.DELAY_IN_MIN > 0);

  // Define the color scale using the same domain as in scatterplot.js
  const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d.SEASON))
    .range(['#66c2a5', '#a6d854', '#ffd92f', '#e5c494']);

  const orderedSeasons = ['WINTER', 'FRÜHLING', 'SOMMER', 'HERBST'];

  const aggregatedData = d3.rollup(
    data,
    v => d3.sum(v, d => +d.DELAY_IN_MIN),
    d => d.SEASON
  );

  const x = d3.scaleBand()
    .range([0, width])
    .domain(orderedSeasons)
    .padding(0.2);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  const y = d3.scaleLinear()
    .domain([0, d3.max(aggregatedData.values())])
    .range([height, 0]);

  svg.append("g")
    .call(d3.axisLeft(y));

  // Append X axis label
  svg.append("text")
    .attr("transform", `translate(${width / 2},${height + margin.bottom - 10})`) // Adjusted the translation
    .style("text-anchor", "middle")
    .text("Seasons");

  // Append Y axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Total Delay in Minutes");

  const bars = svg.selectAll("rect")
    .data(aggregatedData)
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d[1]))
    .attr("fill", d => colorScale(d[0])) // Use colorScale here for consistent colors
    .on("click", function (event, d) {
      const selectedSeason = d[0];
      document.dispatchEvent(new CustomEvent("seasonSelected", { detail: selectedSeason }));
    });
    
    
});
