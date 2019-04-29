
var ovniDb = null;
var dbReady = false;
var dbScheduledQueries = [];
var dbLoadInitialDataset = false;

function notifyError(str) {
	/* TODO: make toast notification with BootStrap */
	alert(str);
}

function initializeDb() {
	console.log("[DB] Starting initialization...");

	if (!window.indexedDB) {
		console.log("[DB] Error: IndexedDB is not supported!");
		notifyError("Votre navigateur ne supporte pas IndexedDB. Le site ne fonctionnera pas correctement!");
		return;
	}

	console.log("[DB] Opening database...");
	var openRequest = window.indexedDB.open("OVNIdb", 1);

	console.log("[DB] Setting event handlers...");

	openRequest.onsuccess = function(event) {
		console.log("[DB] Database succesfully opened.");

		ovniDb = event.target.result;
		ovniDb.onerror = handleDbError;

		if (dbLoadInitialDataset) {
			importInitialDataset();
		} else {
			dbReady = true;
			processScheduledQueries();
		}
	};
	openRequest.onerror  = function(event) {
		console.log("[DB] Error: unable to open database!");
		notifyError("Impossible d'ouvrir la base de données IndexedDB!\nLe site ne fonctionnera pas correctement!");
	};

	openRequest.onupgradeneeded = createDatabaseStructure;
}

function createDatabaseStructure(event) {
	console.log("[DB] Database empty. Creating database structure...");

	var db = event.target.result;
	var sightingsStore = db.createObjectStore("sightings", {autoIncrement: true, keyPath: "id"});

	sightingsStore.createIndex("year", "year");
	sightingsStore.createIndex("shape", "shape");
	sightingsStore.createIndex("month", "month");
	sightingsStore.createIndex("yearByYear", ["year", "year"]);
	sightingsStore.createIndex("shapeByYear", ["shape", "year"]);
	sightingsStore.createIndex("monthByYear", ["month", "year"]);

	dbLoadInitialDataset = true;
	console.log("[DB] Database structure created.");
}

function handleDbError(event) {
	if (!dbReady) {
		console.log("[DB] Error: unable to record initial dataset!");
		notifyError("Impossible de charger les données initiales!");
		dbReady = true;
		processScheduledQueries();
		return;
	}

	console.log("[DB] Error: some transaction failed: " + event.target.errorCode);
	notifyError("L'opération a échouée!\n Code erreur: " + event.target.errorCode);
}

function importInitialDataset() {
	console.log("[DB] Importing initial dataset...");
	$.ajax({
		url: "initialDataset.json",
		dataType: "json",
		timeout: 0,
		error: function(jqXHR, textStatus, errorThrown) {
			console.log("[DB] Error: unable to load initial dataset!\n"
						+ "Status: " + textStatus + "\n"
						+ "Message: " + errorThrown);
			notifyError("Impossible de charger les données prédéfinies!");
		},
		success: function(ovniSightings, textStatus, jqXHR) {
			console.log("[DB] Initial dataset successfully loaded.");
			addInitialDatasetSightings(ovniSightings);
		}
	});
}

function splitDatetimeField(sightingObj) {
	var parts = sightingObj.datetime.split(" ");

	var dayParts = parts[0].split("/");
	var month = dayParts[0];
	var day = dayParts[1];
	var year = dayParts[2];

	var hourParts = parts[1].split(":");
	var hour = hourParts[0];
	var minute = hourParts[1];

	sightingObj.year = Number(year);
	sightingObj.month = Number(month);
	sightingObj.day = Number(day);

	sightingObj.hour = Number(hour);
	sightingObj.minute = Number(minute);

	delete sightingObj.datetime;
}

function addPredefinedSighting(objectStore, i, sightingsList) {
	splitDatetimeField(sightingsList[i]);
	var request = objectStore.add(sightingsList[i]);

	request.onsuccess = function(event) {
		if (++i >= sightingsList.length)
			return;

		addPredefinedSighting(objectStore, i, sightingsList);
	};
}

function addInitialDatasetSightings(sightingsList) {
	console.log("[DB] Recording initial dataset in database...");

	var transaction = ovniDb.transaction(["sightings"], "readwrite");
	transaction.oncomplete = function(event) {
		console.log("[DB] Initial dataset successfully recorded.");
		dbReady = true;
		console.log("[DB] Initialization done.");
		processScheduledQueries();
	};

	var objectStore = transaction.objectStore("sightings");
	addPredefinedSighting(objectStore, 0, sightingsList);
}

function processScheduledQueries() {
	console.log("[DB] Processing pre-initialization scheduled queries...");

	for (var i = 0; i < dbScheduledQueries.length; i++)
		dbScheduledQueries[i]();

	console.log("[DB] Pre-initialization scheduled queries processed.");
}

function addSighting(sighting, callback) {
	console.log("[DB] Adding record");

	if (ovniDb == null) {
		console.log("[DB] addSighting(): Database not initialized. Query scheduled.");
		dbScheduledQueries.push(function () {
			addSighting(sighting, callback);
		});

		return;
	}

	var transaction = ovniDb.transaction(["sightings"], "readwrite");
	var request = transaction.objectStore("sightings").add(sighting);

	request.onsuccess = function(event) {
		if (callback) {
			console.log("[DB] calling insert callback");
			callback(event.target.result);
		}
	};
}

