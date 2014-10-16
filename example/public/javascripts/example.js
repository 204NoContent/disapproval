$(document).ready(function () {
  // fake some data
  var data = {
    labels: _.map(_.range(0, 31), function (i) {
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
          meta: _.map(_.range(0, 30 + 1), function () {
            return 'My value is: ' + 0;
          })
        };
      } else {
        return {
          name: 'Slope ' + i,
          x: _.range(0, 30 + 1),
          y: _.range(0, 30 * (i + 1) + 30, i),
          meta: _.map(_.range(0, 30 * (i + 1) + 30, i), function (i) {
            return 'My value is: ' + i;
          })
        };
      }
    })
  };

  $('<div>', { id: 'chart-container' }).appendTo('body');
  // make a new chart
  var chart = new Disapproval.Chart(data, { container: '#chart-container' });

  // $('<div>', { id: 'chart-container-2' }).appendTo('body');
  // var chart2 = new Disapproval.Chart(data, { container: '#chart-container-2' });
});
