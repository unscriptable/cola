(function (define) {
define(function (require) {

	function NodeList (rootNode, listNode, itemNode) {
		this.root = rootNode;
		this.list = listNode;
		this.item = itemNode;
	}

	NodeList.prototype = {

		create: function () {
			return this.item.cloneNode(true);
		},

		insert: function (itemNode, pos) {
			// Note: this wil work in IE8 only if there are no comment nodes
			this.list.insertBefore(itemNode, this.list.children[pos]);
		},

		remove: function (itemNode) {
			this.list.removeChild(itemNode);
		}
	};

	return NodeList;

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
