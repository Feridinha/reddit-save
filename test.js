// ==UserScript==
// @name         Tampermonkey translation support
// @namespace    http://tampermonkey.net/
// @version      0.4.1
// @description  Tampermonkey translation support
// @match        https://github.com/*/tampermonkey-i18n/*
// @require      https://code.jquery.com/jquery-2.2.0.min.js
// @updateURL    https://gist.github.com/derjanb/5592ff3b7cdc4feabba5/raw/tampermonkey_translation_support.user.js
// @grant        GM_xmlhttpRequest
// @domain       raw.githubusercontent.com
// @domain       jsonformat.com
// @run-at       document-start
// ==/UserScript==

/* global $, GM_xmlhttpRequest, alert */

(function() {
    "use strict";

    window.history.replaceState = window.history.pushState = function(a, b, url) {
        if (window.location.href != url) window.location.href = url;
    };

    if (!window.location.href.match(/https:\/\/github\.com\/.*\/tampermonkey-i18n\/.*\/messages\.json/)) return;

    var getTranslation = function(url) {
        var d = $.Deferred();
        GM_xmlhttpRequest({
            method:   'GET',
            url:      url,
            onload:   function(r) {
                d.resolve(JSON.parse(r.response));
            },
            onerror:  function() {
                d.reject();
            }
        });
        return d.promise();
    };

    var format = function(o) {
        return JSON.stringify(o, null, 4);
    };

    var compare = function(en, la) {
        var ret = {};

        Object.keys(en).forEach(function(k) {
            if (!la[k]) {
                ret[k] = en[k];
                ret[k].message = '>>>' + ret[k].message + '<<<';
            } else {
                var equal = true;

                if (!la[k].placeholders && !en[k].placeholders) {
                    equal = true;
                } else if (!la[k].placeholders || !en[k].placeholders) {
                    equal = false;
                } else {
                    Object.keys(la[k].placeholders).forEach(function(kk) {
                        if (!la[k].placeholders.hasOwnProperty(kk)) return;
                        equal &= !!en[k].placeholders[kk];
                    });
                }

                if (equal) {
                    ret[k] = la[k];
                } else {
                    ret[k] = en[k];
                    ret[k].message = '>>>' + ret[k].message + '<<<';
                }
            }
        });

        return ret;
    };

    var clean = function(en, la) {
        var ret = {};

        Object.keys(la).forEach(function(k) {
            if (!en[k] || la[k].message == en[k].message) {
                // ignore
            } else {
                ret[k] = la[k];
            }
        });

        return ret;
    };

    var determineLocation = function(url) {
        var m = url.match(/^https:\/\/github\.com\/([^\/]+)\/tampermonkey-i18n\/(?:blob|edit)\/master\/([a-zA-Z_-]+)\/messages\.json.*/);
        return m ? [ m[1], m[2] ] : null;
    };

    var createUrl = function(owner, language) {
        return 'https://raw.githubusercontent.com/' + owner + '/tampermonkey-i18n/master/' + language + '/messages.json';
    };

    $(document).ready(function() {
        var button, button2;
        $('.BtnGroup')
        .append((button = $('<a href="#" class="btn btn-sm " id="translation-helper">Adjust to English translation</a>')))
        .append((button2 = $('<a href="#" class="btn btn-sm " id="translation-helper">Remove English strings</a>')));

        button.click(function() {
            var lo = determineLocation(window.location.href);
            if (!lo || !lo[0] || !lo[1]) {
                alert('Unable to determine location :(');
                return;
            }
            var ow = lo[0];
            var la = lo[1];

            var lang, en;
            getTranslation(createUrl(ow, la))
            .fail(function() {
                alert('Unable to retrieve language file!');
            })
            .then(function(r) {
                lang = r;
                return getTranslation(createUrl('Tampermonkey', 'en'));
            })
            .fail(function() {
                alert('Unable to retrieve original file!');
            })
            .then(function(r) {
                en = r;
                var result = compare(en, lang);
                var text = format(result);

                document.body.textContent = '';
                var ta;

                $(document.body).append((ta = $('<textarea style="height: 100vh; width: 100vw;">')));
                ta.text(text);
            });
        });

        button2.click(function() {
            var lo = determineLocation(window.location.href);
            if (!lo || !lo[0] || !lo[1]) {
                alert('Unable to determine location :(');
                return;
            }
            var ow = lo[0];
            var la = lo[1];

            var lang, en;
            getTranslation(createUrl(ow, la))
            .fail(function() {
                alert('Unable to retrieve language file!');
            })
            .then(function(r) {
                lang = r;
                return getTranslation(createUrl('Tampermonkey', 'en'));
            })
            .fail(function() {
                alert('Unable to retrieve original file!');
            })
            .then(function(r) {
                en = r;
                var result = clean(en, lang);
                var text = format(result);

                document.body.textContent = '';
                var ta;

                $(document.body).append((ta = $('<textarea style="height: 100vh; width: 100vw;">')));
                ta.text(text);
            });
        });
    });
})();
