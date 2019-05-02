//Recherche par année
function SearchByYear(year, callback)
{
	var result = [];
	getAllSightings(function(elem)
	{
		if (elem.year == year)
			result.push(elem);
	}, function(){callback(result);});
}

//Recherche par ville
function SearchByCity(city, callback)
{
	var result = [];
	getAllSightings(function(elem)
	{
		if (elem.city.search)
			if (elem.city.search(city) != -1)
				result.push(elem);
	}, function(){callback(result);});
}


//Recherche dans commentaires
function SearchByComments(comments, callback)
{
	var result = [];
	getAllSightings(function(elem)
	{
		if (elem.comments.search)
			if (elem.comments.search(comments) != -1)
				result.push(elem);
	}, function(){callback(result);});
}

//Recherche par forme
function SearchByShape(shape, callback)
{
	var result = [];
	getAllSightings(function(elem)
	{
		if (elem.shape.search)
			if (elem.shape.search(shape) != -1)
				result.push(elem);
	}, function(){callback(result);});
}

function Recherche(elem, type, callback)
{
	if (type == "city")
		SearchByCity(elem, function(result){callback(result);});
	else if (type == "comments")
		SearchByComments(elem, function(result){callback(result);});
	else if (type == "year")
		SearchByYear(parseInt(elem), function(result){callback(result);});
	else
		SearchByShape(elem, function(result){callback(result);});

}

Recherche("1955", "year", function(result){
	console.log(result);
});
