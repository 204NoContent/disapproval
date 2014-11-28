$(document).ready(function () {
  // fake data for a single dataset
  var data = {
    labels: [
       { x: 0,  label: 'Feb 2013'  },
       { x: 1,  label: 'Mar 2013'  },
       { x: 2,  label: 'Apr 2013'  },
       { x: 3,  label: 'May 2013'  },
       { x: 4,  label: 'Jun 2013'  },
       { x: 5,  label: 'Jul 2013'  },
       { x: 6,  label: 'Aug 2013'  },
       { x: 7,  label: 'Sept 2013' },
       { x: 8,  label: 'Oct 2013'  },
       { x: 9,  label: 'Nov 2013'  },
       { x: 10, label: 'Dec 2013'  },
       { x: 11, label: 'Jan 2014'  },
       { x: 12, label: 'Feb 2014'  },
       { x: 13, label: 'Mar 2014'  },
       { x: 14, label: 'Apr 2014'  },
       { x: 15, label: 'May 2014'  },
       { x: 16, label: 'Jun 2014'  },
       { x: 17, label: 'Jul 2014'  }
    ],
    datasets: [{
      name: 'Single Dataset',
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      y: [320, 9213, 3523, 346, 332, 358, 1045, 493, 989, 542, 853, 465, 1023, 2132, 3612, 5493],
      tooltip: ['Demo Day', 'TechCrunch Bump', 'Wearing off of Novelty', 'Trough of Sorrow', 'Trough of Sorrow', 'Trough of Sorrow', 'Wiggles of False Hope', 'Wiggles of False Hope', 'Wiggles of False Hope', 'Wiggles of False Hope', 'Wiggles of False Hope', 'Wiggles of False Hope', 'Product Market Fit', 'Growth', 'Growth', 'Growth']
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
        x: _.range(1, 21),
        y: _.range(1, 20 * (i + 1), i),
        tooltip: _.map(_.range(1, 20 * (i + 1), i), function () {
          return 'Line that has a ridiculously long tooltip and really should be shortened with slope of ' + i;
        })
      };
    })
  };

  var chart3 = new O_o.Chart(otherData, {
    container: '#chart-container-3'
  });

});
