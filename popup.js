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

function addToFontSize(val) {
    var script = `val = ` + val + `;
for (var el of els) {
    var old_size = window.getComputedStyle(el, null).getPropertyValue('font-size').replace('px','');
    var new_size = parseFloat(old_size) + val;
    if (new_size > 0) {
        el.style.fontSize = new_size + 'px';
        el.style.lineHeight = '100%';
    }
}`;
    chrome.tabs.executeScript({
        code: script
    });
}

function increaseFontSize() {
    addToFontSize(4);
}

function decreaseFontSize() {
    addToFontSize(-4);
}

function changeFontColor(colors_str) {
    var script = `var colors_str = "` + colors_str + `";
console.log("Updating Font Colors...");
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

/**
 * Gets the saved background color for url.
 *
 * @param {string} url URL whose background color is to be retrieved.
 * @param {function(string)} callback called with the saved background color for
 *     the given url on success, or a falsy value if no color is retrieved.
 */
function getSavedBackgroundColor(url, callback) {
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
  // for chrome.runtime.lastError to ensure correctness even when the API call
  // fails.
  chrome.storage.sync.get(url, (items) => {
    callback(chrome.runtime.lastError ? null : items[url]);
  });
}

/**
 * Sets the given background color for url.
 *
 * @param {string} url URL for which background color is to be saved.
 * @param {string} color The background color to be saved.
 */
function saveBackgroundColor(url, color) {
  var items = {};
  items[url] = color;
  // See https://developer.chrome.com/apps/storage#type-StorageArea. We omit the
  // optional callback since we don't need to perform any action once the
  // background color is saved.
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
  var updated_font_colors = false;
    
  getCurrentTabUrl((url) => {
    var dropdown = document.getElementById('dropdown');

    // Load the saved background color for this page and modify the dropdown
    // value, if needed.
    getSavedBackgroundColor(url, (savedColor) => {
      if (savedColor) {
        changeBackgroundColor(savedColor);
        if (!updated_font_colors) {
            changeFontColor('#7D0000|#00007D');
            updated_font_colors = true;
        }
        dropdown.value = savedColor;
      }
    });

    // Ensure the background color is changed and saved when the dropdown
    // selection changes.
    dropdown.addEventListener('change', () => {
      changeBackgroundColor(dropdown.value);
      if (!updated_font_colors) {
          changeFontColor('#7D0000|#00007D');
          updated_font_colors = true;
      }
      saveBackgroundColor(url, dropdown.value);
    });
      
    var incr_font_size = document.getElementById('incr_font_size');
    incr_font_size.addEventListener('click', () => {
        increaseFontSize();
    });
      
    var decr_font_size = document.getElementById('decr_font_size');
    decr_font_size.addEventListener('click', () => {
        decreaseFontSize();
    }); 
  });
});