(function (define) {
define(function (require) {

	var dom = require('./dom');

	return findSection;

	function findSection (root, options) {
		var scope, attr, query, qsa;
		scope = options.listNodeValue || 'section';
		attr = options.listNodeAttr || 'data-cola-section';
		query = '[' + attr + (scope ? '="' + scope + '"' : '') + ']';
		qsa = options.qsa || dom.qsa;
		return qsa(query, root)[0] || qsa('ul,ol,tbody,dl', root)[0];
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
