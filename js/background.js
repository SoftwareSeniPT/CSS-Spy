var cssValueSetting = {
    width: true,
    height: true,
    color: true,
    fontFamily: true,
    fontSize: true,
    fontWeight: true,
    lineHeight: true,
    margin: true,
    padding: true,
    left: false,
    right: false,
    top: false,
    bottom: false,
    border: false,
    clear: false,
    cursor: false,
    display: false,
    float: false,
    overflow: false,
    zIndex: false,
    textAlign: false,
    textTransform: false,
    verticalAlign: false,
    visibility: false,
    backgroundColor: true,
    backgroundAttachment: false,
    backgroundImage: false,
    backgroundPosition: false,
    backgroundRepeat: false,
    background: false,
    borderBottomColor: false,
    borderBottomStyle: false,
    borderBottomWidth: false,
    borderBottom: false,
    borderCollapse: false,
    borderColor: false,
    borderLeftColor: false,
    borderLeftStyle: false,
    borderLeftWidth: false,
    borderLeft: false,
    borderRightColor: false,
    borderRightStyle: false,
    borderRightWidth: false,
    borderRight: false,
    borderSpacing: false,
    borderStyle: false,
    borderTopColor: false,
    borderTopStyle: false,
    borderTopWidth: false,
    borderTop: false,
    borderWidth: false,
    fontStyle: false,
    font: false,
    letterSpacing: false,
    listStyle: false,
    marginBottom: false,
    marginLeft: false,
    marginRight: false,
    marginTop: false,
    maxHeight: false,
    maxWidth: false,
    minHeight: false,
    minWidth: false,
    outline: false,
    paddingBottom: false,
    paddingLeft: false,
    paddingRight: false,
    paddingTop: false,
    position: false,
    textDecoration: false,
    textIndent: false,
    textShadow: false,
    whiteSpace: false,
    wordSpacing: false,
};

function onStart() {
    // Set the default css value to show
    chrome.storage.sync.set({
        cssValue: cssValueSetting
    });
    // Set default urls database
    chrome.storage.sync.set({
        urls: {}
    });
    // Set comparedCSS
    chrome.storage.sync.set({
        comparedCSS: {}
    });
}

onStart();
chrome.windows.onCreated.addListener(function() {
    onStart();
});

// Change icon on browser action
function changeIcon(state) {
    if (state) {
        chrome.browserAction.setIcon({
            path: "../images/icon48-red.png"
        });
    } else {
        chrome.browserAction.setIcon({
            path: "../images/icon48.png"
        });
    }
}

function isActive(state, currentURL, saveToStorage) {
    if (!saveToStorage) {
        changeIcon(state);
        return;
    }
    chrome.storage.sync.get('urls', function(data) {
        var urls = data.urls;
        if (state) {
          // Save in active
          urls[currentURL] = state;
        } else {
          // Delete if inactive
          delete urls[currentURL];
        }
        chrome.storage.sync.set({
            urls: urls
        }, function() {
            // Catch for error and reset if have one
            if (chrome.extension.lastError) {
                onStart();
                console.log("error!");
                return;
            }
            changeIcon(state);
            // Send message to content script
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function(tabs) {
                if (tabs[0].url !== currentURL) {
                    return;
                }
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: "stateChange",
                    value: state
                });
            });
        });
    });
}

function tabOnChange() {
    chrome.storage.sync.get('urls', function(data) {
        chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
        }, function(tabs) {
            var tab = tabs[0];
            var state = data.urls[tab.url];
            if (state === undefined) {
                // set default state for page
                isActive(false, tab.url, false);
            } else {
                if (state) {
                    // If active
                    isActive(true, tab.url, false);
                } else {
                    isActive(false, tab.url, false);
                }
            }
        });
    });
}

// Detect when tabs is created or updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    tabOnChange();
});

chrome.tabs.onCreated.addListener(function(tabId, changeInfo, tab) {
    tabOnChange();
});

chrome.tabs.onRemoved.addListener(function(tabId, changeInfo, tab) {
    tabOnChange();
});

chrome.tabs.onMoved.addListener(function(tabId, changeInfo, tab) {
    tabOnChange();
});

chrome.tabs.onActiveChanged.addListener(function(tabId, changeInfo, tab) {
    tabOnChange();
});

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.storage.sync.get('urls', function(data) {
        chrome.tabs.query({
            active: true,
            lastFocusedWindow: true
        }, function(tabs) {
            var tab = tabs[0];
            var state = data.urls[tab.url];

            if (state === undefined) {
                // set default state for page
                isActive(true, tab.url, true);
            } else {
                if (state) {
                    // If active
                    isActive(false, tab.url, true);
                } else {
                    isActive(true, tab.url, true);
                }
            }
        });
    });
});
