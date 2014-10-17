$(document).ready(function () {
  // fake some data
  var data1 = {
    labels: _.map(_.range(0, 11), function (i) {
      return {
        x: i, 
        label: 'i have x label: ' + i
      };
    }),
    datasets: _.map(_.range(1, 11), function (i) {
      if (i == 0) {
        return {
          name: 'Slope ' + i,
          x: _.range(0, 30 + 1),
          y: _.map(_.range(0, 30 + 1), function () { return 0; }),
          meta: _.map(_.range(0, 10 + 1), function () {
            return 'Line ' + i;
          })
        };
      } else {
        return {
          name: 'Slope ' + i,
          x: _.range(0, 10 + 1),
          y: _.range(0, 10 * (i + 1) + 10, i),
          meta: _.map(_.range(0, 10 * (i + 1) + 10, i), function () {
            return 'Line ' + i;
          })
        };
      }
    })
  };

  $('<div>', { id: 'chart-container' }).appendTo('body');
  // make a new chart
  var chart = new Disapproval.Chart(data1, { container: '#chart-container' });

  var data2 = {
    labels: _.map(_.range(0, 31), function (i) {
      return {
        x: i, 
        label: 'i have x label: ' + i
      };
    }),
    datasets: _.map(_.range(1, 31), function (i) {
      if (i == 0) {
        return {
          name: 'Slope ' + i,
          x: _.range(0, 30 + 1),
          y: _.map(_.range(0, 30 + 1), function () { return 0; }),
          meta: _.map(_.range(0, 30 + 1), function () {
            return 'Line that has a ridiculously long name and really should be shortened don\'t you think ' + i;
          })
        };
      } else {
        return {
          name: 'Slope ' + i,
          x: _.range(0, 30 + 1),
          y: _.range(0, 30 * (i + 1) + 30, i),
          meta: _.map(_.range(0, 30 * (i + 1) + 30, i), function () {
            return 'Line that has a ridiculously long name and really should be shortened don\'t you think ' + i;
          })
        };
      }
    })
  };

  $('<div>', { id: 'chart-container-2' }).appendTo('body');
  var chart2 = new Disapproval.Chart(data2, { container: '#chart-container-2' });
});
