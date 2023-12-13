var margin = { top: 100, right: 30, bottom: 70, left: 60 },
  width = 900 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#barplot_nilu")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
    "translate(" + margin.left + "," + margin.top + ")");

// Parse the Data
d3.csv("Merged_CSV.csv", function (data) {

  var colorScale = d3.scaleOrdinal()
    .domain(data.map(function (d) { return d.SEASON; }))
    .range(['red', 'green', 'blue', 'orange']); // Add more colors as needed    

  const seasons = [...new Set(data.map(d => d.SEASON))];
  d3.select('#filterDropdown')
    .selectAll('option')
    .data([...seasons])
    .enter()
    .append('option')
    .text(d => d)
    .attr('value', d => d);

  // X axis
  var x = d3.scaleBand()
    .range([0, width])
    .domain(data.map(function (d) { return d.SEASON; }))
    .padding(0.2);
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.DELAY_IN_MIN)])  // Adjusted the domain
  .range([height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // Initial rendering of bars
  var bars = svg.selectAll("mybar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", function (d) { return x(d.SEASON); })
    .attr("y", function (d) { return y(d.DELAY_IN_MIN); })
    .attr("width", x.bandwidth())
    .attr("height", function (d) { return height - y(d.DELAY_IN_MIN); })
    .attr("fill", function (d) { return colorScale(d.SEASON); });

  // Add event listener for filtering
  document.getElementById('filterDropdown').addEventListener('change', updateChart);

  function updateChart() {
    // Get the selected filter value
    const filterValue = document.getElementById('filterDropdown').value;

    // Filter the data based on the selected value
    const filteredData = filterValue === 'All' ? data : data.filter(d => d.SEASON === filterValue);

    // Update the X axis domain based on the filtered data
    x.domain(filteredData.map(d => d.SEASON));

    // Update the Y axis domain based on the maximum value within the filtered data
    y.domain([0, d3.max(filteredData, d => d.DELAY_IN_MIN)]);

    // Remove all existing bars
    bars.remove();

    // Append new bars based on the filtered data
    bars = svg.selectAll("rect")
      .data(filteredData)
      .enter()
      .append("rect")
      .attr("x", function (d) { return x(d.SEASON); })
      .attr("y", function (d) { return y(d.DELAY_IN_MIN); })
      .attr("width", x.bandwidth())
      .attr("height", function (d) { return height - y(d.DELAY_IN_MIN); })
      .attr("fill", function (d) { return colorScale(d.SEASON); });
  }
});