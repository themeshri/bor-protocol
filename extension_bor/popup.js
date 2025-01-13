let isMonitoring = false;

// Initialize state from storage when popup opens
chrome.storage.local.get('isMonitoring', (result) => {
    isMonitoring = result.isMonitoring || false;
    const button = document.getElementById('toggleButton');
    const status = document.getElementById('status');
    
    if (isMonitoring) {
        button.textContent = 'Stop Monitoring';
        button.classList.add('stop');
        status.textContent = 'Monitoring active...';
    } else {
        button.textContent = 'Start Monitoring';
        button.classList.remove('stop');
        status.textContent = 'Ready to monitor';
    }
});

document.getElementById('toggleButton').addEventListener('click', async () => {
    const button = document.getElementById('toggleButton');
    const status = document.getElementById('status');
    
    if (!isMonitoring) {
        // Start monitoring
        const tabs = await chrome.tabs.query({ currentWindow: true });

        if (tabs.length < 2) {
            status.textContent = 'Need at least 2 tabs!';
            return;
        }

        const firstTab = tabs[0];
        const secondTab = tabs[1];

        try {
            await chrome.scripting.executeScript({
                target: { tabId: secondTab.id },
                func: function() {
                    // Add a Set to track processed messages
                    window.processedMessages = new Set();

                    window.myObserver = new MutationObserver(mutations => {
                        mutations.forEach(mutation => {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === 1 && node.matches('div[class="css-175oi2r r-1d5kdc7 r-173mzie"]')) {
                                    // Add a small delay to ensure content is loaded
                                    setTimeout(() => {
                                        const link = node.querySelector('a[class="css-175oi2r r-xoduu5 r-1wbh5a2 r-dnmrzs r-1ny4l3l r-1loqt21"]');
                                        debugger;
                                        // Try multiple selector approaches
                                        let imageElement = node.querySelector('img.css-9pa8cd');
                                        
                                        // If not found, try alternative selectors
                                        if (!imageElement) {
                                             console.log("other approach")
                                            imageElement = node.querySelector('img[class*="css-9pa8cd"]');
                                        }
                                        
                                        console.log("Image element found:", imageElement);
                                        
                                        let linkContent = '';
                                        let srcImageContent = '';
                                       
                                        if (imageElement) {
                                            srcImageContent = imageElement.src;
                                            console.log("Image source:", srcImageContent);
                                        } 
                                        
                                        if (link) {
                                            const firstDiv = link.querySelector('div');
                                            if (firstDiv) {
                                                const nestedSpan = firstDiv.querySelector('span');
                                                if (nestedSpan) {
                                                    const deepestSpan = nestedSpan.querySelector('span');
                                                    if (deepestSpan) {
                                                        linkContent = deepestSpan.textContent;
                                                    }
                                                }
                                            }
                                        }
                                        
                                        const innerDiv = node.querySelector('div.css-146c3p1.r-bcqeeo.r-1ttztb7.r-qvutc0');
                                        let content = '';
                                        if (innerDiv) {
                                            const directSpan = Array.from(innerDiv.childNodes)
                                                .find(node => node.nodeName === 'SPAN');
                                            
                                            if (directSpan) {
                                                
                                                    content = directSpan.textContent.trim();
                                                    console.log("content content:", content);
                                        
                                            }
                                        }

                                        if (linkContent || content) {
                                            // Create a unique identifier for the message
                                            const messageId = `${linkContent}-${content}-${srcImageContent}`;
                                            
                                            // Check if we've already processed this message
                                            if (!window.processedMessages.has(messageId)) {
                                                window.processedMessages.add(messageId);
                                                
                                                window.postMessage({
                                                    type: 'FROM_INJECTED_SCRIPT',
                                                    content: {
                                                        username: linkContent,
                                                        chatContent: content,
                                                        avatar: srcImageContent,
                                                        timestamp: new Date().toISOString()
                                                    }
                                                }, '*');
                                            }
                                        }
                                    }, 40); // Small delay to ensure content is loaded
                                }
                            });
                        });
                    });

                    window.myObserver.observe(document.body, { childList: true, subtree: true });
                    return true;
                }
            });
            
            isMonitoring = true;
            chrome.storage.local.set({ isMonitoring: true });
            button.textContent = 'Stop Monitoring';
            button.classList.add('stop');
            status.textContent = 'Monitoring active...';
        } catch (err) {
            status.textContent = 'Error: ' + err.message;
        }
    } else {
        // Stop monitoring
        try {
            const tabs = await chrome.tabs.query({ currentWindow: true });
            const secondTab = tabs[1];
            
            await chrome.scripting.executeScript({
                target: { tabId: secondTab.id },
                func: function() {
                    if (window.myObserver) {
                        window.myObserver.disconnect();
                        window.myObserver = null;
                    }
                    return true;
                }
            });

            isMonitoring = false;
            chrome.storage.local.set({ isMonitoring: false });
            button.textContent = 'Start Monitoring';
            button.classList.remove('stop');
            status.textContent = 'Monitoring stopped';
        } catch (err) {
            status.textContent = 'Error stopping: ' + err.message;
        }
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'MONITORING_STOPPED') {
        isMonitoring = false;
        const button = document.getElementById('toggleButton');
        const status = document.getElementById('status');
        
        button.textContent = 'Start Monitoring';
        button.classList.remove('stop');
        status.textContent = message.reason === 'tab_reload' ? 
            'Monitoring stopped (tab reloaded)' : 'Monitoring stopped';
    }
});

// Also add a periodic state check
function checkMonitoringState() {
    chrome.storage.local.get('isMonitoring', (result) => {
        if (isMonitoring !== result.isMonitoring) {
            isMonitoring = result.isMonitoring;
            const button = document.getElementById('toggleButton');
            const status = document.getElementById('status');
            
            if (isMonitoring) {
                button.textContent = 'Stop Monitoring';
                button.classList.add('stop');
                status.textContent = 'Monitoring active...';
            } else {
                button.textContent = 'Start Monitoring';
                button.classList.remove('stop');
                status.textContent = 'Ready to monitor';
            }
        }
    });
}

// Check state every 5 seconds
const stateCheckInterval = setInterval(checkMonitoringState, 5000);

// Clean up interval when popup closes
window.addEventListener('unload', () => {
    clearInterval(stateCheckInterval);
});