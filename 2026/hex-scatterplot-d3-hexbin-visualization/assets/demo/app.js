import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { hexbin as d3Hexbin } from "https://cdn.jsdelivr.net/npm/d3-hexbin@0.2.2/+esm";

const width = 920;
const height = 520;
const margin = { top: 24, right: 24, bottom: 36, left: 48 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const randomX = d3.randomNormal(innerWidth / 2, innerWidth / 6);
const randomY = d3.randomNormal(innerHeight / 2, innerHeight / 6);
const points = d3.range(3000).map(() => [randomX(), randomY()]);

const hexbin = d3Hexbin()
  .x((d) => d[0])
  .y((d) => d[1])
  .radius(20)
  .extent([
    [0, 0],
    [innerWidth, innerHeight],
  ]);

const bins = hexbin(points);
const color = d3
  .scaleLinear()
  .domain([0, 20])
  .range(["#0000ff", "#E74C3C"])
  .interpolate(d3.interpolateLab);

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

g.append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", innerWidth)
  .attr("height", innerHeight);

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const x = d3.scaleBand().domain(d3.range(24).map(String)).range([0, innerWidth]).padding(0.05);
const y = d3.scaleBand().domain(days).range([innerHeight, 0]).padding(0.05);

g.append("g")
  .attr("class", "axis")
  .attr("transform", `translate(0,${innerHeight})`)
  .call(
    d3
      .axisBottom(x)
      .tickValues(x.domain().filter((_, i) => i % 3 === 0))
      .tickFormat((d) => {
        const h = +d;
        if (h === 0) return "12a";
        if (h < 12) return String(h);
        if (h === 12) return "12p";
        return String(h - 12);
      })
  );

g.append("g")
  .attr("class", "axis")
  .call(d3.axisLeft(y));

g.append("g")
  .attr("clip-path", "url(#clip)")
  .selectAll("path")
  .data(bins)
  .enter()
  .append("path")
  .attr("class", "hex-cell")
  .attr("transform", (d) => `translate(${d.x},${d.y})`)
  .attr("d", hexbin.hexagon())
  .attr("fill", (d) => color(d.length));
