//Set session
if (!window.Whereigo) Whereigo = {};
if (!Whereigo.bag) Whereigo.bag = {};
Whereigo.bag.isAuthenticatedUser = false;
if (!Whereigo.controllers) Whereigo.controllers = {};

Whereigo.controllers.applicationController = new (function () {
    this.createSession = function () {
        Appacitive.session.environment='sandbox';
        _setAPIBaseUrl();
        var _sessionOptions = { "apikey": Whereigo.config.apikey, app: 'sdk' }
        Appacitive.session.create(_sessionOptions);
        Appacitive.eventManager.subscribe('session.success', function () {
            Appacitive.eventManager.fire('showMap');
            Appacitive.eventManager.fire('showDetails');  
        });
    };

    var _setAPIBaseUrl = function () {
        var currentUrl = window.location.href.toLowerCase();
        if (currentUrl.indexOf("bdemos.appacitive.com") != -1) {
            Appacitive.config.apiBaseUrl = "https://bapis.appacitive.com/";
        }
        else {
            Appacitive.config.apiBaseUrl = "https://apis.appacitive.com/";
        }
    };
})();


Whereigo.controllers.loginController = new (function () {

    this.authenticateUser = function () {
        var base = Whereigo.controllers.loginController;
        Whereigo.bag.user = { __id: '' };
        base.login(this, {
            callback: function () {
                //EventManager.fire("userAuthenticated", this, {});
            }
        });
    };

    this.checkLogin = function(onSuccess) {
        if(FB) {
            Facebook.checkLogin(function(response){
                if (response.status === 'connected') {
                    Appacitive.facebook.accessToken = response.authResponse.accessToken;
                    Appacitive.Users.signupWithFacebook(function(){
                        $(".fb_button_text").text("Logout " + arguments[0].user.firstname + arguments[0].user.lastname);
                        Appacitive.session.setUserAuthHeader(arguments[0].token);
                        Whereigo.bag.user = arguments[0].user;
                        Whereigo.bag.isAuthenticatedUser = true;     

                        if(onSuccess)
                        onSuccess(response.authResponse);
                    },function(){
                        Appacitive.facebook.logout();
                    });
                }
            });   
        }
    };

    this.login = function (response) {
        Appacitive.facebook.accessToken = response.accessToken;
        Appacitive.Users.signupWithFacebook(function () {
            $(".fb_button_text").text("Logout " + arguments[0].user.firstname + arguments[0].user.lastname);
            Appacitive.session.setUserAuthHeader(arguments[0].token);
            Whereigo.bag.user = arguments[0].user;
            Whereigo.bag.isAuthenticatedUser = true;
        });
    };

    this.logout = function(){ }
})();

Whereigo.controllers.applicationController.createSession();
GeoLocator.setIpBasedLocation();
