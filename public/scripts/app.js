/*
 * @license
 * Your First PWA Codelab (https://g.co/codelabs/pwa)
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */
'use strict';

const weatherApp = {
  selectedLocations: {},
  addDialogContainer: document.getElementById('addDialogContainer'),
};

/**
 * Toggles the visibility of the add location dialog box.
 */
function toggleAddDialog() {
  weatherApp.addDialogContainer.classList.toggle('visible');
}

/**
 * Event handler for butDialogAdd, adds the selected location to the list.
 */
function addLocation() {
  // Hide the dialog
  toggleAddDialog();
  // Get the selected city
  const select = document.getElementById('selectCityToAdd');
  const selected = select.options[select.selectedIndex];
  const geo = selected.value;
  const label = selected.textContent;
  const location = {label: label, geo: geo};
  // Create a new card & get the weather data from the server
  const card = getForecastCard(location);
  getForecastFromNetwork(geo).then((forecast) => {
    renderForecast(card, forecast);
  });
  // Save the updated list of selected cities.
  weatherApp.selectedLocations[geo] = location;
  saveLocationList(weatherApp.selectedLocations);
}

/**
 * Event handler for .remove-city, removes a location from the list.
 *
 * @param {Event} evt
 */
function removeLocation(evt) {
  const parent = evt.srcElement.parentElement;
  parent.remove();
  if (weatherApp.selectedLocations[parent.id]) {
    delete weatherApp.selectedLocations[parent.id];
    saveLocationList(weatherApp.selectedLocations);
  }
}

/**
 * Renders the forecast data into the card element.
 *
 * @param {Element} card The card element to update.
 * @param {Object} data Weather forecast data to update the element with.
 */
function renderForecast(card, data) {
  if (!data) {
    // There's no data, skip the update.
    return;
  }

  // Find out when the element was last updated.
  const cardLastUpdatedElem = card.querySelector('.card-last-updated');
  const cardLastUpdated = cardLastUpdatedElem.textContent;
  const lastUpdated = parseInt(cardLastUpdated);

  // If the data on the element is newer, skip the update.
  if (lastUpdated >= data.currently.time) {
    return;
  }
  cardLastUpdatedElem.textContent = data.currently.time;

  // Render the forecast data into the card.
  card.querySelector('.description').textContent = data.currently.summary;
  const forecastFrom = luxon.DateTime
      .fromSeconds(data.currently.time)
      .setZone(data.timezone)
      .toFormat('DDDD t');
  card.querySelector('.date').textContent = forecastFrom;
  card.querySelector('.current .icon')
      .className = `icon ${data.currently.icon}`;
  card.querySelector('.current .temperature .value')
      .textContent = Math.round(data.currently.temperature);
  card.querySelector('.current .humidity .value')
      .textContent = Math.round(data.currently.humidity * 100);
  card.querySelector('.current .wind .value')
      .textContent = Math.round(data.currently.windSpeed);
  card.querySelector('.current .wind .direction')
      .textContent = Math.round(data.currently.windBearing);
  const sunrise = luxon.DateTime
      .fromSeconds(data.daily.data[0].sunriseTime)
      .setZone(data.timezone)
      .toFormat('t');
  card.querySelector('.current .sunrise .value').textContent = sunrise;
  const sunset = luxon.DateTime
      .fromSeconds(data.daily.data[0].sunsetTime)
      .setZone(data.timezone)
      .toFormat('t');
  card.querySelector('.current .sunset .value').textContent = sunset;

  // Render the next 7 days.
  const futureTiles = card.querySelectorAll('.future .oneday');
  futureTiles.forEach((tile, index) => {
    const forecast = data.daily.data[index + 1];
    const forecastFor = luxon.DateTime
        .fromSeconds(forecast.time)
        .setZone(data.timezone)
        .toFormat('ccc');
    tile.querySelector('.date').textContent = forecastFor;
    tile.querySelector('.icon').className = `icon ${forecast.icon}`;
    tile.querySelector('.temp-high .value')
        .textContent = Math.round(forecast.temperatureHigh);
    tile.querySelector('.temp-low .value')
        .textContent = Math.round(forecast.temperatureLow);
  });

  // If the loading spinner is still visible, remove it.
  const spinner = card.querySelector('.card-spinner');
  if (spinner) {
    card.removeChild(spinner);
  }
}

