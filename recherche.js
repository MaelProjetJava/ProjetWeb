//Recherche par année
function SearchByYear(year, callback)
{
	getAllSightings(function(result){
		var res = [];
		for (var i = 0; i < result.length; i++)
			if (result[i].year == year)
				res.push(result[i])
		callback(res);
	});
}

//Recherche par ville
function SearchByCity(city, callback)
{
	getAllSightings(function(result){
		var res = [];
		for (var i = 0; i < result.length; i++)
			if (result[i].city.search)
				if (result[i].city.search(city) != -1)
					res.push(result[i])
		callback(res);
	});
}

//Recherche dans commentaires
function SearchByComments(comments, callback)
{
	getAllSightings(function(result){
		var res = [];
		for (var i = 0; i < result.length; i++)
		{
			if (result[i].comments.search)
				if (result[i].comments.search(comments) != -1)
					res.push(result[i])

			}
		callback(res);
	});
}

//Recherche par forme
function SearchByShape(shape, callback)
{
	getAllSightings(function(result){
		var res = [];
		for (var i = 0; i < result.length; i++)
		{
			if (result[i].shape.search)
				if (result[i].shape.search(shape) != -1)
					res.push(result[i])

			}
		callback(res);
	});
}

/*
SearchByYear(2004, function(result){
console.log(result);
});

SearchByCity("london", function(result){
console.log(result);
});

SearchByComments(" cat ", function(result){
console.log(result);
});

SearchByShape("circle", function(result){
console.log(result);
});
*/