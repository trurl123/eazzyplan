/*global document, window, jQuery, DOMParser, ActiveXObject, localStorage, ZeroClipboard, console, $ */

/*(function($) {

$.extend({
    messageBox: function() {

    }
});

})(jQuery);*/

$.okCancelDialog = function(text, title, onOk, onCancel) {
    var buttons = {};
    if (!$('#okCancelDialog').length) {
        $('body').append("<div id='okCancelDialog' style='display: none'></div>");
    }
    buttons[title] = onOk;
    buttons["Cancel"] = onCancel;
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
