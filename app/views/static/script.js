(function() {
  var events = {
    init: function() {
      var builder = document.getElementById('builder');
      if(builder) {
        this.setupBuilder();
      } else {
        this.loadMap();
      }
    },

    loadMap: function() {
      var map = L.map('map').setView([51.505, -0.09], 5);
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 30,
        id: 'trecoolz.o7bh8139',
        accessToken: 'pk.eyJ1IjoidHJlY29vbHoiLCJhIjoiY2loN3BtdXVtMDAxdnY1bTNvZGprdzF5NSJ9.XtEzyHcd1_GLu-hizFkEsQ'
      }).addTo(map);
      this.loadModel(map);
    },

    loadModel: function(map) {
      var xhr = new XMLHttpRequest();
      xhr.addEventListener('load', function() {
        if(xhr.status === 200) {
          var json = JSON.parse(xhr.responseText);
          events.plotData(json, map);
        }
      });

      xhr.open('GET', '/data');
      xhr.send();
    },

    plotData: function(data, map) {
      for(var i=0; i<data.cities.length; i++) {
        var coords = data.cities[i].coords;
        var parsedCoords = [];
        for(var j=0; j<coords.length; j++) {
            var coord = coords[j];
            parsedCoords.push(parseFloat(coord));
        }
        var circle = L.circle(coords, 20000, {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0.5
        }).addTo(map);
        var crimes = data.cities[i].crimes;
        var popUpString = "Crimes: <br /> ";

        for(var j=0; j<crimes.length; j++) {
          var crime = crimes[j];
          popUpString = popUpString + crime.crimeType + ": " + crime.crimeCount + "<br /> ";
        }

        circle.bindPopup(popUpString)
      }
    },

    setupBuilder: function() {
      // Sets up events for builder
      var addCrime = document.getElementById('addCrime');
      var saveModel = document.getElementById('saveModel');
      var buildModel = document.getElementById('buildModel');
      addCrime.addEventListener('click', function() {
        events.addCrimeUI();
      });

      saveModel.addEventListener('click', function() {
        events.saveModel();
      });

      buildModel.addEventListener('click', function() {
        events.buildModel();
      })
    },

    addCrimeUI: function() {
      // Adds another Crime Control with correct elements
      var formGroup = document.createElement('div');
      var formGroup2 = document.createElement('div');
      var crimeLabel = document.createElement('label');
      var crimeLabelText = document.createTextNode('Crime');
      var crimeInput = document.createElement('input');
      var crimeCountLabel = document.createElement('label');
      var crimeCountLabelText = document.createTextNode('Crime Count');
      var crimeCountInput = document.createElement('input');
      var button = document.getElementById('addCrime');
      var builder = document.getElementById('builder');
      formGroup.setAttribute('class', "form-group");
      formGroup2.setAttribute('class', "form-group");
      crimeInput.setAttribute('class', 'form-control crimeName');
      crimeCountInput.setAttribute('class', 'form-control crimeCount');
      crimeLabel.appendChild(crimeLabelText);
      crimeCountLabel.appendChild(crimeCountLabelText);
      formGroup.appendChild(crimeLabel);
      formGroup.appendChild(crimeInput);
      formGroup2.appendChild(crimeCountLabel);
      formGroup2.appendChild(crimeCountInput);
      builder.insertBefore(formGroup, button);
      builder.insertBefore(formGroup2, button);
    },

    saveModel: function() {
      // Saves current model to session
      var modelName = document.getElementById('name').value.toLowerCase();
      var modelCity = document.getElementById('city').value;
      var modelLong = document.getElementById('long').value;
      var modelLat = document.getElementById('lat').value;
      var crimes = document.getElementsByClassName('crimeName');
      var counts = document.getElementsByClassName('crimeCount');
      var modelCrimes = [];
      for(var i=0; i<crimes.length; i++) {
        var crime = {};
        crime.crimeName = crimes[i].value;
        crime.crimeCount = counts[i].value;
        modelCrimes.push(crime);
      }
      var model = {
        // Build a new city object with crimes
        city: modelCity,
        coords: [modelLong, modelLat],
        crimes: modelCrimes
      };

      if(sessionStorage.getItem(modelName) === null) {
        // Store new model
        var mainModel = {
          cities: [model]
        };
        sessionStorage.setItem(modelName, JSON.stringify(mainModel));
      } else {
        // Add to existing
        var savedModel = sessionStorage.getItem(modelName);
        savedModel = JSON.parse(savedModel);
        savedModel.cities.push(model);
        sessionStorage.setItem(modelName, JSON.stringify(savedModel));
      }

      builder.reset(); // Reset the form
      var modelInput = document.getElementById('name');
      modelInput.value = modelName.toLowerCase();
      modelInput.setAttribute('disabled', 'disabled'); // Disable modelName so it works on one model
      window.scroll(0, 0);
    },

    buildModel: function() {
      var modelName = document.getElementById('name').value.toLowerCase();
      var newModel = sessionStorage.getItem(modelName);
      var json = JSON.parse(newModel);
      var data = {
        fileName: modelName + ".json",
        data: json
      };
      var xhr = new XMLHttpRequest();
      xhr.addEventListener('load', function() {
        if(xhr.status === 200) {
          window.location.href = '/';
          sessionStorage.removeItem(modelName);
        } else {
          alert('Model could not be saved.');
        }
      });
      data = JSON.stringify(data);
      xhr.open("POST", '/build/write');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data);
    }
  }

  events.init();

})();
