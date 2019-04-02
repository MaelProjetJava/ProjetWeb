
var ovniDb;
var dbReady = false;
var dbLoadInitialDataset = false;

function notifyError(str) {
	/* TODO: make toast notification with BootStrap */
	alert(str);
}

function main() {
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

		if (dbLoadInitialDataset)
			importInitialDataset();
		else
			dbReady = true;
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

	dbLoadInitialDataset = true;
	console.log("[DB] Database structure created.");
}

function handleDbError(event) {
	if (!dbReady) {
		console.log("[DB] Error: unable to record initial dataset!");
		notifyError("Impossible de charger les données initiales!");
		dbReady = true;
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

function addInitialDatasetSightings(sightingsList) {
	console.log("[DB] Recording initial dataset in database...");

	var transaction = ovniDb.transaction(["sightings"], "readwrite");
	transaction.oncomplete = function(event) {
		console.log("[DB] Initial dataset successfully recorded.");
		dbReady = true;
		console.log("[DB] Initialization done.");
	};

	for (var i = 0; i < sightingsList.length; i++) {
		splitDatetimeField(sightingsList[i]);
		transaction.objectStore("sightings").add(sightingsList[i]);
	}
}

function addSighting(sighting) {
	console.log("[DB] Adding record");

	var transaction = ovniDb.transaction(["sightings"], "readwrite");
	transaction.objectStore("sightings").add(sighting);
}

function getSightingYears(callback) {
	var transaction = ovniDb.transaction(["sightings"], "readonly");

	var yearIndex = transaction.objectStore("sightings").index("year");
	var cursorRequest = yearIndex.openKeyCursor(null, "nextunique");

	var yearList = [];

	cursorRequest.onsuccess = function(event) {
		var cursor = event.target.result;

		if (!cursor) {
			callback(yearList);
			return;
		}

		yearList.push(cursor.key);
		cursor.continue();
	};
}

function getSightingCountInYear(year, callback, transaction) {
	var yearIndex = transaction.objectStore("sightings").index("year");
	var request = yearIndex.getAllKeys(IDBKeyRange.only(year));

	request.onsuccess = function(event) {
		callback(event.target.result.length);
	};
}

function getSightingCountByYear(callback) {
	getSightingYears(function(yearsList) {
		var countByYear = [];
		var transaction = ovniDb.transaction(["sightings"], "readonly");

		for (var i = 0; i < yearsList.length; i++) {
			countByYear.push({year: yearsList[i], count: 0});

			var get_year_callback = function(i) {
				return function(count) {
					countByYear[i].count = count;
				};
			};

			getSightingCountInYear(yearsList[i], get_year_callback(i), transaction);
		}

		transaction.oncomplete = function(event) {
			callback(countByYear);
		};
	});
}

main();
