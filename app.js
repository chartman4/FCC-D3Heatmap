// used for reference: https://bl.ocks.org/Bl3f/cdb5ad854b376765fa99

url =
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

const CELSIUS = "\u{2103}";

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

// Define the div for the tooltip
const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

// get data
d3.json(url).then(function (data) {
    //get base temperature from data
    const baseTemp = data.baseTemperature;
    // get array of monthly variances 
    const plotData = data.monthlyVariance;
    // determine the range of years the data is for
    const yearRange = d3.extent(plotData, d => d.year);

    // Set Description for webpage
    d3
        .select("#description")
        .append("text")
        .style("text-anchor", "middle")
        .style("font-size", "30px")
        .text(`${yearRange[0]} - ${yearRange[1]}: Base Temperature ${baseTemp} ${CELSIUS}
        `);

    // dimension of heatmap
    const margin = { top: 60, right: 20, bottom: 20, left: 200 };
    const cellWidth = 5;
    const cellHeight = 43;
    const width = cellWidth * (yearRange[1] - yearRange[0]);
    const height = 12 * cellHeight;

    // create heatmap
    const heatmap = d3
        .select(".heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // creat scale for X axis
    const xScale = d3
        .scaleLinear()
        .domain([yearRange[0], yearRange[1]])
        .range([0, width]);

    // set the scale and format of the X-axis
    const xAxis = d3
        .axisBottom(xScale)
        .tickSizeOuter(0)
        .ticks(20)
        .tickFormat(d3.format("d"));


    // create the X axis on heatmap
    heatmap
        .append("g")
        .attr("id", "x-axis")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // create the y axis scale
    const yScale = d3
        .scaleBand()
        .domain(Array.from(new Array(12), (val, index) => index + 1)) // months [1..12]
        .range([0, height]);

    // create the heatmap y axis
    const yAxis = d3
        .axisLeft(yScale)
        .tickValues(yScale.domain())
        .tickSizeOuter(0)
        .tickFormat(d => months[d - 1]);

    // append the y axis on heatmap specify class, id, and format the text
    heatmap
        .append("g")
        .attr("class", "y-axis")
        .attr("id", "y-axis")
        .call(yAxis);

    // get the variance range to use for color scale
    const varianceRange = d3.extent(plotData, d => d.variance);
    const minTemp = baseTemp + varianceRange[0];
    const maxTemp = baseTemp + varianceRange[1];

    // define the color scale for heatmap
    const colorScale = d3
        .scaleQuantize()
        .domain([minTemp, maxTemp])
        // colors to use
        .range([
            "rgb(49, 54, 149)",
            "rgb(69, 117, 180)",
            "rgb(116, 173, 209)",
            "rgb(171, 217, 233)",
            "rgb(224, 243, 248)",
            "rgb(255, 255, 191)",
            "rgb(254, 224, 144)",
            "rgb(253, 174, 97)",
            "rgb(244, 109, 67)",
            "rgb(215, 48, 39)",
            "rgb(165, 0, 38)"
        ]);

    // create the cells on the heatmap based on the data
    const cells = heatmap
        .selectAll("rect")
        .data(plotData)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("data-month", d => d.month - 1)
        .attr("data-year", d => d.year)
        .attr("data-temp", d => d.variance + baseTemp)
        .attr("x", (d) => xScale(d.year))
        .attr("y", (d) => yScale(d.month))
        .attr("width", cellWidth)
        .attr("height", cellHeight)
        .attr("fill", d => colorScale(d.variance + baseTemp))

        .on("mouseover", function (d) {
            const yPos = (d.month) * cellHeight - cellHeight / 2 + margin.top;
            const temperature = d.variance + baseTemp;
            tooltip
                .transition()
                .duration(600)
                .style("opacity", 0.9);
            tooltip
                .html(
                    d.year +
                    " - " +
                    months[d.month - 1] +
                    "<br/> Variance: " +
                    d3.format(".1f")(d.variance) +
                    CELSIUS +
                    "<br/> Temperature: " +
                    d3.format(".1f")(temperature) +
                    CELSIUS
                )
                .attr("data-month", d.month)
                .attr("data-year", d.year)
                .attr("data-temp", d3.format(".1f")(temperature))

                .style("top", yPos + "px")
                .style("left", d3.event.pageX + "px");
        })
        .on("mouseout", function (d) {
            tooltip
                .transition()
                .duration(500)
                .style("opacity", 0);
        });

    const numColors = colorScale.range().length;

    // set legend cell height, width and legend width
    const legendRectHeight = 60,
        legendRectWidth = 50,
        legendWidth = numColors * legendRectWidth;

    //   Create a Legend
    const legends = d3
        .select("#legend")
        .append("svg")
        .attr("width", legendWidth + margin.left)
        .attr("height", legendRectHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate( " + margin.left + "," + 40 + ")");

    // create the scale for the x axis of the legend
    const lx = d3
        .scaleLinear()
        .domain([minTemp, maxTemp])
        .range([0, legendWidth]);


    // determine desired tick values for legend
    const arr = Array.from(new Array(numColors - 1), (val, index) => minTemp + ((maxTemp - minTemp) / numColors) * (index + 1));

    // create the x axis on legend
    const lxAxis = d3.axisBottom(lx)
        .tickSize(13)
        .tickSizeOuter(0)
        .tickValues(arr).tickFormat(function (n) {
            return parseFloat(Math.round(n * 100) / 100).toFixed(1);
        });

    // add the cells to the legend colored using the color scale from the heatmap
    legends
        .selectAll(".legend")
        .data(colorScale.range())
        .enter()
        .append("g")
        .append("rect")
        .attr("class", "bar")
        .attr("width", legendRectWidth)
        .attr("height", legendRectHeight)
        .attr("x", (d, i) => i * legendRectWidth)
        .attr("fill", d => d);
    // add the axis of the legend
    legends
        .append("g")
        .attr("transform", "translate(0," + legendRectHeight + ")")
        .call(lxAxis);
});
