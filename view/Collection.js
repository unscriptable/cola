/** @license MIT License (c) copyright 2013 original authors */
(function (define) {
define(function (require) {

	var meld = require('meld');
	var NodeCollection = require('./lib/NodeCollection');
	var Sorted = require('./lib/Sorted');
	var iterator = require('../lib/iterator');
	var dom = require('./lib/dom');
	var findSection = require('./lib/findSection');
	var ObjectMetadata = require('../data/metadata/ObjectMetadata');

	/**
	 * Binds a dom node to a collection of models.
	 * @param {HTMLElement} root
	 * @param {Object} options
	 * @param {Object} options.binder
	 * @param {Object} [options.proxy]
	 * @param {Object} [options.compare]
	 * @param {Object} [options.sortBy]
	 * @param {Object} [options.listNode]
	 * @param {Object} [options.listNodeAttr]
	 * @param {Object} [options.listNodeValue]
	 * @param {Object} [options.qsa]
	 * @constructor
	 */
	function Collection (root, options) {
		var proxy, compare, binder,
			listNode, nodes,
			bindings, after;

		proxy = options.proxy || new ObjectMetadata().model;
		compare = options.compare || options.sortBy || 'id';
		binder = options.binder;
		if (!binder) throw new Error('Binder not optional.');

		// if there are no sections, use the root node.
		listNode = options.listNode || findSection(root, options) || root;

		bindings = new Sorted(
			createIdentifyModel(proxy.id),
			createCompareModels(proxy.get, compare),
			'binding'
		);

		nodes = new NodeCollection(listNode);

		after = meld.afterReturning;

		after(bindings, 'insert', function (inserted) {
			var binding, accessors;
			binding = inserted.binding;
			binding.node = nodes.create();
			nodes.insert(binding.node, inserted.pos);
			accessors = binder(binding.node);
			binding.push = accessors.push;
			binding.pull = accessors.pull;
			binding.push(function (key) {
				return proxy.get(binding.model, key);
			});
		});

		after(bindings, 'update', function (updated) {
			var binding = updated.binding;
			if (updated.pos >= 0) nodes.insert(binding.node, updated.pos);
			binding.push(function (key) {
				return proxy.get(binding.model, key);
			});
		});

		after(bindings, 'remove', function (removed) {
			var binding = removed.binding;
			if (removed.prevPos >= 0) nodes.remove(binding.node);
		});

		return {
			set: function (iterable, metadata) {

				bindings.clear();

				if (metadata) {
					proxy = metadata.model;
					bindings.identify = createIdentifyModel(proxy.id);
					bindings.compare = createCompareModels(proxy.get, compare);
				}

				iterator.reduce(function (_, model) {
					bindings.insert({ model: model });
				}, null, iterator(iterable));

			},
			get: function (thing) {
				var binding = findBinding(bindings, thing);
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
			find: function (thing) {
				var binding = findBinding(bindings, thing);
				return binding && binding.model;
			},
			findNode: function (thing) {
				var binding = findBinding(bindings, thing);
				return binding && binding.node;
			},
			clear: function () {
				bindings.clear();
			}
		};

	}

	return Collection;

	function findBinding (bindings, thing) {
		var node = dom.toNode(thing);
		var predicate = node ? findByNode : findByModel;
		return bindings.find(predicate);
		function findByNode (binding) {
			return binding.node == node || dom.contains(binding.node, node);
		}
		function findByModel (binding) {
			return proxy.id(binding.model) == proxy.id(thing);
		}
	}

	function createCompareModels (getter, compare) {
		if (typeof compare != 'function') {
			var prop = String(compare);
			compare = function (m1, m2) {
				return simpleCompare(getter(m1, prop),getter(m2, prop));
			};
		}
		return function (binding1, binding2) {
			return compare(binding1.model, binding2.model);
		}
	}

	function createIdentifyModel (identify) {
		return function (binding) {
			return identify(binding.model);
		}
	}

	function simpleCompare (a, b) {
		return a < b ? -1 : a > b ? 1 : 0;
	}

	function blank () { return ''; }

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
