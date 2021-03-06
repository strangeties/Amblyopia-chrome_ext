// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var kFontSizeMap = {
    extra_small: '12px',
    small: '18px',
    medium: '28px',
    large: '42px',
    extra_large: '64px',
    immense: '96px'
};

var kBgColorMap = {
    black: 'rgb(25,25,25)',
    dark_grey: 'rgb(90,90,90)',
    grey: 'rgb(120,120,120)',
    light_grey: 'rgb(180,180,180)'
};

var kFontColorMap = {
    red: 'rgb(255,0,0)',
    dimmer_red: 'rgb(180,0,0)',
    blue: 'rgb(0,0,255)',
    dimmer_blue: 'rgb(0,0,180)'
};

var changing_bg_color = false;
var changing_font = false;

function DisableUpdatePage() {
    var update_page_button = document.getElementById('update_page');
    var save_settings_button = document.getElementById('save_settings');
    update_page_button.disabled = true;
    update_page_button.style.cursor = 'default';
    save_settings_button.disabled = true;
    save_settings_button.style.cursor = 'default';  
    document.body.style.cursor==='wait';
}

function EnableUpdatePage() {
    var update_page_button = document.getElementById('update_page');
    var save_settings_button = document.getElementById('save_settings');
    update_page_button.disabled = false;
    update_page_button.style.cursor = 'pointer';
    save_settings_button.disabled = false;
    save_settings_button.style.cursor = 'pointer';
    document.body.style.cursor==='auto';
}

/*
 * Change the background color of the current page.
 *
 * @param {string} color The new background color.
 */
