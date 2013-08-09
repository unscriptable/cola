(function (define) {
define(function (require) {

	var cssExtractor = require('../lib/cssExtractor');
	var nodeAccessor = require('../lib/nodeAccessor');

	return bySelectorMap;

	function bySelectorMap (options) {
		var extractor;

		options = Object.create(options || null);

		extractor = cssExtractor(options);

		return function (node) {
			var getters, setters, nodeAttrs;

			getters = [];
			setters = [];
			nodeAttrs = extractor(node);

			nodeAttrs.forEach(function (binding) {
				binding.bind.forEach(function (mapping) {
					var accessor;
					accessor = nodeAccessor(binding.node, mapping[0], mapping[1]);
					if (accessor.set) setters.push(accessor.set);
					if (accessor.get) getters.push(accessor.get);
				});
			});

			return {
				push: function (proxy) {
					setters.forEach(function (setter) { setter(proxy) });
				},
				pull: function (proxy) {
					getters.forEach(function (getter) { getter(proxy); });
				}
			};
		};
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
