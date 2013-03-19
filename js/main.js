window.currentEnvironment = "https://apis.appacitive.com/";
var currentUrl = window.location.href.toLowerCase();
if (currentUrl.indexOf("localhost") != -1) {
    window.currentEnvironment = "https://apis.appacitive.com/";
} else if (currentUrl.indexOf("bdemos.appacitive.com") != -1) {
    window.currentEnvironment = "https://bapis.appacitive.com/";
} else if (currentUrl.indexOf("demos.appacitive.com") != -1) {
    window.currentEnvironment = "https://apis.appacitive.com/";
}

if (!window.Whereigo) Whereigo = {};
Whereigo.config = {};

// default points to production
Whereigo.config = new (function () {
    var _apiBaseUrl = window.currentEnvironment;
    var _deployementName = "restaurantsearch2";
    var _apikey="ASpQ6scJZUKShAEoAk1fOA==";

    this.apiBaseUrl = _apiBaseUrl;
    this.deployment = _deployementName;
    this.apikey = _apikey;
})();


var GeoLocator = {
    Geocode: function (latitude, longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    },
    isUserLocationAvailable:false,
    resolveGeocodeToAddress: function (latitude, longitude, onSuccess, onError) {
        if (latitude == undefined || longitude == undefined) {
            if (onError)
                onError("Geocode is not defined.");
            return;
        }
        $.get("http://maps.google.com/maps/api/geocode/json?sensor=false&latlng={0},{1}".format(latitude, longitude), function (response) {
            if ( response.results.length > 0 ) {
                onSuccess(response.results[0].formatted_address);
            }else{
                onSuccess("");
            }
        });
    },
    resolveAddressToGeocode: function (address, onSuccess, onError) {
        address = address.replace(/ /g, "+");
        $.get("http://maps.google.com/maps/api/geocode/json?sensor=false&address=" + address, function (response) {
            if (response.results.length > 0 ) {
                var loc = response.results[0].geometry.location;
                onSuccess(loc.lat, loc.lng);
            } else{
                onSuccess("","");
            }
        });
    },
    getDistanceBetweenTwoGeocodes: function (latitude1, longitude1, latitude2, longitude2) {
        try {
            var geocode1 = new google.maps.LatLng(latitude1, longitude1);
            var geocode2 = new google.maps.LatLng(latitude2, longitude2);
            var miledistance = geocode1.distanceFrom(geocode2, 3959).toFixed(1);
            var kmdistance = (miledistance * 1.609344).toFixed(1);
            return kmdistance;
        }
        catch (error) {
            console.log(error);
        }
    },
    getDistanceFromUserLocation: function (latitude, longitude) {
        if (GeoLocator.isUserLocationAvailable){
            var userLocation = GeoLocator.getUserLocation();
            return GeoLocator.getDistanceBetweenTwoGeocodes(latitude, longitude, userLocation.latitude, userLocation.longitude);
        }

        return "";
    },
    getUserLocation: function () {
        if(GeoLocator.isUserLocationAvailable)
            return { latitude : this.latitude , longitude : this.longitude };

        return this.defaultLocation;
    },
    setIpBasedLocation : function() {
        var that = this;
        navigator.geolocation.getCurrentPosition(function(geocode){
            that.latitude = geocode.coords.latitude;
            that.longitude = geocode.coords.longitude;
        });
    },
    defaultLocation: {
        latitude:18.5507626,
        longitude: 73.95021849999999
    }
};