function deleteSighting(id, callback) {
	console.log("[DB] Deleting record");

	if (ovniDb == null) {
		console.log("[DB] deleteSighting(): Database not initialized. Query scheduled.");
		dbScheduledQueries.push(function () {
			deleteSighting(id, callback);
		});

		return;
	}

	var transaction = ovniDb.transaction(["sightings"], "readwrite");
	var request = transaction.objectStore("sightings").delete(id);

	request.onsuccess = function(event) {
		if (callback) {
			console.log("[DB] Calling delete callback");
			callback();
		}
	};
}

function getAllSightings(callback, finalcallback) {
	console.log("[DB] Retrieving all sightings");

	if (ovniDb == null) {
		console.log("[DB] getAllSightings(): Database not initialized. Query scheduled.");
		dbScheduledQueries.push(function () {
			getAllSightings(callback);
		});

		return;
	}

	var transaction = ovniDb.transaction(["sightings"], "readonly");
	var sightings = transaction.objectStore("sightings");

	sightings.openCursor().onsuccess = function (event) {
		var cursor = event.target.result;

		if (cursor) {
			callback(cursor.value);
			cursor.continue();
		} else if (finalcallback) {
			finalcallback();
		}
	};
}

function getSighting(id, callback) {
	console.log("[DB] Retrieving sighting");

	if (ovniDb == null) {
		console.log("[DB] getSighting(): Database not initialized. Query scheduled.");
		dbScheduledQueries.push(function () {
			getSighting(id, callback);
		});

		return;
	}

	var transaction = ovniDb.transaction(["sightings"], "readonly");
	var sightings = transaction.objectStore("sightings");

	sightings.get(id).onsuccess = function(event) {
		callback(event.target.result);
	};
}

function updateSighting(sighting, callback) {
	console.log("[DB] Updating record");

	if (ovniDb == null) {
		console.log("[DB] updateSighting(): Database not initialized. Query scheduled.");
		dbScheduledQueries.push(function () {
			updateSighting(sighting, callback);
		});

		return;
	}

	var transaction = ovniDb.transaction(["sightings"], "readwrite");
	var sightings = transaction.objectStore("sightings");

	sightings.put(sighting).onsuccess = function(event) {
		if (callback) {
			console.log("[DB] calling update callback");
			callback();
		}
	};
}

function getSightingsCategoriesGetter(categorySet) {
	return function(callback) {
		var transaction = ovniDb.transaction(["sightings"], "readonly");

		var categorySetIndex = transaction.objectStore("sightings").index(categorySet);
		var cursorRequest = categorySetIndex.openKeyCursor(null, "nextunique");

		var categoriesList = [];

		cursorRequest.onsuccess = function(event) {
			var cursor = event.target.result;

			if (!cursor) {
				callback(categoriesList);
				return;
			}

			categoriesList.push(cursor.key);
			cursor.continue();
		};
	};
}

function getSightingCountInCategoryGetter(categorySet) {
	return function(startYear, endYear, category, callback, transaction) {
		var categorySetIndex = transaction.objectStore("sightings").index(
													categorySet + "ByYear");

		var request = categorySetIndex.getAllKeys(IDBKeyRange.bound([category,
							startYear], [category, endYear], false, false));

		request.onsuccess = function(event) {
			callback(event.target.result.length);
		};
	}
}

function getSightingCountByCategory(startYear, endYear, categorySet, propertiesNames, callback) {
	if (ovniDb == null) {
		console.log("[DB] getSightingCountByCategory(): Database not initialized. Query scheduled.");
		dbScheduledQueries.push(function () {
			getSightingCountByCategory(startYear, endYear, categorySet, propertiesNames,
								callback);
		});

		return;
	}

	if (startYear == null)
		startYear = 0;

	if (endYear == null)
		endYear = 9999; /* I don't think the civilization will go thus far... */

	getSightingsCategoriesGetter(categorySet)(function(categoriesList) {
		var countByCategory = [];
		var transaction = ovniDb.transaction(["sightings"], "readonly");

		var get_category_callback = function(i) {
			return function(count) {
				countByCategory[i][propertiesNames.y] = count;
			};
		};

		for (var i = 0; i < categoriesList.length; i++) {
			var entry = {};
			entry[propertiesNames.x] = categoriesList[i];

			countByCategory.push(entry);

			getSightingCountInCategoryGetter(categorySet)(
				startYear,
				endYear,
				categoriesList[i],
				get_category_callback(i),
				transaction
			);
		}

		transaction.oncomplete = function(event) {
			callback(countByCategory);
		};
	});
}

function getSightingCountByYear(startYear, endYear, callback) {
	getSightingCountByCategory(startYear, endYear, "year", {x: "year", y: "count"},
								callback);
}

function getSightingCountByShape(startYear, endYear, callback) {
	getSightingCountByCategory(startYear, endYear, "shape", {x: "label", y: "y"},
								callback);
}

function getSightingCountByMonth(startYear, endYear, callback) {
	var propertiesNames = {x: "mois", y: "count"};

	var callback_wrapper = function(result) {
		for (var i = 0; i < 12; i++) {
			var entry;
			if (i < result.length) {
				entry = result[i];
			} else {
				entry = {};
				entry[propertiesNames.x] = 13;
			}

			if (entry[propertiesNames.x] != i + 1) {
				var new_entry = {count: 0};
				new_entry[propertiesNames.x] = i + 1;
				result.splice(i, 0, new_entry);
			}
		}

		callback(result);
	};

	getSightingCountByCategory(startYear, endYear, "month", propertiesNames,
							callback_wrapper);
}



initializeDb();
