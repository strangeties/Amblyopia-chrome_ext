// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var changing_bg_color = false;
var changing_font = false;

function DisableUpdatePage() {
    var update_page_button = document.getElementById('update_page');
    update_page_button.disabled = true;
    update_page_button.style.color = 'rgb(200,200,200)';
}

function EnableUpdatePage() {
    var update_page_button = document.getElementById('update_page');
    update_page_button.disabled = false;
    update_page_button.style.color = 'rgb(0,0,0)';
}

/**
 * Change the background color of the current page.
 *
 * @param {string} color The new background color.
 */
function changeBackgroundColor(r, g, b) {
    DisableUpdatePage();
    changing_bg_color = true;
    color = "rgb(" + r + "," + g + "," + b + ")";
  var script = `color = "` + color + `";
console.log("Changing background color to " + color + "...");
document.body.style.backgroundColor=color;
var els = document.getElementsByTagName("p");
for (var el of els) {
    el.style.backgroundColor=color;
}
console.log("Done changing background color to " + color + ".");`;
  chrome.tabs.executeScript({
    code: script
  }, function() {
      changing_bg_color = false;
      if (!(changing_bg_color || changing_font)) {
          EnableUpdatePage();
      }
  });
}

function setBgColorInExt(r, g, b) {
    color = "rgb(" + r + "," + g + "," + b + ")";
    document.getElementById("left_eye_test").style.backgroundColor = color;
    document.getElementById("right_eye_test").style.backgroundColor = color;
}

function changeFont(font_size, colors_str, first_run) {
    DisableUpdatePage();
    changing_font = true;
    var script = first_run ? `var colors_str = "` + colors_str + `";
var font_size_str = "` + font_size + `px";
console.log("Changing font colors to " + colors_str + "...");
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
                span.style.fontSize = font_size_str;
                span.style.lineHeight = font_size_str;
                el.appendChild(span);
            }
        }
        if (ind != -1) {
        	span = document.createElement('span');
        	span.innerHTML = text.substr(ind) + '>';
        	el.appendChild(span);
        }
    }
}
console.log("Done changing font colors to " + colors + ".");` 
    :
    `var colors_str = "` + colors_str + `";
var font_size_str = "` + font_size + `px";
console.log("Changing font colors to " + colors_str + "...");
var colors = colors_str.split('|');
var els = document.getElementsByTagName('p');
for (var el of els) {
    var children = el.children;
    for (var i = 0; i < children.length; i++) {
        var chil = children[i];
        if (chil.tagName.toLowerCase() == "span") {
            chil.style.color = colors[Math.floor(Math.random() * colors.length)];
            chil.style.fontSize = font_size_str;
            chil.style.lineHeight = font_size_str;
        }
    }
}
console.log("Done changing font colors to " + colors + ".");`;
    chrome.tabs.executeScript({
        code: script
    }, function() {
      changing_font = false;
      if (!(changing_bg_color || changing_font)) {
          EnableUpdatePage();
      }
    });
}

function setLeColorInExt(r, g, b) {
    color = "rgb(" + r + "," + g + "," + b + ")";
    document.getElementById("left_eye_test").style.color = color;
}

function setReColorInExt(r, g, b) {
    color = "rgb(" + r + "," + g + "," + b + ")";
    document.getElementById("right_eye_test").style.color = color;
}

function setFontSizeInExt(size) {
    var right_eye_test = document.getElementById('right_eye_test');
    right_eye_test.style.fontSize = size + "px";
    var left_eye_test = document.getElementById('left_eye_test');
    left_eye_test.style.fontSize = size + "px";
}

function settingsToString(settings) {
    return settings.colors_on + "|" + 
        settings.font_size + "|" + 
        settings.bg_r + "|" + 
        settings.bg_g + "|" + 
        settings.bg_b + "|" + 
        settings.le_r + "|" +
        settings.le_g + "|" +
        settings.le_b + "|" +
        settings.re_r + "|" +
        settings.re_g + "|" +
        settings.re_b;
}

function stringToSettings(str) {
    var settings = {};
    var arr = str.split('|');
    settings.colors_on = arr[0] == 'true';
    settings.font_size = parseInt(arr[1]);
    settings.bg_r = parseInt(arr[2]);
    settings.bg_g = parseInt(arr[3]);
    settings.bg_b = parseInt(arr[4]);
    settings.le_r = parseInt(arr[5]);
    settings.le_g = parseInt(arr[6]);
    settings.le_b = parseInt(arr[7]);
    settings.re_r = parseInt(arr[8]);
    settings.re_g = parseInt(arr[9]);
    settings.re_b = parseInt(arr[10]);
    return settings;
}