function changeBackgroundColor(color) {
    DisableUpdatePage();
    changing_bg_color = true;
    color = kBgColorMap[color];
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

function setBgColorInExt(color) {
    document.getElementById("left_eye_test").style.backgroundColor = kBgColorMap[color];
    document.getElementById("right_eye_test").style.backgroundColor = kBgColorMap[color];
}

function changeFont(font_size, colors_str, first_run) {
    DisableUpdatePage();
    changing_font = true;
    var script = first_run ? `var colors_str = "` + colors_str + `";
var font_size_str = "` + font_size + `";
console.log("Changing font colors to " + colors_str + "...");
console.log("Changing font size to " + font_size_str + "...");
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
                span.innerHTML = word+'&nbsp;';
                span.style.color = colors[Math.floor(Math.random() * colors.length)];
                span.style.textShadow = 'none';
                span.style.fontSize = font_size_str;
                span.style.lineHeight = font_size_str;
                span.style.display = 'inline-block';
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
var font_size_str = "` + font_size + `";
console.log("Changing font colors to " + colors_str + "...");
console.log("Changing font size to " + font_size_str + "...");
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
            chil.style.display = 'inline-block';
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

function setLeColorInExt(color) {
    document.getElementById("left_eye_test").style.color = kFontColorMap[color];
}

function setReColorInExt(color) {
    document.getElementById("right_eye_test").style.color = kFontColorMap[color];
}

function setFontSizeInExt(size) {
    var script = `console.log("setting font size in extension: ` + size + `");`;
    chrome.tabs.executeScript({
        code: script
    });
    var right_eye_test = document.getElementById('right_eye_test');
    right_eye_test.style.fontSize = kFontSizeMap[size];
    var left_eye_test = document.getElementById('left_eye_test');
    left_eye_test.style.fontSize = kFontSizeMap[size];
}

function settingsToString(settings) {
    return settings.font_size + "|" + 
        settings.bg_color + "|" +
        settings.left_color + "|" +
        settings.right_color;
}

function stringToSettings(str) {
    var settings = {};
    var script = `console.log("parsing settings string, ` + str + `");`;
    chrome.tabs.executeScript({
        code: script
    });
    var arr = str.split('|');
    settings.font_size = arr[0];
    settings.bg_color = arr[1];
    settings.left_color = arr[2];
    settings.right_color = arr[3];
    return settings;
}

// Gets the saved settings for a given domain.
function getSavedOrDefaultSettings(callback) {
    chrome.storage.sync.get((items) => {
        var default_settings = {
            font_size: 'medium',
            bg_color: 'black',
            left_color: 'dimmer_red',
            right_color: 'dimmer_blue'
        }
        callback(chrome.runtime.lastError ? default_settings : (items["saved_settings"] === undefined ? default_settings : stringToSettings(items["saved_settings"])));
    });
}

// Saves the settings for a given domain.
function saveSettings(settings) {
    var items = {};
    items["saved_settings"] = settingsToString(settings);
    chrome.storage.sync.set(items);
}

// Gets toggle on.
function getToggleOn(callback) {
    chrome.storage.sync.get((items) => {
        callback(chrome.runtime.lastError ? false : items["toggle_on"] === undefined ? false : items["toggle_on"]);
    });
}

// Sets toggle on.
function saveToggleOn(toggle_on) {
    var script = `console.log("saving toggle on setting: ` + toggle_on + `");`;
    chrome.tabs.executeScript({
        code: script
    });
    
    var items = {};
    items["toggle_on"] = toggle_on;
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
        font_size: 'medium',
        bg_color: 'black',
        left_color: 'dimmer_red',
        right_color: 'dimmer_blue'
    };
    
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        
        var update_page = document.getElementById('update_page'); 
        
        var extra_small_size_button = document.getElementById("extra_small_size_button");
        var small_size_button = document.getElementById("small_size_button");
        var medium_size_button = document.getElementById("medium_size_button");
        var large_size_button = document.getElementById("large_size_button");
        var extra_large_size_button = document.getElementById("extra_large_size_button");
        var immense_size_button = document.getElementById("immense_size_button");
      
        var black_bg_color_button = document.getElementById("black_bg_color_button");
        var dark_grey_bg_color_button = document.getElementById("dark_grey_bg_color_button");
        var grey_bg_color_button = document.getElementById("grey_bg_color_button");
        var light_grey_bg_color_button = document.getElementById("light_grey_bg_color_button");
        
        var red_left_eye_color_button = document.getElementById("red_left_eye_color_button");
        var dimmer_red_left_eye_color_button = document.getElementById("dimmer_red_left_eye_color_button");
        
        var blue_right_eye_color_button = document.getElementById("blue_right_eye_color_button");
        var dimmer_blue_right_eye_color_button = document.getElementById("dimmer_blue_right_eye_color_button");
        
        var toggle_on_slider = document.getElementById("toggle_on");
        
        var toggle_on = false;
        getToggleOn((savedToggleOn) => {
           toggle_on = savedToggleOn;
            
            var script = `console.log("getting toggle on setting: ` + savedToggleOn + `");`;
            chrome.tabs.executeScript({
                code: script
            });
            toggle_on_slider.checked = toggle_on;

            // Load the saved settings for this host.
            getSavedOrDefaultSettings((savedSettings) => {
                var script = `console.log("parsed saved settings: ` + savedSettings.font_size + `|` + savedSettings.bg_color + `|` + savedSettings.left_color + `|` + savedSettings.right_color + `");`;
                chrome.tabs.executeScript({
                    code: script
                });
                
                if (savedSettings.font_size) {
                    var script = `console.log("savedSettings.font_size is not null!");`;
                    chrome.tabs.executeScript({
                        code: script
                    });
                    settings.font_size = savedSettings.font_size;
                } else {
                    var script = `console.log("savedSettings.font_size is null: ` + savedSettings.font_size + `");`;
                    chrome.tabs.executeScript({
                        code: script
                    });
                }
                if (savedSettings.bg_color) {
                    settings.bg_color = savedSettings.bg_color;
                }
                if (savedSettings.left_color) {
                    settings.left_color = savedSettings.left_color;
                }
                if (savedSettings.right_color) {
                    settings.right_color = savedSettings.right_color;
                }
                
                var script = `console.log("parsed settings: ` + settings.font_size + `|` + settings.bg_color + `|` + settings.left_color + `|` + settings.right_color + `");`;
                chrome.tabs.executeScript({
                    code: script
                });
                
                setFontSizeInExt(settings.font_size);
                setBgColorInExt(settings.bg_color);
                setLeColorInExt(settings.left_color);
                setReColorInExt(settings.right_color);

                if (settings.font_size == 'extra_small') {
                    extra_small_size_button.checked = true;
                } else if (settings.font_size == 'small') {
                    small_size_button.checked = true;
                } else if (settings.font_size == 'medium') {
                    medium_size_button.checked = true;
                } else if (settings.font_size == 'large') {
                    large_size_button.checked = true;
                } else if (settings.font_size == 'extra_large') {
                    extra_large_size_button.checked = true;
                } else if (settings.font_size == 'immense') {
                    immense_size_button.checked = true;
                }
                
                if (settings.bg_color == 'black') {
                    black_bg_color_button.checked = 'true';
                } else if (settings.bg_color == 'dark_grey') {
                    dark_grey_bg_color_button.checked = 'true';
                } else if (settings.bg_color == 'grey') {
                    grey_bg_color_button.checked = 'true';
                } else if (settings.bg_color == 'light_grey') {
                    light_grey_bg_color_button.checked = 'true';
                }
                
                if (settings.left_color == 'red') {
                    red_left_eye_color_button.checked = 'true';
                } else if (settings.left_color == 'dimmer_red') {
                    dimmer_red_left_eye_color_button.checked = 'true';
                }
                
                if (settings.right_color == 'blue') {
                    blue_right_eye_color_button.checked = 'true';
                } else if (settings.right_color == 'dimmer_blue') {
                    dimmer_blue_right_eye_color_button.checked = 'true';
                }

                getUpdatedPageSettings(tabs[0].id.toString(), (updated_tab_id) => {
                    var script = `console.log("tab ID: ` + tabs[0].id + `, updated: ` + updated_tab_id + `");`;
                    chrome.tabs.executeScript({
                        code: script
                    });
                    if (!updated_tab_id) {
                        if (toggle_on_slider.checked) {
                            changeBackgroundColor(settings.bg_color);
                            changeFont(kFontSizeMap[settings.font_size], kFontColorMap[settings.left_color] + "|" + kFontColorMap[settings.right_color], true);
                            saveUpdatePageSettings(tabs[0].id.toString(), true);
                        }
                    }     
                });
            });
            
            extra_small_size_button.addEventListener('click', () => {
                settings.font_size = 'extra_small';
                setFontSizeInExt(settings.font_size);
            });
            
            small_size_button.addEventListener('click', () => {
                settings.font_size = 'small'
                setFontSizeInExt(settings.font_size);
            });
            
            medium_size_button.addEventListener('click', () => {
                settings.font_size = 'medium'
                setFontSizeInExt(settings.font_size);
            });
            
            large_size_button.addEventListener('click', () => {
                settings.font_size = 'large'
                setFontSizeInExt(settings.font_size);
            });
            
            extra_large_size_button.addEventListener('click', () => {
                settings.font_size = 'extra_large'
                setFontSizeInExt(settings.font_size);
            });
            
            immense_size_button.addEventListener('click', () => {
                settings.font_size = 'immense'
                setFontSizeInExt(settings.font_size);
            });
            
            black_bg_color_button.addEventListener('click', () => {
                settings.bg_color = 'black';
                setBgColorInExt(settings.bg_color);
            });
            
            dark_grey_bg_color_button.addEventListener('click', () => {
                settings.bg_color = 'dark_grey';
                setBgColorInExt(settings.bg_color);
            });
            
            grey_bg_color_button.addEventListener('click', () => {
                settings.bg_color = 'grey';
                setBgColorInExt(settings.bg_color);
            });
            
            light_grey_bg_color_button.addEventListener('click', () => {
                settings.bg_color = 'light_grey';
                setBgColorInExt(settings.bg_color);
            });
            
            red_left_eye_color_button.addEventListener('click', () => {
                settings.left_color = 'red';
                setLeColorInExt(settings.left_color);
            });
            
            dimmer_red_left_eye_color_button.addEventListener('click',  () => {
                settings.left_color = 'dimmer_red';
                setLeColorInExt(settings.left_color);
            })
            
            blue_right_eye_color_button.addEventListener('click', () => {
                settings.right_color = 'blue';
                setReColorInExt(settings.right_color);
            });
            
            dimmer_blue_right_eye_color_button.addEventListener('click',  () => {
                settings.right_color = 'dimmer_blue';
                setReColorInExt(settings.right_color);
            })

            toggle_on_slider.addEventListener('click', () => {
                saveToggleOn(toggle_on_slider.checked);
            })

            var update_page = document.getElementById('update_page');
            update_page.addEventListener('click', () => {
                changeBackgroundColor(settings.bg_color);
                getUpdatedPageSettings(tabs[0].id.toString(), (updated_tab_id) => {
                    var script = `console.log("tab ID: ` + tabs[0].id + `, updated: ` + updated_tab_id + `");`;
                    chrome.tabs.executeScript({
                        code: script
                    });
                    changeFont(kFontSizeMap[settings.font_size], kFontColorMap[settings.left_color] + "|" + kFontColorMap[settings.right_color], !updated_tab_id);
                    saveUpdatePageSettings(tabs[0].id.toString(), true);
                });
            });

            var save_settings = document.getElementById('save_settings');
            save_settings.addEventListener('click', () => {
                changeBackgroundColor(settings.bg_color);
                getUpdatedPageSettings(tabs[0].id.toString(), (updated_tab_id) => {
                    var script = `console.log("tab ID: ` + tabs[0].id + `, updated: ` + updated_tab_id + `");`;
                    chrome.tabs.executeScript({
                        code: script
                    });
                    changeFont(kFontSizeMap[settings.font_size], kFontColorMap[settings.left_color] + "|" + kFontColorMap[settings.right_color], !updated_tab_id);
                    saveUpdatePageSettings(tabs[0].id.toString(), true);
                });
                saveSettings(settings); 
            }); 
        });
    });
});