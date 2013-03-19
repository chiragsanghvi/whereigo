if(!window.history || !window.history.pushState){
    window.history={
        pushState:function(){},
        replaceState:function(){}
    }
}

window.addEventListener('load', function() {
  setTimeout(function() {
    window.addEventListener('popstate', function(e) {
      $('#txtSearch').val('').focusout();
      GoogleMap.plotDataOnMap(e.state.lArticles);
    });
  }, 0);
});

var GoogleMap = {
    PagingInfo: {
        pageNumber: 1,
        pageSize: 200,
        fetchedCount: 0,
        totalRecords: 0,
        fetchedPages: []
    },
    map: new Object(),
    isInitialized: false,
    Categories: [],
    infoWindow: new google.maps.InfoWindow({ content: '', maxWidth: 450 }),
    initMap: function (latitude, longitude) {

        if (this.isInitialized == false) {

            GoogleMap.map = new google.maps.Map(document.getElementById('mapView'), {
              zoom: 10,
              center: new google.maps.LatLng(latitude, longitude),
              mapTypeId: google.maps.MapTypeId.ROADMAP,
              panControl: true,
              panControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
              },
              zoomControl: true,
              zoomControlOptions: {
                style: google.maps.ZoomControlStyle.DEFAULT,
                position: google.maps.ControlPosition.RIGHT_BOTTOM
              },
              zoom: 12,
              minZoom: 10
            });


            var myOptions={
                content:'',
                disableAutoPan: false,
                maxWidth: 0,
                zIndex: null,
                boxStyle: { 
                  background: "none",
                  opacity: 1,
                  width: "250px",
                 },
                pixelOffset: new google.maps.Size(-67, 34),
                closeBoxURL: "",
                infoBoxClearance: new google.maps.Size(1, 1),
                isHidden: false,
                pane: "floatPane",
                enableEventPropagation: false,
            };

            this.infowindow = new InfoBox(myOptions);

            GoogleMap.isInitialized = true;

            this.activateAutocomplete();
        }

    },
    searchLocations: function (latitude, longitude, prevLocations) {

        GoogleMap.map.setCenter(new google.maps.LatLng(latitude, longitude));
        GoogleMap.map.setZoom(12);
        $.each(GoogleMap.Categories, function (i, filter) {
            filter.count = 0;
        });
        GoogleMap.plotCategories();
        var locationTypes = this.getLocationTypes();
        if (locationTypes.length == 0) {
            return;
        }

        var filters = this.getLocationsFilter();

        GoogleMap.map.clearMarkers();
        $("#divProgress").show();
        GoogleMap.PagingInfo.pageNumber = 1;
        GoogleMap.PagingInfo.fetchedCount = 0;
        GoogleMap.PagingInfo.totalRecords = 0;
        GoogleMap.PagingInfo.fetchedPages = [];

        var plotLocations = function ( lArticles ) {
            GoogleMap.PagingInfo.totalRecords = lArticles.length;

            $.each(lArticles, function (index, loc) {
                var location=loc;
                GoogleMap.plotLocationMarker(location, filters);
                var category = GoogleMap.getLocationProperty(location, "category").toLowerCase();
                $.each(GoogleMap.Categories, function (i, filter) {
                    if (filter.value === category) {
                        filter.count += 1;
                        return;
                    }
                });
            });
            GoogleMap.plotCategories();
            $("#divProgress").hide();

        };

        if (prevLocations) {
            plotLocations(prevLocations);
        } else{
            fetchLocations(latitude, longitude);
        }
        
        function fetchLocations(lat, lng) {

            var property = "(*location within_circle {0},{1},10 km)".format(lat, lng);
            var locations = new Appacitive.ArticleCollection({ schema: 'location' });
            locations.setFilter(property);
            locations.getQuery().extendOptions({ pageNumber: GoogleMap.PagingInfo.pageNumber ,pageSize :GoogleMap.PagingInfo.pageSize});
            
            var that=this;

            locations.fetch(function () {

                var lArticles = locations.getAll()
                
                GoogleMap.PagingInfo.totalRecords = lArticles.length;

                var historyLoc=[];
                $.each(lArticles, function (index, loc) {
                    var location=loc.getArticle();
                    historyLoc.push(location);
                    GoogleMap.plotLocationMarker(location, filters);
                    var category = GoogleMap.getLocationProperty(location, "category").toLowerCase();
                    $.each(GoogleMap.Categories, function (i, filter) {
                        if (filter.value === category) {
                            filter.count += 1;
                            return;
                        }
                    });
                });
                GoogleMap.plotCategories();
                $("#divProgress").hide();

                window.history.pushState({lArticles:historyLoc,place:$('#txtSearch').val()} ,'whereigo' , '/explore.html?location=' +$('#txtSearch').val());

                /* if (GoogleMap.PagingInfo.fetchedCount > GoogleMap.PagingInfo.totalRecords) {
                    return;
                } */

                /*if (GoogleMap.PagingInfo.fetchedCount < response.paginginfo.totalrecords && GoogleMap.PagingInfo.fetchedCount <= 200)
                    fetchLocations(lat, lng);
                else {
                    $("#divProgress").hide();
                }*/
            },//OnError function
                function () {
                    window.history.pushState({lArticles:[],place:$('#txtSearch').val()},'location','/explore.html?location=' +$('#txtSearch').val());
                    $("#divProgress").hide();
                }
            );
        }
    },
    plotLocationMarker: function (location, filters) {
        var geoCodes = this.getLocationProperty(location, "location");
        var category = this.getLocationProperty(location, "category");
        if (category == "")
            return;

        geoCodes = geoCodes.split(',');

        var marker = new google.maps.Marker({
            map: this.map,
            draggable: false,
            icon: this.getMarkerImage(category),
            position: new google.maps.LatLng(geoCodes[0], geoCodes[1])
        });

        marker.animation = google.maps.Animation.DROP;
        marker.category = category;

        this.map.addMarker(marker,location,this);

        if ($.inArray(category, filters) == -1) {
            marker.setMap(null);
        }
    },

    getLocationMarkerMarkup: function (location) {
        var name = this.getLocationProperty(location, "Name");
        var description = this.getLocationProperty(location, "Description").SplitOnWord(100);
        var thumbnail = this.getLocationProperty(location, "Thumbnail");
        var category = this.getLocationProperty(location, "Category");
        if (thumbnail === "") {
            thumbnail = "/Images/" + category + "-icon.png";
        }

        var html = "<table style='width:350px;' cellspacing='3'><tr><td><img src='{0}' width='100' height='100' alt='photo' /></td>";
        html += "<td style='padding:0 5px;'><p><strong>{1}</strong></p><div>{2}...</div>";
        html += "<div style='text-align:right; margin-top:5px;'><a href='details.htm?type=location&identifier={3}' target='_blank'>Show Details</a></div></td></tr></table>";

        return html.format(thumbnail, name, description, location.__id);
    },
    getLocationProperty: function (location, propertyKey) {
        var property = location[propertyKey.toLowerCase()];

        if (property)
            return property;
        return "";
    },
    getMarkerImage: function (category) {
        return "/Images/Markers/marker_" + category + ".png";
    },
    getLocationsFilter: function () {
        if ($('.map-geocoder.active','#results').length > 0) {
            var filters = [];
            $.each($('.map-geocoder.active','#results'), function (index, value) { filters.push($('.category',$(this)).attr('data-val')); });
            return filters;
        }

        return [" "];
    },
    getLocationTypes: function () {
        if ($('.map-geocoder','#results').length > 0) {
            var types = [];
            $.each($('.map-geocoder','#results'), function (index, value) { types.push($('.category',$(this)).attr('data-val')); });
            return types;
        }

        return [];
    },
    activateAutocomplete: function () {
        var input = document.getElementById('txtSearch');
        var autocomplete = new google.maps.places.Autocomplete(input, {});

        google.maps.event.addListener(autocomplete, 'place_changed', function () {
            var place = autocomplete.getPlace();
            if (place && place.geometry) {
                GoogleMap.searchLocations(place.geometry.location.lat(), place.geometry.location.lng());
            }
        });
    },
    filterLocations: function () {
        var filters = GoogleMap.getLocationsFilter();
        $.each(GoogleMap.map.markers, function (index, marker) {
            if ($.inArray(marker.category, filters) == -1) {
                marker.setMap(null);
            }
            else {
                if (marker.map == null) {
                    marker.animation = null;
                    marker.setMap(GoogleMap.map);
                }
            }
        });

    },
    plotLocationsForCurrentSearch: function (locations) {
        var location = $("#txtSearch").val();
        if (location == "") {
            location = getQueryStringParameter("location");
        }

        if (location != "") {
            $("#txtSearch").val(unescape(location));
            GeoLocator.resolveAddressToGeocode(location, function (latitude, longitude) {
                if (GoogleMap.map == undefined || GoogleMap.map.setCenter == undefined) {
                    GoogleMap.initMap(latitude, longitude);
                }
                GoogleMap.searchLocations(latitude, longitude,locations);
            });
        }
        else {
            var geoLocation = GeoLocator.getUserLocation();
            GoogleMap.initMap(geoLocation.latitude, geoLocation.longitude);
            GoogleMap.searchLocations(geoLocation.latitude, geoLocation.longitude,locations);
        }

    },
    plotDataOnMap: function (locations) {
        // If the user has been redirected to this page from details page and location has not been shared,
        // plot the results for searched location. Do not ask for user location
        if (window.location.href.indexOf("?location=") != -1) {
            GoogleMap.plotLocationsForCurrentSearch(locations);
        } else {
            $("#txtSearch").val("");
            var geoLocation = GeoLocator.getUserLocation();
            GoogleMap.initMap(geoLocation.latitude, geoLocation.longitude);
            GoogleMap.plotLocationsForCurrentSearch(); 
        }
    },
    plotCategories: function () {
        var data = new Object();
        data.filters = GoogleMap.Categories;
        data.total = GoogleMap.PagingInfo.totalRecords;
        if (GoogleMap.PagingInfo.totalRecords > 200) {
            data.total = 200;
        }
        $('#results').empty().append(Mustache.render($('#categoryListTemplate').html(),data));

        $('.map-geocoder','#results').click(function(){
            GoogleMap.infowindow.close();
            $(this).toggleClass('active');
            GoogleMap.filterLocations();
        });
    },
    areAllInputsSelected: function () {
        if ($('.map-geocoder.active','#results').length == 6) {
            return true;
        }
        return false;
    }
};

