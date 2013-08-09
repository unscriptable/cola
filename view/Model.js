(function (define) {
define(function (require) {

	var meld = require('meld');
	var dom = require('./lib/dom');
	var findSection = require('./lib/findSection');
	var ObjectMetadata = require('../data/metadata/ObjectMetadata');

	/**
	 * Binds a dom node to a single model.
	 * @param {HTMLElement} root
	 * @param {Object} options
	 * @param {Object} options.binder
	 * @param {Object} [options.proxy]
	 * @param {Object} [options.identify]
	 * @param {Object} [options.id]
	 * @param {Object} [options.compare]
	 * @param {Object} [options.sortBy]
	 * @param {Object} [options.qsa]
	 * @constructor
	 */
	function Single (root, options) {
		var proxy, binder,
			binding, accessors;

		proxy = options.proxy || new ObjectMetadata().model;

		binder = options.binder;
		if (!binder) throw new Error('Binder not optional.');

		binding = {
			model: null,
			node: root
		};

		return {
			set: function (model, metadata) {

				this.clear();

				binding.model = model;

				if (metadata) {
					proxy = metadata.model;
					delete binding.proxy;
				}

				if (!accessors) {
					accessors = binder(binding.node);
				}

				if (!binding.proxy) {
					binding.proxy = createProxyForBinding(binding, proxy);
					binding.push = function () {
						accessors.push(binding.proxy);
					};
					binding.pull = function () {
						accessors.pull(binding.proxy);
					};
				}

				binding.push();
			},
			get: function (thing) {
				// TODO: only return if `thing` is for this view
				if (binding.pull) binding.pull();
				return binding.model;
			},
			find: function (nodeOrEvent) {
				if (contains(binding.node, nodeOrEvent)) return binding.model;
			},
			findNode: function (nodeOrEvent) {
				if (contains(binding.node, nodeOrEvent)) return binding.node;
			},
			clear: function () {
				binding.model = null;
				if (binding.push) binding.push();
			}
		};

	}

	return Single;

	function createProxyForBinding (binding, proxy) {
		return {
			get: function (key) { return proxy.get(binding.model, key); },
			set: function (key, val) { return proxy.get(binding.model, key, val); },
			has: function (key) { return proxy.has(binding.model, key); }
		};
	}

	function contains (root, nodeOrEvent) {
		var node = dom.toNode(nodeOrEvent);
		return node && dom.contains(root, node);
	}

	function blank () { return ''; }

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
