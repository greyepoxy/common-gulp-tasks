/**
 * Given a default value and a value will return the value if it is of the same type as the default value.
 * @param {any} defaultValue
 * @param {any} value
 * @return {any} defaultValue or value if valid
 */
exports.getValueOrDefault = function(defaultValue, value) {
	return typeof defaultValue == typeof value ? value : defaultValue;
}

var nextBrowserSyncPort = 3000;
/**
 * Gets the next available port number to use with browser sync.
 */
exports.getNextBrowserSyncPort = function() {
	var port = nextBrowserSyncPort;
	nextBrowserSyncPort += 1;
	return port;
}
