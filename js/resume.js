$(function () {
  $('.scrollspy').scrollSpy();
  var ctx = document.createElement("canvas");
  ctx.setAttribute("width", "400");
  ctx.setAttribute("height", "200");
  $("#stats .modal\-body").html(ctx);

  var backgroundColor = [];
  var borderColor = [];
  for (var i=0; i<Object.keys(stats).length; i++){
    var color = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];
    backgroundColor.push("rgba("+color.join(", ")+", 0.2)");
    borderColor.push("rgba("+color.join(", ")+", 1)");
  }

  var data = [];
  for(var key in stats) {
    data.push(stats[key]);
  }

  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(stats),
      datasets: [{
        data: data,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth: 1
      }]
    },
    options: {
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero:true
          }
        }]
      }
    }
  });
});