Appacitive.eventManager.subscribe('showMap',function(){
    getPlaces();
});


function getPlaces() {
    if (window.location.href.indexOf("?location=") == -1) {
        if(GeoLocator.isUserLocationAvailable) {
            GeoLocator.resolveGeocodeToAddress(GeoLocator.latitude,GeoLocator.longitude,function(addr){
                $('#txtSearch').val(addr);
            });
        } else{
            $('#txtSearch').val("Pune,Maharashtra,India"); 
        }
    }
    var places = [{name:"Food",value:"food"},
                  {name:"Coffee",value:"coffee" },
                  {name:"Outdoors",value:"outdoors" },
                  {name:"Drinks",value:"drinks" },
                  {name:"Shops",value:"shops" },
                  {name:"Arts",value:"arts" }];

    $.each(places, function (index, item) {
      GoogleMap.Categories.push(new Filter(item.name, item.value, 0));
    });

    GoogleMap.plotCategories();
    GoogleMap.plotDataOnMap();
}

function Filter(name, value, count) {
    this.name = name;
    this.value = value;
    this.count = count;
}

function initiateSearch(e) {
    if (e.keyCode == 13) {
        GoogleMap.plotLocationsForCurrentSearch();
    }
}

function getQueryStringParameter(key, default_) {
    if (default_ == null) default_ = "";
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(window.location.href);
    if (qs == null)
        return default_;
    else
        return qs[1];
}


