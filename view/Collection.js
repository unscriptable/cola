/** @license MIT License (c) copyright 2013 original authors */
(function (define) {
define(function (require) {

	var meld = require('meld');
	var NodeList = require('./lib/NodeList');
	var Sorted = require('./lib/Sorted');
	var iterator = require('../lib/iterator');
	var dom = require('./lib/dom');
	var findSection = require('./lib/findSection');
	var nativeProxy = require('./proxy/native');

	/**
	 * Binds a dom node to a collection of models.
	 * @param {HTMLElement} root
	 * @param {Object} options
	 * @param {Object} options.binder
	 * @param {Object} [options.proxy]
	 * @param {Object} [options.identify]
	 * @param {Object} [options.id]
	 * @param {Object} [options.compare]
	 * @param {Object} [options.sortBy]
	 * @param {Object} [options.listNode]
	 * @param {Object} [options.listNodeAttr]
	 * @param {Object} [options.listNodeValue]
	 * @param {Object} [options.qsa]
	 * @constructor
	 */
	function Collection (root, options) {
		var proxy, identify, compare, binder,
			listNode, nodeList,
			bindings, find, after;

		proxy = options.proxy || nativeProxy({ missing: blank });

		identify = options.identify || identifyFromProp(options.id || 'id');

		compare = options.compare
			|| compareFromProp(options.sortBy || 'id', proxy);

		binder = options.binder;
		if (!binder) throw new Error('Binder not optional.');

		// if there are no sections, use the root node.
		listNode = options.listNode || findSection(root, options) || root;

		bindings = new Sorted(identifyModel, compareModels, 'binding');
		nodeList = new NodeList(root, listNode);

		find = findBinding.bind(null, bindings, nodeList.root);

		after = meld.afterReturning;

		after(bindings, 'insert', function (inserted) {
			var binding, accessors;
			binding = inserted.binding;
			binding.node = nodeList.create();
			nodeList.insert(binding.node, inserted.pos);
			accessors = binder(binding.node);
			binding.push = accessors.push;
			binding.pull = accessors.pull;
			binding.push(function (key) {
				return proxy.get(binding.model, key);
			});
		});

		after(bindings, 'update', function (updated) {
			var binding = updated.binding;
			if (updated.pos >= 0) nodeList.insert(binding.node, updated.pos);
			binding.push(function (key) {
				return proxy.get(binding.model, key);
			});
		});

		after(bindings, 'remove', function (removed) {
			var binding = removed.binding;
			if (removed.prevPos >= 0) nodeList.remove(binding.node);
		});

		return {
			set: function (iterable) {
				this.clear();
				iterator.reduce(function (_, model) {
					bindings.insert({ model: model });
				}, null, iterator(iterable));
			},
			get: function (findable) {
				var binding;
				// first try to find it as a node or event
				// next, try finding it as a model
				binding = find(findable) || bindings.find(findable);
				if (binding) {
					binding.pull(function (key, value) {
						proxy.set(binding.model, key, value);
					});
					return binding.model;
				}
			},
			update: function (changes) {
				// changes is an array of objects: { type, object, name [, oldValue] }
				// type can be "new", "deleted", "updated", or "reconfigured"
				changes.forEach(function (change) {
					var model, oldBinding, newBinding;

					if ('deleted' == change.type) {
						bindings.remove({ model: change.oldValue });
					}
					else {
						model = change.object[change.name];

						if (typeof model != 'object') {
							// skip 'length' property, etc.
						}
						else if ('new' == change.type) {
							bindings.insert({ model: model });
						}
						else if ('updated' == change.type) {
							// get existing binding that has same model
							oldBinding = { model: change.oldValue };
							newBinding = bindings.find(oldBinding);
							// replace model
							newBinding.model = model;
							// update it
							bindings.update(newBinding, oldBinding);
						}
					}

				}, this);
			},
			find: function (nodeOrEvent) {
				var binding = find(nodeOrEvent);
				return binding && binding.model;
			},
			findNode: function (nodeOrEvent) {
				var binding = find(nodeOrEvent);
				return binding && binding.node;
			},
			clear: function () {
				bindings.clear();
			}
		};

		function identifyModel (b) {
			return identify(b.model);
		}

		function compareModels (b1, b2) {
			return compare(b1.model, b2.model);
		}

	}

	return Collection;

	function findBinding (bindings, root, nodeOrEvent) {
		var node, binding;

		node = dom.toNode(nodeOrEvent);
		binding = null;

		// if this node isn't in our tree, bail early
		if (!node || !dom.contains(root, node)) return null;

		// for each model binding, compare node position.
		// the cost of not using attribute turds is that we must loop
		// through all possible nodes.
		return bindings.find(function (b) {
			if (dom.contains(b.node, node)) {
				return binding = b;
			}
		});
	}

	function identifyFromProp (prop) {
		return function (obj) { return Object(obj)[prop]; };
	}

	function compareFromProp (prop, proxy) {
		return function (a, b) {
			return compare(proxy.get(Object(a), prop), proxy.get(Object(b), prop));
		};
	}

	function compare (a, b) {
		return a < b ? -1 : a > b ? 1 : 0;
	}

	function blank () { return ''; }

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
