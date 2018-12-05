/**
 * @fileoverview This module has some functions for handling object as collection.
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */
'use strict';

var object = require('./object');
var collection = require('./collection');
var type = require('./type');

var trackingIdMap = {
    'editor': 'UA-129966929-1',
    'grid': 'UA-129951906-1',
    'calendar': 'UA-129951699-1',
    'chart': 'UA-129983528-1',
    'image-editor': 'UA-129999381-1',
    'component': 'UA-129987462-1'
};
var ms7days = 7 * 24 * 60 * 60 * 1000;

/**
 * Check if the date has passed 7 days
 * @param {number} date - milliseconds
 * @returns {boolean}
 * @ignore
 */
function isExpired(date) {
    var now = new Date().getTime();

    return now - date > ms7days;
}

/**
 * Send hostname on DOMContentLoaded.
 * To prevent hostname set tui.usageStatistics to false.
 * @param {string} applicationId - application id to send
 * @ignore
 */
function sendHostname(applicationId) {
    var url = 'https://www.google-analytics.com/collect';
    var hostname = location.hostname;
    var hitType = 'event';
    var eventCategory = 'use';
    var trackingId = trackingIdMap[applicationId] || trackingIdMap.component;
    var applicationKeyForStorage = 'TOAST UI ' + applicationId + ' for ' + hostname + ': Statistics';
    var date = window.localStorage.getItem(applicationKeyForStorage);

    // skip if the flag is defined and is set to false explicitly
    if (tui.usageStatistics === false) {
        return;
    }

    // skip if not pass seven days old
    if (date && !isExpired(date)) {
        return;
    }

    window.localStorage.setItem(applicationKeyForStorage, new Date().getTime());

    setTimeout(function() {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            imagePing(url, {
                v: 1,
                t: hitType,
                tid: trackingId,
                cid: hostname,
                dp: hostname,
                dh: applicationId,
                el: applicationId,
                ec: eventCategory
            });
        }
    }, 1000);
}

/**
 * Request image ping.
 * @param {String} url url for ping request
 * @param {Object} trackingInfo infos for make query string
 * @returns {HTMLElement}
 * @memberof tui.util
 * @example
 * //-- #1. Get Module --//
 * var util = require('tui-code-snippet'); // node, commonjs
 * var util = tui.util; // distribution file
 *
 * //-- #2. Use property --//
 * util.imagePing('https://www.google-analytics.com/collect', {
 *     v: 1,
 *     t: 'event',
 *     tid: 'trackingid',
 *     cid: 'cid',
 *     dp: 'dp',
 *     dh: 'dh'
 * });
 */
function imagePing(url, trackingInfo) {
    var queryString = collection.map(object.keys(trackingInfo), function(key, index) {
        var startWith = index === 0 ? '' : '&';

        return startWith + key + '=' + trackingInfo[key];
    }).join('');
    var trackingElement = document.createElement('img');

    trackingElement.src = url + '?' + queryString;

    trackingElement.style.display = 'none';
    document.body.appendChild(trackingElement);
    document.body.removeChild(trackingElement);

    return trackingElement;
}

module.exports = {
    imagePing: imagePing,
    sendHostname: sendHostname
};
