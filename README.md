O_o Charts (Disapproval Charts)
===

Simple SVG charts for the browser.

O\_o Charts plots single and multiple datasets as a line or bar chart as appropriate.  O\_o Charts is an opinionated library and was created to alleviate some common frustrations.  Note that O\_o Charts does not support animation by design, so if you're looking for animated plots, it is best to look elsewhere.

What O\_o Charts provides is a great set of defaults out-of-the-box.  Single datasets are plotted as bar charts by default and multiple datasets are plotted as line charts.  O\_o Charts comes with built in 10 and 20 options color palettes and automatically chooses the appropriate one for your data.  O\_o Charts provides tooltips that function fluidly and never become cropped.  Multiple datasets have legends that highlights the corresponding data line on legend hover.  O\_o also has axes labels that never become cropped, automatically remove themselves instead of overlapping, and tilt as necessary to fit the space available.

These niceties aside, O\_o was crated to meet two key requirements:

1. Allow plotting of more than a handful of data points.  O\_o will render datasets with data counts in the low thousands in less than a second.
2. Align multiple charts on the same screen.  O\_o Charts allows you to specify that the left axes of multiple charts should be aligned, as well as the right most data points between charts.  Proper alignment of charts allows for easy comparison of data between the charts.

O\_o Charts is open source and pull request are welcome.  The guts of O\_o Charts was appropriated from Backbone.js and the O\_o library itself is more like a Backbone app that a traditional pluggin.  If you <3 Backbone you'll really enjoy hacking O\_o Charts' source code.  If you do decide to hack O\_o Charts' source, please ensure that code readability is your primary concern and performance a close runner up.

