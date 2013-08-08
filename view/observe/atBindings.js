/** @license MIT License (c) copyright 2013 original authors */
(function (define) {
define(function (require) {

	var dom = require('../lib/dom');

	function atBindings (view, options) {
		var listeners;

		return {
			observe: function (observer) {
				if (!listeners) listeners = createListeners(view.bindings);
				listeners.forEach(function (listener) { listener.add(observer); });
			},
			unobserve: function (observer) {
				if (!listeners) return;
				listeners.forEach(function (listener) { listener.remove(observer); });
			}
		};

	}

	return atBindings;

	function createListeners (bindings) {
		return bindings.reduce(function (listeners, binding) {
			var event, node;
			if (binding.bind) {
				node = binding.node;
				event = dom.guessEvent(node);
				if (event) {
					listeners.push({
						add: function (observer) {
							dom.addEvent(node, event, observer);
						},
						remove: function (observer) {
							dom.removeEvent(node, event, observer);
						}
					});
				}
			}
		}, []);
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
