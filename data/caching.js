/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
define(function(require) {

	var when = require('when');

	return function caching(datasource, options) {
		var cached;

		if(!options) {
			options = {};
		}

		return Object.create(datasource, {
			fetch: { value: fetch },
			update: { value: update },
			sync: { value: sync }
		});

		function fetch(options) {
			if(!cached) {
				cached = datasource.fetch(options)
			}

			return cached;
		}

		function update(changes) {
			if(!cached) {
				cached = fetch();
			}

			return when(cached, function(value) {
				return patch(value, changes);
			}).then(function() {
				return datasource.update(changes);
			});
		}

		function patch(data, changes) {
			return datasource.metadata.patch(data, changes);
		}

		function sync() {
			cached = null;
		}
	};

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
