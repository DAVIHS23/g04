const margin = { top: 30, right: 30, bottom: 70, left: 60 },
  width = 900 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
const svg = d3.select("#barplot_month")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Parse the Data
d3.csv("Merged_CSV.csv").then(data => {

  const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d.MONTH))
    .range(['red', 'green', 'green', 'green', 'blue', 'blue', 'blue', 'orange', 'orange', 'red', 'orange', 'red']); // Add more colors as needed    

  const monthOrder = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  // Manually sort the data based on the custom order
  data.sort((a, b) => monthOrder.indexOf(a.MONTH) - monthOrder.indexOf(b.MONTH));

  // X axis
  const x = d3.scaleBand()
    .range([0, width])
    .domain(data.map(d => d.MONTH))
    .padding(0.2);
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([0, width])
    .range([height, 0]);
  svg.append("g")
    .call(d3.axisLeft(y));

  // Bars
  const bars = svg.selectAll("mybar")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", d => x(d.MONTH))
    .attr("y", d => y(+d.DELAY_IN_MIN))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(+d.DELAY_IN_MIN))
    .attr("fill", d => colorScale(d.MONTH))
    .append("title")  // Append a title element to create a tooltip
    .text(d => `Month: ${d.Month}\nDelay: ${d.DELAY_IN_MIN}`);

  document.getElementById('filterDropdown').addEventListener('change', updateChart);

  function updateChart() {
    // Get the selected filter value
    const filterValue = document.getElementById('filterDropdown').value;

    // Filter the data based on the selected value
    const filteredData = filterValue === 'All' ? data : data.filter(d => d.MONTH === filterValue);

    // Update the X axis domain based on the filtered data
    x.domain(filteredData.map(d => d.DATE));

    // Update the Y axis domain based on the maximum value within the filtered data
    y.domain([0, d3.max(filteredData, d => d.DELAY_IN_MIN)]);

    // Remove all existing bars
    svg.selectAll("rect").remove();

    // Append new bars based on the filtered data
    svg.selectAll("rect")
      .data(filteredData)
      .enter()
      .append("rect")
      .attr("x", d => x(d.MONTH))
      .attr("y", d => y(+d.DELAY_IN_MIN))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(+d.DELAY_IN_MIN))
      .attr("fill", d => colorScale(d.MONTH));
  }
});
