(function () {
    var doc = document.getElementById('doc');
    doc.contentEditable = true;
    doc.focus();

    var id = getUrlParameter('id');
    if (!id) {
        location.search = location.search ? '&id=' + getUniqueId() : 'id=' + getUniqueId();
        return;
    }

    return new Promise(function (resolve, reject) {
        try {
            var pusher = new Pusher('<INSERT_PUSHER_APP_KEY_HERE>');
            var channel = pusher.subscribe(id);
            channel.bind('client-text-edit', function (html) {
                var currentCursorPosition = getCaretCharacterOffsetWithin(doc);
                // Sanitize html before setting
                doc.innerHTML = sanitizeHtml(html);
                setCaretPosition(doc, currentCursorPosition);
            });
            channel.bind('pusher:subscription_succeeded', function () {
                resolve(channel);
            });
        } catch (error) {
            reject(error);
        }
    }).then(function (channel) {
        function triggerChange(e) {
            channel.trigger('client-text-edit', e.target.innerHTML);
        }

        doc.addEventListener('input', triggerChange);
    }).catch(function (error) {
        console.error('Error:', error);
    });

    function getUniqueId() {
        return 'private-' + Math.random().toString(36).substr(2, 9);
    }

    function getUrlParameter(name) {
        var params = new URLSearchParams(location.search);
        return params.get(name) || '';
    }

    function getCaretCharacterOffsetWithin(element) {
        var caretOffset = 0;
        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
            var range = sel.getRangeAt(0).cloneRange();
            range.setStart(element, 0);
            caretOffset = range.toString().length;
        }
        return caretOffset;
    }

    function setCaretPosition(el, pos) {
        var nodeStack = [el];
        var node;
        var foundStart = false;

        while (nodeStack.length > 0 && !foundStart) {
            node = nodeStack.pop();

            if (node.nodeType === 3) {
                var textLength = node.nodeValue.length;
                if (pos <= textLength) {
                    var range = document.createRange();
                    range.setStart(node, pos);
                    range.collapse(true);
                    var sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                    foundStart = true;
                } else {
                    pos -= textLength;
                }
            } else {
                var i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }
    }

    function sanitizeHtml(html) {
        // Implement your sanitization logic here
        return html;
    }
})();