// Gets the saved settings for a given domain.
function getSavedOrDefaultSettings(hostname, callback) {
    chrome.storage.sync.get(hostname, (items) => {
        var default_settings = {
            font_size: 20,
            colors_on: false,
            bg_r: 25,
            bg_g: 25,
            bg_b: 25,
            le_r: 255,
            le_g: 0,
            le_b: 0,
            re_r: 0,
            re_g: 0,
            re_b: 255
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

// Gets saved update settings for a given tab.
function getUpdatedPageSettings(id, callback) {
    chrome.storage.local.get(id, (updated_page) => {
        callback(chrome.runtime.lastError ? false : (updated_page[id] === undefined ? false : updated_page[id]));
    });
}

// Saves update settings for a given tab.
function saveUpdatePageSettings(id, updated) {
    var updated_page = {};
    updated_page[id] = updated;
    chrome.storage.local.set(updated_page);
}

chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab) {
      saveUpdatePageSettings(tabId, false);
  }
);

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
      colors_on: false,
      bg_r: 25,
      bg_g: 25,
      bg_b: 25,
      le_r: 255,
      le_g: 0,
      le_b: 0,
      re_r: 0,
      re_g: 0,
      re_b: 255
    };
    
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var parser = document.createElement('a');
        parser.href = tabs[0].url;
        var hostname = parser.hostname;
        document.getElementById("domain").innerHTML = hostname; 
        
        var update_page = document.getElementById('update_page'); 
        
        var font_size_slider = document.getElementById("font_size_slider");
        var selected_font_size = document.getElementById("selected_font_size");
      
        var bg_r_slider = document.getElementById("bg_r_slider");  
        var bg_g_slider = document.getElementById("bg_g_slider");  
        var bg_b_slider = document.getElementById("bg_b_slider"); 
        var selected_bg_r = document.getElementById("selected_bg_r");  
        var selected_bg_g = document.getElementById("selected_bg_g");  
        var selected_bg_b = document.getElementById("selected_bg_b"); 

        var le_r_slider = document.getElementById("le_r_slider");  
        var le_g_slider = document.getElementById("le_g_slider");  
        var le_b_slider = document.getElementById("le_b_slider"); 
        var selected_le_r = document.getElementById("selected_le_r");  
        var selected_le_g = document.getElementById("selected_le_g");  
        var selected_le_b = document.getElementById("selected_le_b"); 

        var re_r_slider = document.getElementById("re_r_slider");  
        var re_g_slider = document.getElementById("re_g_slider");  
        var re_b_slider = document.getElementById("re_b_slider"); 
        var selected_re_r = document.getElementById("selected_re_r");  
        var selected_re_g = document.getElementById("selected_re_g");  
        var selected_re_b = document.getElementById("selected_re_b");
      
        // Load the saved settings for this host.
        getSavedOrDefaultSettings(hostname, (savedSettings) => {
            if (!isNaN(savedSettings.colors_on)) {
                settings.colors_on = savedSettings.colors_on;
            }
            if (!isNaN(savedSettings.font_size)) {
                settings.font_size = savedSettings.font_size;
            }
            if (!isNaN(savedSettings.bg_r)) {
                settings.bg_r = savedSettings.bg_r;
            }
            if (!isNaN(savedSettings.bg_g)) {
                settings.bg_g = savedSettings.bg_g;
            }
            if (!isNaN(savedSettings.bg_b)) {
                settings.bg_b = savedSettings.bg_b;
            }
            if (!isNaN(savedSettings.le_r)) {
                settings.le_r = savedSettings.le_r;
            }
            if (!isNaN(savedSettings.le_g)) {
                settings.le_g = savedSettings.le_g;
            }
            if (!isNaN(savedSettings.le_b)) {
                settings.le_b = savedSettings.le_b;
            }
            if (!isNaN(savedSettings.re_r)) {
                settings.re_r = savedSettings.re_r;
            }
            if (!isNaN(savedSettings.re_g)) {
                settings.re_g = savedSettings.re_g;
            }
            if (!isNaN(savedSettings.re_b)) {
                settings.re_b = savedSettings.re_b;
            }
            setFontSizeInExt(savedSettings.font_size);
            setBgColorInExt(settings.bg_r, settings.bg_g, settings.bg_b);
            setLeColorInExt(settings.le_r, settings.le_g, settings.le_b);
            setReColorInExt(settings.re_r, settings.re_g, settings.re_b);
            bg_r_slider.value = settings.bg_r;
            selected_bg_r.innerHTML = settings.bg_r;
            bg_g_slider.value = settings.bg_g;
            selected_bg_g.innerHTML = settings.bg_g;
            bg_b_slider.value = settings.bg_b;
            selected_bg_b.innerHTML = settings.bg_b;

            le_r_slider.value = settings.le_r;
            selected_le_r.innerHTML = settings.le_r;
            le_g_slider.value = settings.le_g;
            selected_le_g.innerHTML = settings.le_g;
            le_b_slider.value = settings.le_b;
            selected_le_b.innerHTML = settings.le_b;
            re_r_slider.value = settings.re_r;
            selected_re_r.innerHTML = settings.re_r;
            re_g_slider.value = settings.re_g;
            selected_re_g.innerHTML = settings.re_g;
            re_b_slider.value = settings.re_b;
            selected_re_b.innerHTML = settings.re_b;

            font_size_slider.value = savedSettings.font_size;
            selected_font_size.innerHTML = savedSettings.font_size;

            getUpdatedPageSettings(tabs[0].id.toString(), (updated_tab_id) => {
                var script = `console.log("tab ID: ` + tabs[0].id + `, updated: ` + updated_tab_id + `");`;
                chrome.tabs.executeScript({
                    code: script
                });
                if (!updated_tab_id) {
                        changeBackgroundColor(settings.bg_r, settings.bg_g, settings.bg_b);
                        var le_color = "rgb(" + settings.le_r + "," + settings.le_g + "," + settings.le_b + ")";
                        var re_color = "rgb(" + settings.re_r + "," + settings.re_g + "," + settings.re_b + ")";
                        changeFont(settings.font_size, le_color + "|" + re_color, true);
                        saveUpdatePageSettings(tabs[0].id.toString(), true);
                    }
                }     
            });
        });

        font_size_slider.addEventListener('change', () => {
            settings.font_size = font_size_slider.value;
            setFontSizeInExt(settings.font_size);
        });

        font_size_slider.addEventListener('input', () => {
            selected_font_size.innerHTML = font_size_slider.value;
        })    

        bg_r_slider.addEventListener('change', () => {
            settings.bg_r = bg_r_slider.value;
            setBgColorInExt(bg_r_slider.value, bg_g_slider.value, bg_b_slider.value);
        });

        bg_r_slider.addEventListener('input', () => {
            selected_bg_r.innerHTML = bg_r_slider.value;
        });

        bg_g_slider.addEventListener('change', () => {
            settings.bg_g = bg_g_slider.value;
            selected_bg_g.innerHTML = settings.bg_g;
            setBgColorInExt(bg_r_slider.value, bg_g_slider.value, bg_b_slider.value);
        });

        bg_g_slider.addEventListener('input', () => {
            selected_bg_g.innerHTML = bg_g_slider.value;
        });

        bg_b_slider.addEventListener('change', () => {
            settings.bg_b = bg_b_slider.value;
            selected_bg_b.innerHTML = settings.bg_b;
            setBgColorInExt(bg_r_slider.value, bg_g_slider.value, bg_b_slider.value);
        });

        bg_b_slider.addEventListener('input', () => {
            selected_bg_b.innerHTML = bg_b_slider.value;
        });

        le_r_slider.addEventListener('change', () => {
            settings.le_r = le_r_slider.value;
            setLeColorInExt(le_r_slider.value, le_g_slider.value, le_b_slider.value);
        });

        le_r_slider.addEventListener('input', () => {
            selected_le_r.innerHTML = le_r_slider.value;
        });

        le_g_slider.addEventListener('change', () => {
            settings.le_g = le_g_slider.value;
            selected_le_g.innerHTML = settings.le_g;
            setLeColorInExt(le_r_slider.value, le_g_slider.value, le_b_slider.value);
        });

        le_g_slider.addEventListener('input', () => {
            selected_le_g.innerHTML = le_g_slider.value;
        });

        le_b_slider.addEventListener('change', () => {
            settings.le_b = le_b_slider.value;
            selected_le_b.innerHTML = settings.le_b;
            setLeColorInExt(le_r_slider.value, le_g_slider.value, le_b_slider.value);
        });

        le_b_slider.addEventListener('input', () => {
            selected_le_b.innerHTML = le_b_slider.value;
        });

        re_r_slider.addEventListener('change', () => {
            settings.re_r = re_r_slider.value;
            setReColorInExt(re_r_slider.value, re_g_slider.value, re_b_slider.value);
        });

        re_r_slider.addEventListener('input', () => {
            selected_re_r.innerHTML = re_r_slider.value;
        });

        re_g_slider.addEventListener('change', () => {
            settings.re_g = re_g_slider.value;
            selected_re_g.innerHTML = settings.re_g;
            setReColorInExt(re_r_slider.value, re_g_slider.value, re_b_slider.value);
        });

        re_g_slider.addEventListener('input', () => {
            selected_re_g.innerHTML = re_g_slider.value;
        });

        re_b_slider.addEventListener('change', () => {
            settings.re_b = re_b_slider.value;
            selected_re_b.innerHTML = settings.re_b;
            setReColorInExt(re_r_slider.value, re_g_slider.value, re_b_slider.value);
        });

        re_b_slider.addEventListener('input', () => {
            selected_re_b.innerHTML = re_b_slider.value;
        });

        var update_page = document.getElementById('update_page');
        update_page.addEventListener('click', () => {
            changeBackgroundColor(settings.bg_r, settings.bg_g, settings.bg_b);
            var le_color = "rgb(" + settings.le_r + "," + settings.le_g + "," + settings.le_b + ")";
            var re_color = "rgb(" + settings.re_r + "," + settings.re_g + "," + settings.re_b + ")";
            getUpdatedPageSettings(tabs[0].id.toString(), (updated_tab_id) => {
                changeFont(settings.font_size, le_color + "|" + re_color, !updated_tab_id);
            });
            settings.colors_on = true;
        });

        var save_settings = document.getElementById('save_settings');
        save_settings.addEventListener('click', () => {
           saveSettings(hostname, settings); 
        });
    });
});