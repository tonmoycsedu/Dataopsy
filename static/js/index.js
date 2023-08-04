/* on document ready, initialize */
var VIZ, DATA;
$(document).ready(function () {
  
  // populate_dropdowns()
  VIZ = new Viz("#viz_parent", data, index, value_column);
  $('.ui.accordion')
    .accordion();

  // DATA.pivot()
  // VIZ.visualize(DATA.pivot(VIZ.selected_attrs.map(d => d['attr'])), VIZ.selected_attrs)
})

$(".delete.icon").on("click", function(){
  
})

$("#nBin").on("change", function(){
  $("#histogram").empty()
  $("#histogram").append(VIZ.Histogram(DATA.data, {
      value: d => d[DATA.value_column],
      yLabel: "↑ "+ DATA.value_column,
      label: "Bin",
      width: $("#histogram").width(),
      height: 150,
      color: "steelblue",
      thresholds: $("#nBin").val()
  }))
  install_events(VIZ)
})