More ramblings about the creation and philosophy of O\_o Charts can be found [here](http://204NoContent.me)

Dependencies
===
[jQuery](http://jquery.com/)

[Underscore.js](http://underscorejs.org/)

Usage
===

O_o expects data in the following form:

Data Object
---

```javascript
var data = {
    labels: Array of Label Objects that span the data range,
    datasets: Array of Dataset Objects
}
```

Label Object
---

```javascript
{
    x: Number representing the x-coordinate of the label
    label: String to be used as text for the label
}
```

Dataset Object
---

```javascript
{
    name: String the references the dataset to be used as on identifier in the Legend if applicable,
    points: Array of Point Objects
}
```

Point Object
---

```javascript
{
    x: Number that represents the x-coordinate,
    y: Number that represents the y-coordinate,
    tooltip: String to display along with the y-value on mouse hover.  NOTE: the y-value of a point will automatically show up in the tooltip, no need to include it here.
}
```

For example, the data could look something like:

```javascript
var data = {
  labels: [
    { x: 0, label: 'Label 0' },
    { x: 1, label: 'Label 1' },
    { x: 2, label: 'Label 2' },
    .
    .
    .
  ],
  datasets: [
    {
      name: 'Dataset One',
      points: [
        { x: 1,  y: 320,  tooltip: 'Demo Day' },
        { x: 2,  y: 9213, tooltip: 'TechCrunch Bump' },
        { x: 3,  y: 3523, tooltip: 'Wearing off of Novelty' },
        { x: 4,  y: 346,  tooltip: 'Trough of Sorrow' },
        { x: 5,  y: 332,  tooltip: 'Trough of Sorrow' },
        { x: 6,  y: 358,  tooltip: 'Trough of Sorrow' },
        { x: 7,  y: 1045, tooltip: 'Wiggles of False Hope' },
        { x: 8,  y: 493,  tooltip: 'Wiggles of False Hope' },
        { x: 9,  y: 989,  tooltip: 'Wiggles of False Hope' },
        { x: 10, y: 542,  tooltip: 'Wiggles of False Hope' },
        { x: 11, y: 853,  tooltip: 'Wiggles of False Hope' },
        { x: 12, y: 465,  tooltip: 'Wiggles of False Hope' },
        { x: 13, y: 1023, tooltip: 'Product Market Fit' },
        { x: 14, y: 2132, tooltip: 'Growth' },
        { x: 15, y: 3612, tooltip: 'Growth' },
        { x: 16, y: 5493, tooltip: 'Growth' }
      ]
    }, {
      name: 'Dataset Two',
      points: [
        { x: 1,  y: 1.6,  tooltip: 'Launch' },
        { x: 2,  y: 2,0 },
        { x: 3,  y: 1.75 },
        { x: 4,  y: 2.6 },
        { x: 5,  y: 1.6, tooltip: '?' },
        { x: 6,  y: 0.75 },
        { x: 7,  y: 2.0 },
        { x: 8,  y: 2.8 },
        { x: 9,  y: 1.2 },
        { x: 10,  y: 0.25,  tooltip: 'Profit' }
      ]
    },
    .
    .
    .
  ]
}
```

, where the vertical ellipses represent more of the same objects.

Aside from having properly formatted data, a DOM element must exist for each chart that you wish to render.  The DOM element will be used as a container for the chart.  The DOM element mush have non-zero width since O\_o Charts will use this width to calculate its height.

For the sake of concreteness, let's say that you want to render a O\_o chart into a `div` with id `#chart-container`.  This can be done by creating a new O\_o Chart instance like this:

```javascript
var chart = new O_o.Chart(data, { container: '#chart-container' });
```

Options
===

Chart Instance Options
---

When plotting a single dataset, O\_o defaults to a bar chart.  If you would prefer to see your data displayed as a line chart you can specify it on chart instantiation like so:

```javascript
var chart = new O_o.Chart(data, { container: '#chart-container', type: 'line' });
```

All options follow this pattern where their keys and values comprise an object that is passed in as the second argument during chart instantiation (along with the `id` of the containing element).  Here is a list of all possible chart instance options with their appropriate defaults.  Note that the container `id` as described above is mandatory while any of the following options are, well, optional.

```javascript
    // Chart options
    // chart type for single datasets, possible values 'bar' or 'line'
    type: 'bar',

    // aspect ratio of the chart area excluding legends but including labels
    // aspectRatio is a number representing the width / height
    aspectRatio: 16 / 9,

    // These parameters represent added padding after the last data point
    // They are in units of steps, which is the distance between original
    // tick marks, given that no ticks have been removed to account for
    // overlapping labels
    stepsToExtendYAxis: 0.95,
    stepsToExtendXAxis: 0.95,

    // Show the grid line in the main chart area
    gridShowLines: true,
    // Width grid lines is px
    gridStrokeWidth: 1,
    // Color of grid lines
    gridStrokeColor: "rgba(0,0,0,0.06)",

    // Color of axes
    axesStrokeColor: "rgba(0,0,0,0.15)",
    // Width of axes in px
    axesStrokeWidth: 1,
    // CSS Font family of axes' labels
    axesFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    // Font size of axes' labels
    axesFontSize: 12,
    // Font color of axes' labels
    axesFontColor: "rgba(0,0,0,0.7)",
    // Always display x = 0 ?
    xAxisLowerBoundIsZero: false,
    // Always display y = 0 ?
    yAxisLowerBoundIsZero: false,

    // Line chart options
    // The radius of each point in px
    pointRadius: 3.8,
    // The border around each point, width in px
    pointStrokeWidth: 1.2,
    // The line width of each line in px
    lineStrokeWidth: 2,

    // Bar chart options
    // The border around each bar, width in px
    barStrokeWidth: 2,
    // The empty space between each bar, in unit of the horizontal distance
    // between the centers of adjacent bars
    barSpacing: 0.1,

    // Tooltip Options
    // Displacement of tooltip window from highlighted points in px
    tooltipOffset: 10,
    // CSS font family of tooltip text
    tooltipFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    // Color of tooltip text
    tooltipFontColor: "rgba(255,255,255,1)",
    // Font size of tooltip text in px
    tooltipFontSize: 15,
    // Font weight of tooltip text
    tooltipFontWeight: 'lighter',
    // Letter spacing of tooltip text
    tooltipLetterSpacing: 1.8,

    // Legend Options
    // Font family of legend text
    legendFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    // Color of legend text
    legendFontColor: "rgba(0,0,0,0.7)",
    // Font size of legend text in px
    legendFontSize: 15
```

Global O\_o Options for Multiple Charts
---

O\_o charts has the ability to align the left axes of all vertically grouped charts and has the option to align the right most points of those charts.  By default, the global alignment options are set to `false`, but can be turned on using the setter method `O_o.setGlobalOptions`, which is called directly on the O\_o object any time before the creation of the first chart.  The possible option keys are `leftAxesAreAligned` and `rightPointsAreAligned`.  Here is an example setting both options to `true`:

```javascript
O_o.setGlobalOptions({ leftAxesAreAligned: true, rightPointsAreAligned: true });
```

While the left axes can be aligned without also aligning the right most points, it is currently not possible for O\_o Charts to automatically align the right points without first aligning the left axes.  This means that in order to align the right most points between two line plots, both options must be set to true.

Gotchas
===

If you're going to use labels for the x-axis, the set of x-values of those labels must span the x-values of the dataset.  O\_o uses these x-values as indicators of where to draw tick marks and grid lines.  It's perfectly fine if there are labels with x-values that fall outside the range of data x-values, as long as the label x-values span the data x-values.  For example, if you only wanted a label in the middle of the dataset that says 'midpoint', and the x-value of that label corresponds to the number 7, for a dataset that ranged from 0.4 to 12.6, you would still have to specify all the appropriate label x-values, e.g.

```javascript
labels: [
    { x: 0 },
    { x: 1 },
    { x: 3 },
    { x: 4 },
    { x: 5 },
    { x: 6 },
    { x: 7, label: 'midpoint' },
    { x: 8 },
    { x: 9 },
    { x: 10 },
    { x: 11 },
    { x: 12 },
    { x: 13 }
  ]
```
