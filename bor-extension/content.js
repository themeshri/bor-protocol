// Listen for messages from the injected script
window.addEventListener('message', function(event) {
    // Make sure the message is from our injected script
    if (event.data && event.data.type === 'FROM_INJECTED_SCRIPT') {
        // Forward the message to the extension
        chrome.runtime.sendMessage({
            type: 'newData',
            data: event.data.content
        });
    }
});