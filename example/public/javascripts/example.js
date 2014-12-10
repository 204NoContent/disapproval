$(document).ready(function () {
  // fake data for a single dataset
  var data = {
    labels: [
       { x: 0,  label: 'Feb 2013' },
       { x: 1,  label: 'Mar 2013' },
       { x: 2,  label: 'Apr 2013' },
       { x: 3,  label: 'May 2013' },
       { x: 4,  label: 'Jun 2013' },
       { x: 5,  label: 'Jul 2013' },
       { x: 6,  label: 'Aug 2013' },
       { x: 7,  label: 'Sept 2013' },
       { x: 8,  label: 'Oct 2013' },
       { x: 9,  label: 'Nov 2013' },
       { x: 10, label: 'Dec 2013' },
       { x: 11, label: 'Jan 2014' },
       { x: 12, label: 'Feb 2014' },
       { x: 13, label: 'Mar 2014' },
       { x: 14, label: 'Apr 2014' },
       { x: 15, label: 'May 2014' },
       { x: 16, label: 'Jun 2014' },
       { x: 17, label: 'Jul 2014' }
    ],
    datasets: [{
      name: 'Single Dataset',
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
    }]
  }

  // set global options so that the all left axes are aligned
  O_o.setGlobalOptions({ leftAxesAreAligned: true })

  // make a default chart
  var chart  = new O_o.Chart(data, { container: '#chart-container' });

  // line chart of the same data
  var chart2 = new O_o.Chart(data, {
    container: '#chart-container-2',
    type: 'line',
    xAxisLowerBoundIsZero: true,
    yAxisLowerBoundIsZero: true
  });

  // fake data for multiple datasets
  var otherData = {
    labels: _.map(_.range(-1, 22), function (i) {
      return {
        x: i,
        label: 'x label that is very long: ' + i
      };
    }),
    datasets: _.map(_.range(1, 21), function (i) {
      return {
        name: 'Dataset with a long name and slope of ' + i,
        points: _.map(_.range(21), function (j) {
          return {
            x: j,
            y: i * j,
            tooltip: 'Line that has a ridiculously long tooltip and really should be shortened with slope of ' + i
          };
        })
      };
    })
  };

  var chart3 = new O_o.Chart(otherData, {
    container: '#chart-container-3'
  });

});
