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
			binding;

		proxy = options.proxy || new ObjectMetadata().model;

		binder = options.binder;
		if (!binder) throw new Error('Binder not optional.');

		binding = {
			model: null,
			node: root
		};

		return {
			set: function (model, metadata) {
				var accessors;

				this.clear();

				if (metadata) {
					proxy = metadata.model;
				}

				binding.model = model;
				accessors = binder(binding.node);
				binding.push = accessors.push;
				binding.pull = accessors.pull;
				binding.push(function (key) {
					return proxy.get(binding.model, key);
				});
			},
			get: function (thing) {
				// TODO: only return if `thing` is for this view
				if (binding.pull) {
					binding.pull(function (key, value) {
						proxy.set(binding.model, key, value);
					});
				}
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
				if (binding.push) {
					binding.push(function (key) {
						return proxy.get(binding.model, key);
					});
				}
			}
		};

	}

	return Single;

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
