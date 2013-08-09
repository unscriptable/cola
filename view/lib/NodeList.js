(function (define) {
define(function (require) {

	function NodeList (rootNode, listNode, itemNode) {
		this.root = rootNode;
		this.list = removeComments(listNode);
		// yank out the contents from top section and use it as a template.
		// TODO: support dom fragments
		this.item = itemNode || this.list.removeChild(this.list.children[0]);
	}

	NodeList.prototype = {

		create: function () {
			return this.item.cloneNode(true);
		},

		insert: function (itemNode, pos) {
			this.list.insertBefore(itemNode, this.list.children[pos]);
		},

		remove: function (itemNode) {
			this.list.removeChild(itemNode);
		}
	};

	return NodeList;

	// IE6-8 will consider comments to be children, so we remove them.
	function removeComments (node) {
		var child = node.firstChild, next;
		while (child) {
			next = child.nextSibling;
			if (child.nodeType == 8) node.removeChild(child);
			child = next;
		}
		return node;
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(require); }
));
