$(document).ready(function () {
  // fake some data
  var data = xxx = {
    datasets: _.map(_.range(1, 11), function (i) {
      return {
        name: 'Slope ' + i,
        x: _.range(1, 30 + 1),
        y: _.range(i, i * 30 + 1, i),
        meta: _.map(_.range(i, i * 30 + 1, i), function (i) {
          return 'My value is: ' + i;
        })
      };
    })
  };

  // make a new chart
  var chart = yyy = new Disapproval.Chart(data);
});
