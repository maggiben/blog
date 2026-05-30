(function () {
  var paneLeft = 60;
  var punchcardEl = document.getElementById("punchcard");
  var paneRight = punchcardEl.clientWidth - paneLeft;
  var width = paneLeft + paneRight;
  var height = 520;
  var margin = 10;
  var max = 0;
  var tooltip;

  var data = [
    [1, 0, 0, 0, 1, 1, 4, 5, 5, 1, 1, 1, 1, 1, 1, 2, 5, 5, 4, 1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1, 1, 4, 5, 5, 1, 1, 1, 1, 1, 1, 2, 5, 5, 4, 1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1, 1, 4, 5, 5, 1, 1, 1, 1, 1, 1, 2, 5, 5, 4, 1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1, 1, 4, 5, 5, 1, 1, 1, 1, 1, 1, 2, 5, 5, 4, 1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1, 1, 4, 5, 5, 1, 1, 1, 1, 1, 1, 2, 5, 5, 4, 1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 0, 0],
  ];

  var x = d3.scale.linear().domain([0, 23]).range([paneLeft + margin, paneRight - 2 * margin]);
  var y = d3.scale.linear().domain([0, 6]).range([2 * margin, height - 10 * margin]);

  var punchcard = d3
    .select("#punchcard")
    .append("svg")
    .attr("width", width - 2 * margin)
    .attr("height", height - 2 * margin)
    .append("g");

  var dayNames = ["Sunday", "Saturday", "Friday", "Thursday", "Wednesday", "Tuesday", "Monday"];

  for (var i in y.ticks(7)) {
    punchcard
      .append("g")
      .selectAll("line")
      .data([0])
      .enter()
      .append("line")
      .attr("x1", margin)
      .attr("x2", width - 3 * margin)
      .attr("y1", height - 3 * margin - y(i))
      .attr("y2", height - 3 * margin - y(i))
      .style("stroke-width", 1)
      .style("stroke", "#977446");

    punchcard
      .append("g")
      .selectAll(".rule")
      .data([0])
      .enter()
      .append("text")
      .style("fill", "#E7D8C7")
      .attr("x", margin)
      .attr("y", height - 3 * margin - y(i) - 5)
      .attr("text-anchor", "start")
      .text(dayNames[i]);

    punchcard
      .append("g")
      .selectAll("line")
      .data(x.ticks(24))
      .enter()
      .append("line")
      .attr("x1", function (d) {
        return paneLeft - 2 * margin + x(d);
      })
      .attr("x2", function (d) {
        return paneLeft - 2 * margin + x(d);
      })
      .attr("y1", height - 4 * margin - y(i))
      .attr("y2", height - 3 * margin - y(i))
      .style("stroke-width", 1)
      .style("stroke", "#977446");
  }

  punchcard
    .selectAll(".rule")
    .data(x.ticks(24))
    .enter()
    .append("text")
    .attr("class", "rule")
    .style("fill", "#E7D8C7")
    .attr("x", function (d) {
      return paneLeft - 2 * margin + x(d);
    })
    .attr("y", height - 3 * margin)
    .attr("text-anchor", "middle")
    .text(function (d) {
      if (d === 0) return "12a";
      if (d > 0 && d < 12) return String(d);
      if (d === 12) return "12p";
      if (d > 12 && d < 25) return String(d - 12);
      return "";
    });

  data = data.reverse();

  for (var row = 0; row < data.length; row++) {
    max = Math.max(max, Math.max.apply(null, data[row]));
  }

  function mover(d) {
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "vis-tool-tip")
      .text(d);
  }

  function mout() {
    d3.selectAll(".vis-tool-tip").remove();
  }

  for (var yi = 0; yi < data.length; yi++) {
    for (var j = 0; j < data[yi].length; j++) {
      punchcard
        .append("g")
        .selectAll("circle")
        .data([data[yi][j]])
        .enter()
        .append("circle")
        .style("fill", "#E95B18")
        .on("mouseover", mover)
        .on("mouseout", mout)
        .on("mousemove", function () {
          if (!tooltip) return;
          tooltip
            .style("top", d3.event.pageY - 10 + "px")
            .style("left", d3.event.pageX + 10 + "px");
        })
        .attr("r", function (d) {
          return (d / max) * 14;
        })
        .attr("transform", function () {
          var tx = paneLeft - 2 * margin + x(j);
          var ty = height - 7 * margin - y(yi);
          return "translate(" + tx + ", " + ty + ")";
        });
    }
  }
})();
