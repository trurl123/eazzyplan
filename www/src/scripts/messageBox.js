/*global document, window, jQuery, DOMParser, ActiveXObject, localStorage, ZeroClipboard, console, $ */

/*(function($) {

$.extend({
    messageBox: function() {

    }
});

})(jQuery);*/

$.messageBox = function(text, title) {
    var buttons = {};
    if (!$('#okCancelDialog').length) {
        $('body').append("<div id='okCancelDialog' style='display: none'></div>");
    }
    if (!title) {
        title = "Notification";
    }
    buttons["Close"] = function() { $(this).dialog("close"); };
    $('#okCancelDialog').html(text).dialog(
        { 
            buttons: buttons,
            modal: true,
            width: '350px',
            title: title
        }
    );
};

$.okCancelDialog = function(text, title, onOk) {
    var buttons = {};
    if (!$('#okCancelDialog').length) {
        $('body').append("<div id='okCancelDialog' style='display: none'></div>");
    }
    buttons[title] = function() { onOk(); $(this).dialog("close"); };
    buttons["Cancel"] = function() { $(this).dialog("close"); };
    $('#okCancelDialog').html(text).dialog(
        { 
            buttons: buttons,
            modal: true,
            width: '350px',
            title: title
        }
    );
};

$.showPopup = function(text, title) {
    if (!$('#popupDialog').length) {
        $('body').append("<div id='popupDialog' style='display: none'></div>");
    }
    if (!title) {
        title = "Notification";
    }
    window.clearTimeout($('#popupDialog')[0].timer);
    $('#popupDialog').html(text).dialog(
        { 
            modal: false,
            width: '350px',
            title: title,
            minHeight: 50,
            show: "slide",
            position: "bottom"
        }
    );
    $('#popupDialog')[0].timer = 
        window.setTimeout(function() {
            $('#popupDialog').dialog("close");
        },1500);
};
