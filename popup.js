// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, (tabs) => {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * Change the background color of the current page.
 *
 * @param {string} color The new background color.
 */
function changeBackgroundColor(color) {
  var script = `color = "` + color + `";
console.log("Changing background color...");
document.body.style.backgroundColor=color;
var els = document.getElementsByTagName("p");
for (var el of els) {
    el.style.backgroundColor=color;
};`
  // See https://developer.chrome.com/extensions/tabs#method-executeScript.
  // chrome.tabs.executeScript allows us to programmatically inject JavaScript
  // into a page. Since we omit the optional first argument "tabId", the script
  // is inserted into the active tab of the current window, which serves as the
  // default.
  chrome.tabs.executeScript({
    code: script
  });
}

function setFontSize(val) {
    var script = `val = ` + val + `;
console.log("Setting font size to " + val + "...");
var els = document.getElementsByTagName('p');
for (var el of els) {
        el.style.fontSize = val + "px";
        el.style.lineHeight = '100%';
}`;
    chrome.tabs.executeScript({
        code: script
    });
}

function setFontSizeInExt(size) {
    var right_eye_test = document.getElementById('right_eye_test');
    right_eye_test.style.fontSize = size + "px";
    var left_eye_test = document.getElementById('left_eye_test');
    left_eye_test.style.fontSize = size + "px";
}

function increaseFontSizeInExt(settings) {
    settings.font_size += 4;
    setFontSizeInExt(settings.font_size);
}

function decreaseFontSizeInExt(settings) {
    if (settings.font_size >= 8) {
        settings.font_size -= 4;
        setFontSizeInExt(settings.font_size);
    }
}

function changeFontColor(colors_str) {
    var script = `var colors_str = "` + colors_str + `";
console.log("Changing font color...");
var colors = colors_str.split('|');
var els = document.getElementsByTagName('p');
for (var el of els) {
    var all_text = el.innerHTML.split('>');
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
    for (var i_text = 0; i_text < all_text.length; i_text++) {
    	var text = all_text[i_text];
        var ind = text.indexOf('<');
        var content;
        if (ind == -1) {
            content = text;
        } else {
            content = text.substring(0, ind);
        }
        if (content.length > 0) {
            var all_content_text = content.split(' ');
            for (var i_word = 0; i_word < all_content_text.length; i_word++) {
        	   var word = all_content_text[i_word];
                span = document.createElement('span');
                span.innerHTML = word+' ';
                span.style.color = colors[Math.floor(Math.random() * colors.length)];
                span.style.textShadow = 'none';
                el.appendChild(span);
            }
        }
        if (ind != -1) {
        	span = document.createElement('span');
        	span.innerHTML = text.substr(ind) + '>';
        	el.appendChild(span);
        }
    }
}`
    chrome.tabs.executeScript({
        code: script
    });
}

function settingsToString(settings) {
    return settings.colors_on + "|" + settings.font_size;
}

function stringToSettings(str) {
    var settings = {};
    var arr = str.split('|');
    settings.colors_on = arr[0] == 'true';
    settings.font_size = parseInt(arr[1]);
    return settings;
}

// Gets the saved settings for a given domain.
function getSavedOrDefaultSettings(hostname, callback) {
    chrome.storage.sync.get(hostname, (items) => {
        var default_settings = {
            font_size: 20,
            colors_on: false
        }
        callback(chrome.runtime.lastError ? default_settings : (items[hostname] === undefined ? default_settings : stringToSettings(items[hostname])));
    });
}

// Saves the settings for a given domain.
function saveSettings(hostname, settings) {
    var items = {};
    items[hostname] = settingsToString(settings);
    chrome.storage.sync.set(items);
}

// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
document.addEventListener('DOMContentLoaded', () => {

  var settings = {
      font_size: 20,
      colors_on: false
  };
    
  getCurrentTabUrl((url) => {
    var parser = document.createElement('a');
    parser.href = url;
    var hostname = parser.hostname;
    document.getElementById("domain").innerHTML = hostname;
      
    // Load the saved settings for this host.
    getSavedOrDefaultSettings(hostname, (savedSettings) => {
        settings.colors_on = savedSettings.colors_on;
        settings.font_size = savedSettings.font_size;
        setFontSize(savedSettings.font_size);
        setFontSizeInExt(savedSettings.font_size);
        if (savedSettings.colors_on) {
            changeBackgroundColor('#191919');
            changeFontColor('#7D0000|#00007D');
        }
    });
      
    var incr_font_size = document.getElementById('incr_font_size');
    incr_font_size.addEventListener('click', () => {
        increaseFontSizeInExt(settings);
    });
      
    var decr_font_size = document.getElementById('decr_font_size');
    decr_font_size.addEventListener('click', () => {
        decreaseFontSizeInExt(settings);
    });
      
    var update_page = document.getElementById('update_page');
    update_page.addEventListener('click', () => {
        setFontSize(settings.font_size);
        changeBackgroundColor('#191919');
        changeFontColor('#7D0000|#00007D');
        settings.colors_on = true;
    });
      
    var save_settings = document.getElementById('save_settings');
    save_settings.addEventListener('click', () => {
       saveSettings(hostname, settings); 
    });
  });
});