/**
 * Get's the latest forecast data from the network.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
function getForecastFromNetwork(coords) {
  return fetch(`/forecast/${coords}`)
      .then((response) => {
        return response.json();
      })
      .catch(() => {
        return null;
      });
}

/**
 * Get's the cached forecast data from the caches object.
 *
 * @param {string} coords Location object to.
 * @return {Object} The weather forecast, if the request fails, return null.
 */
function getForecastFromCache(coords) {
  // CODELAB: Add code to get weather forecast from the caches object.
if (!('caches' in window)) {
  return null;
}
const url = `${window.location.origin}/forecast/${coords}`;
return caches.match(url)
    .then((response) => {
      if (response) {
        return response.json();
      }
      return null;
    })
    .catch((err) => {
      console.error('Error getting data from cache', err);
      return null;
    });

}

/**
 * Get's the HTML element for the weather forecast, or clones the template
 * and adds it to the DOM if we're adding a new item.
 *
 * @param {Object} location Location object
 * @return {Element} The element for the weather forecast.
 */
function getForecastCard(location) {
  const id = location.geo;
  const card = document.getElementById(id);
  if (card) {
    return card;
  }
  const newCard = document.getElementById('weather-template').cloneNode(true);
  newCard.querySelector('.location').textContent = location.label;
  newCard.setAttribute('id', id);
  newCard.querySelector('.remove-city')
      .addEventListener('click', removeLocation);
  document.querySelector('main').appendChild(newCard);
  newCard.removeAttribute('hidden');
  return newCard;
}

/**
 * Gets the latest weather forecast data and updates each card with the
 * new data.
 */
function updateData() {
  Object.keys(weatherApp.selectedLocations).forEach((key) => {
    const location = weatherApp.selectedLocations[key];
    const card = getForecastCard(location);
    // CODELAB: Add code to call getForecastFromCache.
getForecastFromCache(location.geo)
    .then((forecast) => {
      renderForecast(card, forecast);
    });

    // Get the forecast data from the network.
    getForecastFromNetwork(location.geo)
        .then((forecast) => {
          renderForecast(card, forecast);
        });
  });
}

/**
 * Saves the list of locations.
 *
 * @param {Object} locations The list of locations to save.
 */
function saveLocationList(locations) {
  const data = JSON.stringify(locations);
  localStorage.setItem('locationList', data);
}

/**
 * Loads the list of saved location.
 *
 * @return {Array}
 */
function loadLocationList() {
  let locations = localStorage.getItem('locationList');
  if (locations) {
    try {
      locations = JSON.parse(locations);
    } catch (ex) {
      locations = {};
    }
  }
  if (!locations || Object.keys(locations).length === 0) {
    const key = '40.7720232,-73.9732319';
    locations = {};
    locations[key] = {label: 'New York City', geo: '40.7720232,-73.9732319'};
  }
  return locations;
}

/**
 * Initialize the app, gets the list of locations from local storage, then
 * renders the initial data.
 */
function init() {
  // Get the location list, and update the UI.
  weatherApp.selectedLocations = loadLocationList();
  updateData();

  // Set up the event handlers for all of the buttons.
  document.getElementById('butRefresh').addEventListener('click', updateData);
  document.getElementById('butAdd').addEventListener('click', toggleAddDialog);
  document.getElementById('butDialogCancel').addEventListener('click', toggleAddDialog);
  document.getElementById('butDialogAdd').addEventListener('click', addLocation);
}

init();

/* RecorderPart*/

//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var recorder; 						//WebAudioRecorder object
var input; 							//MediaStreamAudioSourceNode  we'll be recording
var encodingType; 					//holds selected encoding for resulting audio (file)
var encodeAfterRecord = true;       // when to encode

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //new audio context to help us record

