var eventHandler = function (handler) {
	return function (e) {
		e = e || window.event;

		var target = tmp = e.srcElement || e.target,
		    item, automator;

		if (/\bitem\b/.test((window._dragging||{}).className)) {
			target = item = window._dragging;
		} else if (/\bitem\b/.test(target.className)) {
			item = target;
		} else {
			while (tmp.parentNode) {
				tmp = tmp.parentNode;
				if (/\bitem\b/.test(tmp.className)) {
					item = tmp;
					break;
				}
			}
			if (!item) return;
		}

		if (handler(target, item, item.parentNode, e) === false) {
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
			return false;
		}
	}
}

var clickHandler = eventHandler(function (target, item, automator, e) {
	var code = ((""+e.keyCode).match(/13|32|37|38|39|40/)||[]).pop(),
	    isPlaceholder = /\bplaceholder\b/.test(item.className);

	if (e.type === 'click') {
		code = 1;
	} else if (e.type === 'dblclick') {
		code = 2;
	}

	if (code !== undefined) {
		if (isPlaceholder && /1|13|32/.test(code)) {
			var newItem = document.createElement('li'),
			    index = automator.querySelectorAll('.item').length;
			newItem.className = 'item';
			newItem.setAttribute('tabindex', 0);
			newItem.innerHTML = '<div class="title">Thing #' + index + '</div><div class="toggle" tabindex="0"></div><div class="remove" tabindex="0"></div><div class="content"></div>';
			automator.insertBefore(newItem, item);
			newItem.focus();
		} else if (code === 2 || /\btoggle\b/.test(target.className) || (target === item && /13|32/.test(code))) {
			if (/\bclosed\b/.test(item.className)) {
				!/37|38/.test(code) && (item.className = item.className.replace(/\s*\bclosed\b/g, ''));
			} else {
				!/39|40/.test(code) && (item.className += ' closed');
			}
		} else if (/\bremove\b/.test(target.className) && /1|13|32/.test(code)) {
			automator.removeChild(item);
		} else if (target === item) {
			var sibling;

			if (/37|38/.test(code)) {
				do {
					sibling = (sibling||item).previousSibling;
				} while (sibling && !/\bitem\b/.test(sibling.className));

				if (sibling) {
					if (code == 37) {
						if (!isPlaceholder && !/\bplaceholder\b/.test(sibling.className)) {
							automator.insertBefore(item, sibling);
							item.focus();
						}
					} else {
						sibling.focus();
					}
				}
			} else if (/39|40/.test(code)) {
				do {
					sibling = (sibling||item).nextSibling;
				} while (sibling && !/\bitem\b/.test(sibling.className));

				if (sibling) {
					if (code == 39) {
						if (!isPlaceholder && !/\bplaceholder\b/.test(sibling.className)) {
							automator.insertBefore(item, sibling.nextSibling);
							item.focus();
						}
					} else {
						sibling.focus();
					}
				}
			}
		}
	}

	return false;
});

var dragStartHandler = eventHandler(function (target, item, automator, e) {
	if (/\btitle\b/.test(target.className) && !/\bplaceholder\b/.test(item.className)) {
		document.body.addEventListener('mouseup', dragEndHandler);
		document.body.addEventListener('mousemove', dragHandler);
		window._dragging = item;
		automator.setAttribute('data-offset', e.clientY);
		return false;
	}
});

var dragHandler = eventHandler(function (target, item, automator, e) {
	var pos = e.clientY,
	    offset = automator.getAttribute('data-offset'),
	    delta = pos - offset,
	    height = item.offsetHeight,
	    top = item.offsetTop,
	    bottom = height + top;

	if (!window._ghost) {
		if (Math.abs(delta) > 5) {
			window._ghost = document.createElement('li');
			window._ghost.className = 'item ghost';
			window._ghost.style.height = height + 'px';

			item.setAttribute('data-offset', item.offsetTop);
			item.style.width = item.offsetWidth - 2 + 'px';
			item.style.position = 'absolute';
			item.className += ' dragging';

			automator.insertBefore(window._ghost, item);
			automator.insertBefore(item, automator.childNodes[automator.childNodes.length-1].previousSibling);
		} else {
			return false;
		}
	}

	item.style.display = 'none';
	var tHover = document.elementFromPoint(e.clientX, automator.offsetTop + top + 10),
	    bHover = document.elementFromPoint(e.clientX, automator.offsetTop + bottom - 10);
	item.style.display = '';

	do {
		if (/\bitem\b/.test(tHover.className)) {	
			break;
		}
		tHover = tHover.offsetParent;
	} while (tHover && tHover.offsetParent);

	do {
		if (/\bitem\b/.test(bHover.className)) {	
			break;
		}
		bHover = bHover.offsetParent;
	} while (bHover && bHover.offsetParent);

	if (tHover && tHover.parentNode === automator && !/\bplaceholder\b/.test(tHover.className)) {
		if (item.offsetTop < tHover.offsetTop) {
			automator.insertBefore(window._ghost, tHover);
		}
	}
	if (bHover && bHover.parentNode === automator && !/\bplaceholder\b/.test(bHover.className)) {
		if (item.offsetTop + item.offsetHeight > bHover.offsetTop + bHover.offsetHeight) {
			automator.insertBefore(window._ghost, bHover.nextSibling);
		}
	}

	if (window._ghost) {
		var top = Math.max(5, Math.min(automator.offsetHeight - item.offsetHeight - 7, parseInt(item.getAttribute('data-offset')) + delta));
		item.style.top = top + 'px';
	}

	return false;
});

var dragEndHandler = eventHandler(function (target, item, automator, e) {
	if (window._ghost) {
		automator.insertBefore(item, window._ghost);
		automator.removeChild(window._ghost);
	}

	delete window._dragging;
	delete window._ghost;

	document.body.removeEventListener('mousemove', dragHandler);
	document.body.removeEventListener('mouseup', dragEndHandler);

	item.removeAttribute('data-offset');
	item.removeAttribute('style');
	item.className = item.className.replace(/\s*\bdragging\b/, '');

	automator.removeAttribute('data-offset');

	return false;
});

var automators = document.querySelectorAll('ol.automator');

for (var i = 0, l = automators.length; i < l; ++i) {
	automators[i].addEventListener('mousedown', dragStartHandler);
	automators[i].addEventListener('click', clickHandler);
	automators[i].addEventListener('dblclick', clickHandler)
	automators[i].addEventListener('keyup', clickHandler);
}
