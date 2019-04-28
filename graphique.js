function graph(){
getSightingCountByShape(null, null, function(result){
var tab = [];
var total = 0;
for (var i = 0; i < result.length; i += 1)
	total += result[i].y;
for (var i = 0; i < result.length; i += 1)
	if (100 / total * result[i].y > 3)
		tab.push(result[i]);
var chart = new CanvasJS.Chart("chartContainerPie", {
	animationEnabled: true,
	title: {
		text: "Diagramme des formes"
	},
	data: [{
		type: "pie",
		startAngle: 240,
		yValueFormatString: "##0\"\"",
		indexLabel: "{label} - #percent% ",
		legendText: "{label}",
		dataPoints: tab
	}]
});
chart.render();
});


getSightingCountByYear(null, null, function(result){

var user = [
{year: 1995, nb: 16},
{year: 1996, nb: 36},
{year: 1997, nb: 70},
{year: 1998, nb: 147},
{year: 1999, nb: 248},
{year: 2000, nb: 361},
{year: 2001, nb: 513},
{year: 2002, nb: 587},
{year: 2003, nb: 719},
{year: 2004, nb: 817},
{year: 2005, nb: 1018},
{year: 2006, nb: 1093},
{year: 2007, nb: 1319},
{year: 2008, nb: 1574},
{year: 2009, nb: 1802},
{year: 2010, nb: 1971},
{year: 2011, nb: 2267},
{year: 2012, nb: 2497},
{year: 2013, nb: 2802},
{year: 2014, nb: 3035}
];

var data = [];
var dataSeries = { type: "line"};
var dataPoints = [];
for (var i = 0; i < result.length; i += 1) {
	dataPoints.push({
		x: new Date(result[i].year, 0, 1),
		y: result[i].count
	});
}
dataSeries.dataPoints = dataPoints;
data.push(dataSeries);

var dataSeriesU = { type: "line", axisYType: "secondary" };
var dataPointsU = [];
for (var i = 0; i < user.length; i += 1) {
	dataPointsU.push({
		x: new Date(user[i].year, 0, 1),
		y: user[i].nb
	});
}
dataSeriesU.dataPoints = dataPointsU;
data.push(dataSeriesU);

var options = {
	zoomEnabled: true,
	animationEnabled: true,
	title: {
		text: "Nombre d'apparitions par an"
	},
	axisX:{
		valueFormatString: "YYYY"
	},
	axisY: {
		title: "Nombre d'apparations",
		includeZero: false,
		lineThickness: 1
	},
	axisY2: {
		title: "Nombre d'utilisateurs internet (million)"
	},
	data: data
};

var chart = new CanvasJS.Chart("chartContainerLine", options);
var startTime = new Date();
chart.render();

});


getSightingCountByMonth(null, null, function(result){
var tabMois = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
var data = [];
var dataSeries = { type: "column" };
var dataPoints = [];
for (var i = 0; i < result.length; i += 1) {
	dataPoints.push({
		x: result[i].mois,
		y: result[i].count,
		indexLabel: tabMois[i]
	});
}

dataSeries.dataPoints = dataPoints;
data.push(dataSeries);

var options = {
	zoomEnabled: true,
	animationEnabled: true,
	title: {
		text: "Apparitions par mois"
	},
	axisX:{
		valueFormatString: " "
	},
	axisY: {
		includeZero: false,
		lineThickness: 1
	},
	data: data
};

var chart = new CanvasJS.Chart("chartContainerColumn", options);
var startTime = new Date();
chart.render();
});
};