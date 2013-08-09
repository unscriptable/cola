(function (define) {
define(function (require) {

	var iterator = require('../../lib/iterator');
	var search = require('./search');
	var undef;

	function Sorted (identify, compare) {
		this.items = [];
		this.identify = identify;
		this.compare = compare;
		this.itemName = arguments[2] || 'item';
	}

	Sorted.prototype = {

		insert: function (newItem) {
			var newPos;
			newPos = this.sortedPos(newItem);
			return this._place(newItem, newPos);
		},

		update: function (newItem, oldItem) {
			var sortedPos, exactPos, newPos;
			sortedPos = this.sortedPos(oldItem);
			newPos = this.sortedPos(newItem);
			// don't bother to move item if it is in the same sort position
			if (sortedPos != newPos) {
				exactPos = this.exactPos(oldItem);
				return this._place(newItem, newPos, exactPos);
			}
			return this._result(newItem);
		},

		remove: function (oldItem) {
			var oldPos;
			oldPos = this.exactPos(oldItem);
			if (oldPos >= 0) {
				return this._place(this.items[oldPos], undef, oldPos);
			}
			return {};
		},

		set: function (iterable) {
			var self = this;
			iterator.reduce(function (_, item) {
				self.insert(item);
			}, null, iterator(iterable));
		},

		clear: function () {
			var items = this.items;
			while (items.length > 0) {
				this.remove(items[0]);
			}
		},

		// TODO: should find return { item: item, pos: pos } ??
		find: function (predicate) {
			var found;
			if (typeof predicate != 'function') {
				// look for a similar item
				return this.items[this.exactPos(predicate)];
			}
			else {
				this.items.some(function (item) {
					return predicate(item) && (found = item);
				});
				return found;
			}
		},

		sortedPos: function (item) {
			var compare, items, pos;
			compare = this.compare;
			items = this.items;
			return search.binary(
				0,
				items.length,
				function (pos) { return compare(items[pos], item); }
			);
		},

		exactPos: function (item) {
			var compare, identify, items, approx, id;
			compare = this.compare;
			identify = this.identify;
			items = this.items;
			approx = this.sortedPos(item);
			id = identify(item);
			return search.grope(
				approx,
				0,
				items.length,
				function (pos) { return identify(items[pos]) === id; },
				function (pos) { return compare(items[pos], item); }
			);
		},

		_place: function (item, newPos, oldPos) {
			var result = this._result(item);
			if (newPos >= 0) {
				this.items.splice(newPos, 0, item);
				result.pos = newPos;
			}
			if (oldPos >= 0) {
				this.items.splice(oldPos, 1);
				result.prevPos = oldPos;
			}
			return result;
		},

		_result: function (item) {
			var res = {};
			res[this.itemName] = item;
			return res;
		}
	};

	return Sorted;

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