String.prototype.SplitOnWord = function (limit) {
    var firstSpace = this.indexOf(" ", limit);
    if (firstSpace != -1)
        return this.substr(0, firstSpace);

    return this.substr(0, 100);
};

String.prototype.format = String.prototype.f = function () {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

Array.prototype.ToQueryStringParams = function () {
    var array = this;
    var string = "";
    $.each(array, function (index, value) {
        if (value instanceof GossamerProxy.Contract.KeyValue) {
            string += "{0}={1}&".format(value.Key, value.Value);
        }
    });
    string = string.substr(0, string.length - 1);
    return string;
};

google.maps.Map.prototype.markers = new Array();
google.maps.Map.prototype.filteredMarkers = new Array();
google.maps.Map.prototype.userLocationMarker = new google.maps.Marker();
google.maps.Map.prototype.infoWindow = new google.maps.InfoWindow({ content: '', maxWidth: 450 });
google.maps.Map.prototype.userLocationInfoWindow = new google.maps.InfoWindow({ content: '', maxWidth: 450 });
google.maps.Map.prototype.searchLocationMarker = new google.maps.Marker();
google.maps.Map.prototype.searchLocationInfoWindow = new google.maps.InfoWindow({ content: '', maxWidth: 450 });


google.maps.Map.prototype.addMarker = function (marker,location,scope) {
    this.markers[this.markers.length] = marker;
    var that=scope;
    google.maps.event.addListener(marker, 'click', function () {
        if(that.infowindow.div_ != null && !that.infowindow.isHidden_){
            var child= $(that.infowindow.div_.children).first();
            if(child.attr('data-id')==location.__id){
                that.infowindow.close();
                return;
            }
        }
        location.street=(location.street) ? location.street :"";
        location.city=(location.city) ? location.city :"";
        location.state=(location.state) ? location.state :"";
        location.country=(location.country) ? location.country :"";
        location.rating=(location.avgrating && location.avgrating.all && location.avgrating.all!="") ? location.avgrating.all.toPrecision(1):"NA"
        var loc = {
                name:location.name,
                address:location.address,
                street:(location.street) ? location.street : "",
                cityState: location.city +"," +location.state +"," +location.country,
                id:location.__id,
                rating:location.rating,
                photo:"/images/categories/" +location.category.toLowerCase() +'-icon.png',
                ratingClass:function() {
                    if(this.rating >= 3.5)
                        return 'positive';
                    else if((this.rating < 3.5 && this.rating >= 2 ) || this.rating=='NA')
                        return 'neutral';
                    else
                        return 'negative';
               }
        };
        var el = $(Mustache.render($('#infoWindowTemplate').html(),loc))[0];
        GoogleMap.map.panTo(marker.getPosition());
        that.infowindow.setContent(el);
        that.infowindow.open(GoogleMap.map, marker);
    });
};

google.maps.Map.prototype.getMarkers = function () {
    return this.markers;
};

google.maps.Map.prototype.clearMarkers = function () {
    for (var i = 0; i < this.markers.length; i++) {
        this.markers[i].setMap(null);
    }
    this.markers = new Array();
};

google.maps.LatLng.prototype.distanceFrom = function (newLatLng) {
    // setup our variables
    var lat1 = this.lat();
    var radianLat1 = lat1 * (Math.PI / 180);
    var lng1 = this.lng();
    var radianLng1 = lng1 * (Math.PI / 180);
    var lat2 = newLatLng.lat();
    var radianLat2 = lat2 * (Math.PI / 180);
    var lng2 = newLatLng.lng();
    var radianLng2 = lng2 * (Math.PI / 180);
    // sort out the radius, MILES or KM?
    var earth_radius = 3959; // (km = 6378.1) OR (miles = 3959) - radius of the earth

    // sort our the differences
    var diffLat = (radianLat1 - radianLat2);
    var diffLng = (radianLng1 - radianLng2);
    // put on a wave (hey the earth is round after all)
    var sinLat = Math.sin(diffLat / 2);
    var sinLng = Math.sin(diffLng / 2);

    // maths - borrowed from http://www.opensourceconnections.com/wp-content/uploads/2009/02/clientsidehaversinecalculation.html
    var a = Math.pow(sinLat, 2.0) + Math.cos(radianLat1) * Math.cos(radianLat2) * Math.pow(sinLng, 2.0);

    // work out the distance
    var distance = earth_radius * 2 * Math.asin(Math.min(1, Math.sqrt(a)));

    // return the distance
    return distance;
}

$(function(){
    navigator.geolocation.getCurrentPosition(function(pos){
        GeoLocator.Geocode(pos.coords.latitude,pos.coords.longitude);
        GeoLocator.isUserLocationAvailable=true;
    });
});