
window.SVG = function (options) {
    "use strict";
    options = options || {};

    var NS = "http://www.w3.org/2000/svg";
    var groupStack = [];

    var svg = buildElement("svg", "width", ("width" in options ? options.width : 640), "height", ("height" in options ? options.height : 480));

    function buildElement(name) {
        var i;
        var el = document.createElementNS(NS, name);

        if (arguments.length > 1 && arguments.length % 2 !== 1) {
            throw new Error("Attributes must come in pairs");
        }

        for (i = 1; i < arguments.length; i += 2) {
            el.setAttribute(arguments[i], arguments[i + 1]);
        }

        return el;
    }

    function _add(el) {
        if (groupStack.length > 0) {
            groupStack[groupStack.length - 1].appendChild(el);
        } else {
            svg.appendChild(el);
        }
        return el;
    }

    function buildTitle(text) {
        var title = document.createElement("title");
        title.appendChild(document.createTextNode(text));
        return title;
    }

    function addCircle(x, y, radius, title) {
        var circle = buildElement("circle", "cx", x, "cy", y, "r", radius);
        if (title !== undefined) {
            circle.appendChild(buildTitle(title));
        }

        _add(circle);
        return circle;
    }

    function addLine(x1, y1, x2, y2) {
        return addPath(["M", x1, y1, "L", x2, y2].join(" "));
    }

    function addPath(path) {
        return _add(buildElement("path", "d", path));
    }

    function addText(x, y, string) {
        var text = buildElement("text", "x", x, "y", y);
        text.appendChild(document.createTextNode(string));
        return _add(text);
    }

    function createGroup() {
        var args = ["g"], i, g;

        for (i = 0; i < arguments.length; i += 1) {
            args.push(arguments[i]);
        }
        g = buildElement.apply(this, args);

        groupStack.push(g);
        if (groupStack.length > 1) {
            groupStack[groupStack.length - 2].appendChild(g);
        } else {
            svg.appendChild(g);
        }

        return g;
    }

    function getGroup() {
        if (groupStack.length > 0) {
            return groupStack[groupStack.length - 1];
        } else {
            return undefined;
        }
    }
    function add(el) {
        svg.appendChild(el);
        return el;
    }

    function leaveGroup() {
        groupStack.pop();
    }

    function getSVG() {
        return svg;
    }

    return {
        buildElement: buildElement,
        drawCircle: addCircle,
        drawLine: addLine,
        drawText: addText,
        drawPath: addPath,
        startGroup: createGroup,
        getGroup: getGroup,
        endGroup: leaveGroup,
        add: add,
        getSVG, svg
    };

};

