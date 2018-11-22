// used for reference: https://bl.ocks.org/Bl3f/cdb5ad854b376765fa99

url =
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

const CELSIUS = "\u{2103}";
const FAHRENHEIT = "\u{2109}";
let inCelsius = true;
var months = [
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
var tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

d3.json(url).then(function (data) {
    var baseTemp = data.baseTemperature;
    var plotData = data.monthlyVariance;

    var yearRange = d3.extent(plotData, d => d.year);

    // Set Description
    var desc = d3
        .select("#description")
        .append("text")
        .style("text-anchor", "middle")
        .style("font-size", "30px")
        .text(`${yearRange[0]} - ${yearRange[1]}: Base Temperature ${baseTemp} ${CELSIUS}
        `);

    // dimension of heatmap
    var margin = { top: 40, right: 20, bottom: 20, left: 100 };
    var cellWidth = 5;
    var cellHeight = 43;
    var width = cellWidth * (yearRange[1] - yearRange[0]);
    var height = 12 * cellHeight;

    var heatmap = d3
        .select(".heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var xScale = d3
        .scaleLinear()
        .domain([yearRange[0], yearRange[1]])
        .range([0, width]);

    // create the x axis on svg
    var xAxis = d3
        .axisBottom(xScale)
        // .tickValues(xTickValues)
        .tickFormat(d3.format("d"));

    heatmap
        .append("g")
        .attr("id", "x-axis")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // create the y axis scale
    var yScale = d3
        .scaleBand()
        .domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) //months
        .range([0, height]);

    // create the y axis on svg
    var yAxis = d3
        .axisLeft(yScale)
        .tickValues(yScale.domain())
        .tickFormat(function (d) {
            return months[d - 1];
        });

    heatmap
        .append("g")
        .attr("class", "y-axis")
        .attr("id", "y-axis")
        .call(yAxis)
        .selectAll("text")
        .attr("font-weight", "normal")
        .attr("fontSize", "2 em");
    ;

    var varianceRange = d3.extent(plotData, d => d.variance);
    var minTemp = baseTemp + varianceRange[0];
    var maxTemp = baseTemp + varianceRange[1];


    var colorScale = d3
        .scaleQuantize()
        .domain([minTemp, maxTemp])

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

    var numColors = colorScale.range().length;

    // // create the cells on the svg
    var cells = heatmap
        .selectAll("rect")
        .data(plotData)
        .enter()
        // .append("g")
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
            var yPos = (d.month) * cellHeight - cellHeight / 2 + margin.top;
            var temperature = d.variance + baseTemp;
            tooltip
                .transition()
                .duration(600)
                .style("opacity", 0.9);
            tooltip
                .html(
                    d.year +
                    " - " +
                    months[d.month] +
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

                // .style("left", d3.event.pageX + "px")
                // .style("top", d3.event.pageY - 28 + "px");
                .style("top", yPos + "px")
                .style("left", d3.event.pageX + "px");
        })
        .on("mouseout", function (d) {
            tooltip
                .transition()
                .duration(500)
                .style("opacity", 0);
        });

    // determine desired tickvalues
    var arr = [];
    var diff = (maxTemp - minTemp) / numColors;
    var next = minTemp;

    for (let index = 1; index < numColors; index++) {
        next = next + diff;
        arr.push(next);
    }

    const legendRectHeight = 60,
        legendRectWidth = 50,
        legendWidth = numColors * legendRectWidth;

    //   Create a Legend
    var legends = d3
        .select("#legend")
        .append("svg")
        .attr("width", legendWidth + margin.left)
        .attr("height", legendRectHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate( " + margin.left + "," + 40 + ")");

    // // create the scale for the x axis
    var lx = d3
        .scaleLinear()
        .domain([minTemp, maxTemp])
        .range([0, legendWidth]);

    // // create the x axis on legend
    var lxAxis = d3.axisBottom(lx).tickSize(13)
        .tickValues(arr).tickFormat(function (n) {
            return parseFloat(Math.round(n * 100) / 100).toFixed(1);
            //  return n + "%"
        });

    // var legendxAxis = d3.axisBottom(legendxScale).tickValues(arr);
    var legend = legends
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

    legends
        .append("g")
        .attr("transform", "translate(0," + legendRectHeight + ")")
        .call(lxAxis);
});
