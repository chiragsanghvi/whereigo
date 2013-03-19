var storage = new GossamerStorage()
storage.setSession(GossamerProxy.Session.Id)

//searching
function initiateSearch(e) {
    if (e.keyCode == 13) {
        var location = $("#txtSearch").val();
        if (location != "")
            window.location.href = "explore.htm?location=" + location;
    }
}
var input = document.getElementById('txtSearch');
autocomplete = new google.maps.places.Autocomplete(input);

function dateFromWcf(input, throwOnInvalidInput) {
    var pattern = /Date\(([^)]+)\)/;
    var results = pattern.exec(input);
    if(results == undefined || results == null)
        return "";
    if (results.length != 2) {
        if (!throwOnInvalidInput) {
            return s;
        }
        throw new Error(s + " is not .net json date.");
    }
    return new Date(parseFloat(results[1]));
}

function getToShowVoteOptions() {
    if (window.facebookUser && window.facebookUser != null) {
        return "";
    }
    return "hidden";
}

function peopleOrPerson(num) {
    if (parseInt(num) == 1)
        return "person";
    return "people";
}

function getStarWidth(numStars) {
    if (numStars == -1)
        return 0;
    if (parseInt(numStars) == numStars) {
        return 14 * parseInt(numStars);
    }
    return 0;
}

function bindEvents() {

    $("#liDescription").click(function () {
        if ($(this).hasClass("on")) return;
        $(this).addClass("on");
        $("#liPhotos").removeClass("on");
        $("#divDescription").show();
        $("#divReviews").show();
        $("#photosPage").hide();
    });

    $("#liPhotos").click(function () {
        if ($(this).hasClass("on")) return;
        $(this).addClass("on");
        $("#liDescription").removeClass("on");
        $("#divDescription").hide();
        $("#divReviews").hide();
        $("#photosPage").show();
    });

    $("#btnAddComment").click(function () {
        $(this).hide();
        $('#txtSubject').val('')
        $('#txtMessage').val('').blur()
        $("a", $("div.rating-cancel")).click();
        $("#divAddComment").slideToggle();
        $("#txtSubject").focus();
    });

    return;
}

function getTextArea(nameId, class1) {
    return '<textarea name="txtMessage" cols="" class="textfld" id="txtMessage" rows="5"></textarea>';
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


function AddCommentView() {
    if (!this instanceof AddCommentView)
        return new AddCommentView()

    var view = $("<div></div>").setTemplateElement("txtCommentFormTemplate").processTemplate({}, null, { filter_data: false, runnable_functions: true });

    $('#divAddComment').empty().append(view)
    $("#txtSubject").focus();
    $('input.star').rating();
    $("#txtMessage").Watermark("Your message here");
    $('#btnCancelReview').click(function () {
        $('#divAddComment').slideUp()
        $("#btnAddComment").show()
        $('#lblSubjectError', view).hide();
        $('#lblMessageError', view).hide();
        $('#lblNoFacebook', view).hide();
    })

    $('#btnSubmitReview', view).click(function () {
        var subject = $('#txtSubject').val()
        var message = $('#txtMessage').val()
        var pass = true
        var sError = $('#lblSubjectError', view)
        var mError = $('#lblMessageError', view)
        var fError = $('#lblNoFacebook', view)

        if (!subject || subject.length == 0) {
            sError.show()
            pass = false
        }
        else
            sError.hide()

        if (!message || message.length == 0 || message == 'Your message here') {
            mError.show()
            pass = false
        }
        else
            mError.hide()

        if (!window.facebookUser) {
            fError.show()
            pass = false
        }

        if (pass) {
            commentController.addComment()
            $('#divAddComment').slideUp()
            $("#btnAddComment").show()
            $('#lblSubjectError', view).hide();
            $('#lblMessageError', view).hide();
            $('#lblNoFacebook', view).hide();
        }
    })
};

function CommentView(comment) {
    if (!this instanceof CommentView)
        return new CommentView()
    
    var view = $("<div></div>").setTemplateElement("txtReviewsTemplate").processTemplate(comment, null, { filter_data: false, runnable_functions: true });
    $('#divReviews').append(view)

    var errorHandler = function (e) {
        $('#divReviewSection', view).show()
        $('#divReviewLoading', view).hide()

        var lblError = $('#divVoteError', view)
        lblError.html(e).fadeIn('slow').fadeOut('slow')
    }

    $('#lnkVoteUp', view).click(function () {
        var data = $(this).data()
        $('#divReviewLoading', view).show()
        $('#divReviewSection', view).hide()
        comment.changeVote(data.commentid, data.votes + 1, function (success) {
            $('#divReviewSection', view).show()
            $('#divReviewLoading', view).hide()
        }, errorHandler)
    })
};

//get location from url and call gossamer to search and populate location data
(function () {

    var articleId = getQueryStringParameter('identifier')
  
    /**
        order: 
            1. get location and set
            2. get albums and set
            3. get comments and set
    **/
   
    //get comments
    var getComments = function() {
        storage.connections.getConnectedArticles(articleId, 'Comment', 'LocationComment', function(conn) {
            if(conn) {
                for (var x = 0; x < conn.length; x = x + 1) {
                    storage.articles.get(conn[x].__endpointa.articleid, 'Comment', function(a) {
                        window.selectedLocation.addComment(a)
                    }, function() {
                    });
                }
            }
            window.selectedLocation.displayComments()
        }, function() {});
    }

    //get albums
    var getAlbums = function(comments) {
        storage.connections.getConnectedArticles(articleId, 'Album', 'LocationAlbum', function (conn) {
            if (typeof(conn) != 'undefined' && conn.length > 0) {
                storage.articles.get(conn[0].__endpointb.articleid, 'Album', function(a) {
                    makeLocation(a);
                }, function() {});
            } else {
                makeLocation();
            }
        }, function() {});
    }

    //get location
    var makeLocation = function(albumArticle) {
        storage.articles.get(articleId, 'Location', function(article) {
            var sL = new Location(article);
            sL.setContact()
            sL.setAlbum(albumArticle)
            window.selectedLocation = sL
            sL.currentPageUrl = window.location.href;
            $("#divLeftColContent").setTemplateElement("txtLeftColTemplate").processTemplate(selectedLocation);
            $("#divDetails").setTemplateElement("txtEntityDetailsTemplate").processTemplate(selectedLocation, null, { filter_data: false, runnable_functions: true });
            if (!window.facebookUser) {
                $('#btnAddComment').hide();
                $('#fbHotelLike').hide();
            }
            $("#lnkMapImage").lightBox();

            //setup the add new comment view
            new AddCommentView()
            
            if(typeof FB != 'undefined')
                FB.XFBML.parse(document.getElementById("fbHotelLike"));
            getComments()
            bindEvents()
        }, function() {});
    }

    //start working
    getAlbums()

    
})()