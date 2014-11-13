$(document).ready(function () {
  // fake some data
  // var data = {
    // labels: _.map(_.range(0, 11), function (i) {
    //   return {
    //     x: i,
    //     label: 'x label: ' + i
    //   };
    // }),
  //   datasets: _.map(_.range(1, 11), function (i) {
  //     if (i == 0) {
  //       return {
  //         name: 'Dataset ' + i,
  //         x: _.range(0, 10 + 1),
  //         y: _.map(_.range(0, 10 + 1), function () { return 0; }),
  //         meta: _.map(_.range(0, 10 + 1), function () {
  //           return 'Line ' + i;
  //         })
  //       };
  //     } else {
  //       return {
  //         name: 'Dataset ' + i,
  //         x: _.range(0, 10 + 1),
  //         y: _.range(0, 10 * (i + 1) + 10, i),
  //         meta: _.map(_.range(0, 10 * (i + 1) + 10, i), function () {
  //           return 'Line ' + i;
  //         })
  //       };
  //     }
  //   })
  // };

  // var random_dataset = {
  //   labels: _.map(_.range(-30, 30 + 1), function (i) {
  //     return {
  //       x: i,
  //       label: 'x label: ' + i
  //     };
  //   }),
  //   datasets: [{
  //     name: 'Dataset 1',
  //     x: _.map(_.range(1, 10 + 1), function (i) { return -5 + i + Math.random(); }),
  //     y: _.map(_.range(0, 9 + 1), function () { return 3 * Math.random() - 1.5; }),
  //     meta: []
  //   }, {
  //     name: 'Dataset 2',
  //     x: _.map(_.range(1, 10 + 1), function (i) { return i + Math.random(); }),
  //     y: _.map(_.range(0, 9 + 1), function () { return 3 * Math.random(); }),
  //     meta: []
  //   }, {
  //     name: 'Dataset 3',
  //     x: _.map(_.range(1, 10 + 1), function (i) { return -2 + i + Math.random(); }),
  //     y: _.map(_.range(0, 9 + 1), function () { return 3 * Math.random(); }),
  //     meta: []
  //   }]
  // }

  var single_dataset_data = {
    labels: _.map(_.range(0, 12 + 1), function (i) {
      return {
        x: i,
        label: 'x label: ' + i
      };
    }),
    datasets: [{
      name: 'Single Dataset',
      x: _.range(1, 10 + 1),
      y: _.map(_.range(0, 9 + 1), function () { return 3 * Math.random(); }),
      meta: []
    }]
  }

  $('<div>', { id: 'chart-container' }).css('margin-bottom', 40).appendTo('body');
  // make a new chart
  var chart = new O_o.Chart(single_dataset_data, { container: '#chart-container' });

  var data2 = {
    labels: _.map(_.range(-1, 32), function (i) {
      return {
        x: i,
        label: 'x label that is very long: ' + i
      };
    }),
    datasets: _.map(_.range(1, 31), function (i) {
      if (i == 0) {
        return {
          name: 'Dataset that has a very long name: ' + i,
          x: _.range(0, 30 + 1),
          y: _.map(_.range(0, 30 + 1), function () { return 0; }),
          meta: _.map(_.range(0, 30 + 1), function () {
            return 'Line that has a ridiculously long name and really should be shortened don\'t you think ' + i;
          })
        };
      } else {
        return {
          name: 'Dataset that has a very long name: ' + i,
          x: _.range(0, 30 + 1),
          y: _.range(0, 30 * (i + 1) + 30, i),
          meta: _.map(_.range(0, 30 * (i + 1) + 30, i), function () {
            return 'Line that has a ridiculously long name and really should be shortened don\'t you think ' + i;
          })
        };
      }
    })
  };

  $('<div>', { id: 'chart-container-2' }).css('margin-bottom', 40).appendTo('body');
  var chart2 = new O_o.Chart(data2, { container: '#chart-container-2' });
});