//var encodingTypeSelect = document.getElementById("encodingTypeSelect");
var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var recordingsList = document.getElementById("recordingsList");
var log = document.getElementById("log");

//IndexDb
//window.indexedDB|| window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB
// IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.OIDBTransaction || window.msIDBTransaction,

var indexedDB;
var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
var dbVersion = 1.0;
var vb = 0;

var request = indexedDB.open("elephantFiles", dbVersion),
    db,
    createObjectStore = function (dataBase) {
        // Create an objectStore
        console.log("Creating objectStore")
        dataBase.createObjectStore("elephants", { autoIncrement: true, keyPath: 'id'});
    },
    putElephantInDb = function (blob) {
        console.log("Putting elephants in IndexedDB");

        // Open a transaction to the database,因為不確定db是否連上所以分開寫
        var readWriteMode = typeof IDBTransaction.READ_WRITE == "undefined" ? "readwrite" : IDBTransaction.READ_WRITE;
        var transaction = db.transaction(["elephants"], readWriteMode);
        // Put the blob into the dabase
        //這邊開始放入blob
        //var put = transaction.objectStore("elephants").put(blob, "wav"); 

        /*Object.defineProperty(blob, 'title', {
            value: new Date().toISOString(),
            writable: false
            });*/

        //var put = transaction.objectStore("elephants").add(blob,blob.vb); 

        var put = transaction.objectStore("elephants").put(blob);

        // Retrieve the file that was just stored

        //remove old data
        while (recordingsList.lastChild) {
            recordingsList.removeChild(recordingsList.lastChild);
        }
        readElephantInDb();
        //transaction.objectStore("elephants").get(blob).onsuccess = function (event) {
        //    createDownloadLink(event.target.result, "wav");
        //};

        /*transaction.objectStore("elephants").openCursor().onsuccess = function(event) {
          var cursor = event.target.result;
           if(cursor) {
           createDownloadLink(cursor,"wav");
           cursor.continue();
               }
        };
       */
    },
    readElephantInDb = function () {
        var readWriteMode = typeof IDBTransaction.READ_WRITE == "undefined" ? "readwrite" : IDBTransaction.READ_WRITE;
        var transaction = db.transaction(["elephants"], readWriteMode);
        transaction.objectStore("elephants").openCursor().onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor) {

                // cursor.value contains the current record being iterated through
                // this is where you'd do something with the result
                createDownloadLink(event.target.result.value, "wav");
                cursor.continue();
            }


        };
    };



request.onupgradeneeded = function (event) {
    createObjectStore(event.target.result);
};
request.onerror = function (event) {
    console.log("Error creating/accessing IndexedDB database");
};

request.onsuccess = function (event) {
    console.log("Success creating/accessing IndexedDB database");
    db = request.result;

    db.onerror = function (event) {
        console.log("Error creating/accessing IndexedDB database");
    };

    // Interim solution for Google Chrome to create an objectStore. Will be deprecated
    if (db.setVersion) {
        if (db.version != dbVersion) {
            var setVersion = db.setVersion(dbVersion);
            setVersion.onsuccess = function () {
                createObjectStore(db);
                readElephantInDb();
                //putElephantInDb(blob);
            };
        }
        else {
            //putElephantInDb(blob);
            readElephantInDb();
        }
    }
    else {
        //putElephantInDb(blob);
        readElephantInDb();
    }
};

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

