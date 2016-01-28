/**
 * Given a default value and a value will return the value if it is of the same type as the default value.
 * @param {any} defaultValue
 * @param {any} value
 * @return {any} defaultValue or value if valid
 */
exports.getValueOrDefault = function(defaultValue, value) {
	return typeof defaultValue == typeof value ? value : defaultValue;
}