$(function () {
    "use strict";

    var svg = SVG();
    var SPACING = 30;

    var process;

    function findPath(start, end, visited, path) {

        visited[start] = true;
        path.push(start);
        if (start === end) {
            console.log(path);
        } else {
            process.flow[start].next.forEach(function (id) {
                if (!visited[id]) {
                    findPath(id, end, visited, path);
                }
            });
        }
        path.pop();
        visited[start] = false;
    }

    function lookupText(id) {
        var phrase = process.phrases[id];
        if (Array.isArray(phrase)) {
            return phrase[0];
        } else {
            return phrase;
        }
    }

    function printAllPaths(start, end) {
        var visited = {};
        var path = [];
        Object.keys(process.flow).forEach(function (id) {
            visited[id] = false;
        });
        findPath(start, end, visited, path);
    }

    function drawLabel(node, id, parent) {
        var result, circle, type;

        type = node.type.substring(0, node.type.length - "Stanza".length);

        result = svg.startGroup("class", "label");
        result.dataset.text = node.text;
        result.dataset.id = id;
        result.classList.add(type);
        result.classList.add("id-" + id);

        circle = svg.drawCircle(0, 0, (SPACING / 2));

        if (parent !== undefined) {
            circle.dataset.parent = parent;
        }

        switch (id) {
            case "start":
                svg.drawText(0, SPACING / 4, "s");
                break;
            case "end":
                svg.drawText(0, SPACING / 4, "e");
                break;
            default:
                svg.drawText(0, SPACING / 4, id);
        }
        svg.endGroup();

        return result;
    }

    function drawNode(id, depth, visited, parent) {

        if (depth > 50) {
            throw new Error("Ooops");
        }

        var i, groups = [], bbox, label, count, left, child;
        var node = process.flow[id];

        label = drawLabel(node, id, parent);

        var children = node.next;
        if (id in visited) {
            label.classList.add("loop");
            children = undefined;
        }

        if (id !== "end") {
            visited[id] = true;
        }

        count = 0;        
        if (children !== undefined) {

            for (i = 0; i < children.length; i += 1) {
                child = {};
                child.group = svg.startGroup("class", "outer");
                child.count = drawNode(children[i], depth + 1, Object.assign(visited), id);
                svg.endGroup();

                count += child.count;
                groups.push(child);
            }
            
            for (i = 0; i < groups.length; i += 1) {
                child = groups[i];
                left = (count * SPACING * 1.1 * i) / Math.max(1, child.count);
                child.group.setAttribute("transform", "translate(" + left + "," + (SPACING * 1.5) + ")");
            }
        }

        bbox = label.getBoundingClientRect();
        left = (Math.max(1, count) * SPACING * 1.1) - (bbox.width / 2);
        label.setAttribute("transform", "translate(" + left + ", 0)");

        console.log("    ", id, depth, count);
        return Math.max(1, count);
    }

    function drawEdges() {
        var root = svg.getSVG();
        var rootBB = root.getBoundingClientRect();

        var group = svg.startGroup("class", "edge", "transform", "translate(" + -rootBB.left + "," + -rootBB.top + ")");
        svg.drawLine(0, 0, 0, 100);
        svg.drawLine(0, 0, 100, 0);
        document.querySelectorAll("svg circle").forEach(function (node) {
            var parent, myBB, parentBB, myId, parentId, line;
            myId = node.dataset.id;
            parentId = node.dataset.parent;
            if (!parentId) {
                return;
            }

            parent = node.parentNode.parentNode.parentNode.querySelector("circle");

            myBB = node.getBoundingClientRect();
            parentBB = parent.getBoundingClientRect();

            var start = {
                x: myBB.left + myBB.width / 2,
                y: myBB.top
            };
            var end = {
                x: parentBB.left + parentBB.width / 2,
                y: parentBB.bottom
            };

            line = svg.drawPath([
                "M", start.x, start.y,
                "L", start.x, start.y - (SPACING / 3),
                "L", end.x, start.y - (SPACING / 3),
                "L", end.x, end.y
            ].join(" "));

            if ("answers" in process.flow[parentId]) {
                process.flow[parentId].next.forEach(function (id, index) {
                    if (id === myId) {
                        line.dataset.text = process.flow[parentId].answers[index];
                    }
                });
                line.classList.add("answer");
            }

        });
        svg.endGroup();

        svg.getSVG().insertBefore(group, svg.getSVG().firstChild);
    }

    function alert(type, text) {
        $("#alert").empty();
        if (arguments.length === 2) {
            $("#alert").append(buildAlert(type, text));
        }
    }

    function buildAlert(type, text) {
        var div = document.createElement("div");
        div.classList.add("alert");
        div.classList.add("alert-" + type);
        div.appendChild(document.createTextNode(text));
        return div;
    }

    function findClosest(source, targetClass) {
        var svgNode = svg.getSVG();
        while (source !== svgNode && !source.classList.contains(targetClass)) {
            source = source.parentNode;
        }

        if (source.classList.contains("label")) {
            return source;
        } else {
            return undefined;
        }
    }

    var dragData;
    function mouseDownHandler(e) {
        var bbox;
        var svgNode = svg.getSVG();
        var target = findClosest(e.target, "label");
        if (target === undefined) {
            return;
        }

        target.classList.add("dragSource");

        bbox = target.getBoundingClientRect();

        dragData = {};
        dragData.offsetX = bbox.left + window.scrollX;
        dragData.offsetY = bbox.top + window.scrollY - SPACING;
        dragData.startX = e.offsetX;
        dragData.startY = e.offsetY;
        dragData.dragSource = target;
        dragData.dragImage = target.cloneNode(true);

        svgNode.appendChild(dragData.dragImage);
        dragData.dragImage.setAttribute("transform", "translate(" + dragData.offsetX + ", " + dragData.offsetY + ")");


        svgNode.addEventListener("mousemove", mouseMoveHandler);
        svgNode.addEventListener("mouseup", mouseUpHandler);
    }

    function mouseMoveHandler(e) {

        var offsetX = dragData.offsetX + (e.offsetX - dragData.startX);
        var offsetY = dragData.offsetY + (e.offsetY - dragData.startY);

        dragData.dragImage.setAttribute("transform", "translate(" + offsetX + ", " + offsetY + ")");

        var target = findClosest(document.elementFromPoint(e.clientX, e.clientY), "label");
        if (target !== undefined) {

            if (dragData.over !== target) {
                if (dragData.over !== undefined) {
                    dragData.over.classList.remove("dragOver");
                }
                target.classList.add("dragOver");
                dragData.over = target;
            }
        } else {
            if (dragData.over !== undefined) {
                dragData.over.classList.remove("dragOver");
                delete dragData.over;
            }
        }
    }

    function mouseUpHandler(e) {
        var svgNode = svg.getSVG();

        if (dragData.over !== undefined) {
            dragData.over.classList.remove("dragOver");
        }

        dragData.dragSource.classList.remove("dragSource");

        dragData.dragImage.parentNode.removeChild(dragData.dragImage);

        dragData = {};
        svgNode.removeEventListener("mousemove", mouseMoveHandler);
        svgNode.removeEventListener("mouseup", mouseUpHandler);
    }

    function handleLoad(json) {
        process = json;

        var svgNode = svg.getSVG();

        document.querySelector("#holder").appendChild(svgNode);
        svg.startGroup("fill", "black", "transform", "translate(" + (SPACING / 2) + "," + (SPACING / 2) + ")");
        drawNode("start", 0, {});
        svg.endGroup();
        drawEdges();

        var bbox = svgNode.firstChild.getBBox();
        svgNode.setAttribute("width", bbox.width);
        svgNode.setAttribute("height", bbox.height);

        $(svgNode).on("mouseover", ".loop", function () {
            var id = this.dataset.id;
            $(svgNode).find(".id-" + id).addClass("flash");
        }).on("mouseout", ".loop", function () {
            var id = this.dataset.id;
            $(svgNode).find(".id-" + id).removeClass("flash");
        });

        $(svgNode).find(".answer").each(function () {
            var answer = lookupText(parseInt(this.dataset.text));
            $(this).popover({
                content: answer,
                trigger: "hover"
            });
        });
    }

    $.getJSON("oct9001.json")
            .done(handleLoad);



});