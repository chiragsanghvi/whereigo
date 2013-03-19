/**
Depends on 	jQuery
jQuery cookies
**/

(function($) {
    if (!window.Connect) {
        window.Connect = { };
    }
    if (!Connect.utils) {
        window.Connect.utils = { };
    }

    window.Connect.utils.cookies = new (function() {
        this.get = function(cookieName) {
            var val = $.cookies.get(cookieName);
            if (val != null) {
                return {
                    name: cookieName,
                    value: val
                };
            } else {
                return null;
            }
        };

        this.set = function() {
            if (arguments.length > 0) {
                if (arguments.length == 1 && typeof(arguments[0] == "object")) {
                    $.cookies.set(arguments[0].name, arguments[0].value);
                } else {
                    $.cookies.set(arguments[0].toString(), arguments[1].toString());
                }
            }
        };

        this.del = function(cookieName) {
            if (cookieName)
                $.cookies.del(cookieName);
        };
    })();
})(jQuery);