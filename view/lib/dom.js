/** @license MIT License (c) copyright 2013 original authors */
(function (define) {
define(function () {

	var containsImpl = getContainsImpl;
	var addEventImpl = getAddEventImpl;
	var removeEventImpl = function () {};

	var formTypes = { 'INPUT': 1, 'SELECT': 1, 'TEXTAREA': 1 };
	var formClickables = { 'CHECKBOX': 1, 'RADIO': 1 };

	/**
	 * Reused dom helper functions.
	 * @type {Object}
	 */
	var dom = {

		/**
		 * Returns true if refNode contains testNode in its hierarchy.
		 * @param {Node} refNode
		 * @param {Node} testNode
		 * @return {Boolean}
		 */
		contains: function (refNode, testNode) {
			return containsImpl(refNode, testNode);
		},

		/**
		 * Test if nodeOrEvent is a node or an event.  If it's an event, it
		 * returns the event's target. Otherwise, it returns the node.
		 * @param {Node|Event} nodeOrEvent
		 * @return {Node}
		 */
		toNode: function (nodeOrEvent) {
			var node;
			node = 'nodeName' in nodeOrEvent && 'nodeType' in nodeOrEvent
				? nodeOrEvent
				: nodeOrEvent.target || nodeOrEvent.srcElement;
			return node;
		},

		qsa: function (selector, node) {
			return node.querySelectorAll(selector);
		},

		addEvent: addEventImpl,

		removeEvent: removeEventImpl,

		guessProp: guessPropFor,

		guessEvent: guessEventFor

	};

	return dom;

	/**
	 * Determines the DOM method used to compare the relative positions
	 * of DOM nodes and returns an abstraction function.
	 * @private
	 * @return {Function} function (refNode, testNode) { return boolean; }
	 */
	function getContainsImpl () {
		if (typeof document != 'undefined' && document.compareDocumentPosition) {
			// modern browser
			containsImpl = function (refNode, testNode) {
				return (refNode.compareDocumentPosition(testNode) & 16) == 16;
			};
		}
		else {
			// assume legacy IE
			containsImpl = function (refNode, testNode) {
				return refNode.contains(testNode);
			};
		}
		return containsImpl.apply(null, arguments);
	}

	function getAddEventImpl () {
		if (typeof document != 'undefined' && document.addEventListener) {
			// modern browser
			addEventImpl = function (node, name, listener, capture) {
				return node.addEventListener(name, listener, capture);
			};
			removeEventImpl = function (node, name, listener, capture) {
				return node.removeEventListener(name, listener, capture);
			};
		}
		else {
			// assume legacy IE
			addEventImpl = function (node, name, listener, capture) {
				return node.attachEvent('on' + name, listener);
			};
			removeEventImpl = function (node, name, listener, capture) {
				return node.detachEvent('on' + name, listener);
			};
		}
		return addEventImpl.apply(null, arguments);
	}

	function isFormValueNode (node) {
		return node.nodeName && node.nodeName.toUpperCase() in formTypes;
	}

	function isClickableFormNode (node) {
		return isFormValueNode(node)
			&& node.type && node.type.toUpperCase() in formClickables;
	}

	function isContentEditable (node) {
		return node.isContentEditable && node.isContentEditable();
	}

	function guessPropFor (node) {
		return isFormValueNode(node)
			? (isClickableFormNode(node) ? 'checked' : 'value')
			: (isContentEditable(node) ? 'innerHTML' : 'textContent');
	}

	function guessEventFor (node) {
		return isFormValueNode(node)
			// IE needs click
			? (isClickableFormNode(node) ? 'click' : 'change')
			// "change" doesn't fire for contentEditable elements :(
			: (isContentEditable(node) ? 'blur' : '');
	}

});
}(
	typeof define == 'function' && define.amd
		? define
		: function (factory) { module.exports = factory(); }
));