function startRecording() {
    console.log("startRecording() called");

	/*
		Simple constraints object, for more advanced features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

    var constraints = { audio: true, video: false }

    /*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        console.log("getUserMedia() success, stream created, initializing WebAudioRecorder...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
        audioContext = new AudioContext();

        //update the format 
        //document.getElementById("formats").innerHTML="Format: 2 channel "+encodingTypeSelect.options[encodingTypeSelect.selectedIndex].value+" @ "+audioContext.sampleRate/1000+"kHz"

        //assign to gumStream for later use
        gumStream = stream;

        /* use the stream */
        input = audioContext.createMediaStreamSource(stream);

        //stop the input from playing back through the speakers
        //input.connect(audioContext.destination)

        //get the encoding 
        //encodingType = encodingTypeSelect.options[encodingTypeSelect.selectedIndex].value;
        encodingType = "wav";

        //disable the encoding selector
        //encodingTypeSelect.disabled = true;

        recorder = new WebAudioRecorder(input, {
            workerDir: "scripts/", // must end with slash
            encoding: encodingType,
            numChannels: 2, //2 is the default, mp3 encoding supports only 2
            onEncoderLoading: function (recorder, encoding) {
                // show "loading encoder..." display
                __log("Loading " + encoding + " encoder...");
            },
            onEncoderLoaded: function (recorder, encoding) {
                // hide "loading encoder..." display
                __log(encoding + " encoder loaded");
            }
        });

        recorder.onComplete = function (recorder, blob) {
            __log("Encoding complete");
            //vb += 1;
            //Object.defineProperty(blob, 'vb', {
            //    value: vb,
            //    writable: false
            //});
            //結束編碼,存至indexDb
            //有兩個request success 這是第二的當錄音時觸發
            request.onsuccess = function (event) {

                // Interim solution for Google Chrome to create an objectStore. Will be deprecated
                if (db.setVersion) {
                    if (db.version != dbVersion) {
                        var setVersion = db.setVersion(dbVersion);
                        setVersion.onsuccess = function () {
                            createObjectStore(db);
                            putElephantInDb(blob);
                        };
                    }
                    else {
                        putElephantInDb(blob);
                    }
                }
                else {
                    putElephantInDb(blob);
                }
            };



            //createObjectStore(db);
            putElephantInDb(blob);

            //encodingTypeSelect.disabled = false;
        }

        recorder.setOptions({
            timeLimit: 120,
            encodeAfterRecord: encodeAfterRecord,
            ogg: { quality: 0.5 },
            mp3: { bitRate: 160 }
        });

        //start the recording process
        recorder.startRecording();

        __log("Recording started");

    }).catch(function (err) {
        //enable the record button if getUSerMedia() fails
        recordButton.disabled = false;
        stopButton.disabled = true;

    });

    //disable the record button
    recordButton.disabled = true;
    stopButton.disabled = false;
}

function stopRecording() {
    console.log("stopRecording() called");

    //stop microphone access
    gumStream.getAudioTracks()[0].stop();

    //disable the stop button
    stopButton.disabled = true;
    recordButton.disabled = false;

    //tell the recorder to finish the recording (stop recording + encode the recorded audio)
    recorder.finishRecording();

    __log('Recording stopped');
}

function deleteRecording(e) {
    var readWriteMode = typeof IDBTransaction.READ_WRITE == "undefined" ? "readwrite" : IDBTransaction.READ_WRITE;
    var transaction = db.transaction(["elephants"], readWriteMode);
    transaction.objectStore("elephants").delete(parseInt(e.target.id));
    recordingsList.removeChild(document.getElementById(e.target.id).parentNode);
}
function createDownloadLink(blob, encoding) {

    var url = URL.createObjectURL(blob);
    var au = document.createElement('audio');
    var li = document.createElement('li');
    var link = document.createElement('a');
    var btn = document.createElement('button');
    btn.addEventListener("click", deleteRecording);
    //add controls to the <audio> element
    au.controls = true;
    au.src = url;

    //link the a element to the blob
    link.href = url;
    //link.download = new Date().toISOString() + '.'+encoding;
    link.download = blob.id + '.' + encoding;
    link.innerHTML = link.download;
    btn.id = blob.id;
    btn.innerHTML = "delete";    

   
    //add the new audio and a elements to the li element
    li.appendChild(au);
    li.appendChild(link);
    li.appendChild(btn);
    //add the li element to the ordered list
    recordingsList.appendChild(li);
}



//helper function
function __log(e, data) {
    log.innerHTML += "\n" + e + " " + (data || '');
}