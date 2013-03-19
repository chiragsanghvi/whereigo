var Facebook = {
    integrateFBLogin: function (elementId) {
        var divLoginButton = $("#" + elementId);
        $(divLoginButton).addClass("fb-login-button")
        				.attr("data-show-faces", "false")
        				.attr("data-width", "200")
        				.attr("data-max-rows", "1")
          				.attr("autologoutlink", "true")
          				.attr("data-perms","email,user_birthday");
          				//.attr("data-onlogin","facebookLoginCallback()")
    },
    integrateFBLike: function (elementId) {
        var divLikeButton = $("<div />");
        $(divLikeButton).addClass("fb-like")
        				.attr("data-show-faces", "true")
        				.attr("data-width", "150")
        				.attr("data-send", "false")
        				.attr("data-layout", "button_count")
        				.attr("data-href", "https://demos.appacitive.com");
        $("#" + elementId).append(divLikeButton);
    },
    getFacebookAppId: function () {
        var currentUrl = window.location.href.toLowerCase();
        if (currentUrl.indexOf("bdemos.appacitive.com") != -1) {
            return "588708287822907";
        } else if (currentUrl.indexOf("demos.appacitive.com") != -1) {
            return "461032953932088";
        } else{
        	return '123832777803421';
        }
    },
    initializeFramework: function () {
        window.fbAsyncInit = function () {
            FB.init({
                appId: Facebook.getFacebookAppId(), // App ID   
                status: true, // check login status
                cookie: false, // enable cookies to allow the server to access the session
                xfbml: true  // parse XFBML
            });


            // Additional code to be run after SDK init
            FB.Event.subscribe('xfbml.render', function () {
                console.log("from render");
                Whereigo.controllers.loginController.checkLogin();
                $('body').css('overflow','auto');
            });

        	FB.Event.subscribe('auth.login', function(loginResponse){
        		console.log("user  logged in");
                Whereigo.controllers.loginController.login(loginResponse.authResponse);
                $('body').css('overflow','auto');
            })

			FB.Event.subscribe('auth.logout', function(logoutResponse){
        		console.log("user  logged out");
                //Whereigo.controllers.loginController.logout();
            })

        };
    },
    loginWithFacebook: function (onSuccess, onCancel) {
        var login = function () {
            FB.login(function (response) {
                if (response.authResponse) {
                    onSuccess(response.authResponse);
                } else {
                    onCancel();
                }
            });
        };

        FB.getLoginStatus(function (response) {
            if (response.status === 'connected') {
                onSuccess(response.authResponse);
            } else if (response.status === 'not_authorized') {
                login();
            } else {
                login();
            }
        }, true);
    },
    checkLogin:function(onSuccess){
		FB.getLoginStatus(function (response) {
			if(onSuccess)
            	onSuccess(response);
        }, (onSuccess) ? true : false);
    }
};

// Load the SDK Asynchronously
(function (d) {
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js?appId=" + Facebook.getFacebookAppId();
    ref.parentNode.insertBefore(js, ref);
} (document));

$(function(){
	Facebook.initializeFramework();
	Facebook.integrateFBLogin('fbButton');
	Facebook.integrateFBLike('fbLike')
});