/** @license MIT License (c) copyright 2013 original authors */
(function (define) {
define(function (require) {

	function atRoot (view, options) {
		var on, eventSelectors, observations;

		on = options.on;

		if (!on) throw new Error('on() implementation not provided.');

		eventSelectors = options.events;

		if (!eventSelectors) {
			eventSelectors = [ 'change:input,textarea,select' ];
			// this is an inference test for IE<=8
			if (!view.rootNode.addEventListener) {
				eventSelectors.push('click:input[type=radio],input[type=checkbox]');
			}
		}

		eventSelectors = eventSelectors.map(parseEventSelector);

		observations = [];

		view.observe = function (observer) {
			var callback, observation;
			callback = eventToModel(observer);
			observation = saveObservation(observations, observer);
			eventSelectors.forEach(function (es) {
				var remove;
				remove = on(view.rootNode, es.event, callback, es.selector);
				observation.add(remove);
			});
		};

		view.unobserve = function (observer) {
			var observation = removeObservation(observer);
			if (observation) observation.unobserve();
		};

		return view;

		function eventToModel (callback) {
			return function (e) {
				var model = view.get(e);
				if (model) callback(model, e);
			}
		}
	}

	return atRoot;

	function parseEventSelector (es) {
		var parts;

		// might already be an object
		if (typeof es != 'string' && es.event) return es;

		parts = es.split(':');
		return { event: parts[0], selector: parts[1] };
	}

	function saveObservation (observations, observer) {
		var observation, removes = [];

		observation = {
			observer: observer,
			unobserve : removeAll,
			add: addOne
		};
		observations.push(observation);

		return observation;

		function removeAll () {
			removes.forEach(function (r) { r(); });
			removes = [];
		}
		function addOne (remove) {
			removes.push(remove);
		}
	}

	function removeObservation (observations, observer) {
		var observation;

		// scan for observer to get unobserve
		observations.some(function (o, i) {
			if (o.observer == observer) {
				observations.splice(i, 1);
				observation = o;
				return true;
			}
		});

		return observation;
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
