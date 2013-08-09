/** @license MIT License (c) copyright 2013 original authors */
(function (define) {
define(function (require) {

	var atRoot = require('./atRoot');

	function atForms (view, options) {

		options = Object.create(options);

		if (!options.events) options.events = [ 'submit:form', 'submit' ];

		return atRoot(view, options);
	}

	return atForms;

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
