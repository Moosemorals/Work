
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
        addPath(["M", x1, y1, "L", x2, y2].join(" "));
    }

    function addPath(path) {
        _add(buildElement("path", "d", path));
    }

    function addText(x, y, string) {
        var text = buildElement("text", "x", x, "y", y);
        text.appendChild(document.createTextNode(string));
        _add(text);
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

    function drawNode(id, depth, visited, parent) {
        if (id !== "end") {
            visited[id] = true;
        }

        var i, group, width, w, groups = [], bbox, circle, labelGroup, parentGroup;
        var node = process.flow[id];

        labelGroup = svg.startGroup();
        circle = svg.drawCircle(0, 0, (SPACING / 2));
        circle.dataset.text = node.text;
        circle.dataset.id = id;

        if (parent !== undefined) {
            circle.dataset.parent = parent;
        }

        svg.startGroup("fill", "white", "text-anchor", "middle");
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
        svg.endGroup();

        var children = node.next;
        if (children === undefined) {
            return;
        }

        for (i = 0; i < children.length; i += 1) {
            if (children[i] in visited) {
                continue;
            }
            group = svg.startGroup("fill", "black");
            drawNode(children[i], depth + 1, Object.assign(visited), id);
            svg.endGroup();
            groups.push(group);
        }
        for (i = 0; i < groups.length; i += 1) {
            if (i > 0) {
                bbox = groups[i - 1].getBoundingClientRect();
                groups[i].setAttribute("transform", "translate(" + bbox.right + "," + (SPACING * 1.5) + ")");
            } else {
                groups[i].setAttribute("transform", "translate(" + 0 + "," + (SPACING * 1.5) + ")");
            }
        }

        parentGroup = svg.getGroup();
        if (children.length > 1 && parentGroup !== undefined) {
            bbox = labelGroup.getBoundingClientRect();
            labelGroup.setAttribute("transform", "translate(" + (parentGroup.getBoundingClientRect().width / 2 - bbox.width / 2) + ", 0)");
        }
        return;
    }

    function drawEdges() {
        var root = svg.getSVG();
        var rootBB = root.getBoundingClientRect();

        var group = svg.startGroup("stroke", "green", "fill", "none", "transform", "translate(" + -rootBB.left + "," + -rootBB.top + ")");
        svg.drawLine(0, 0, 0, 100);
        svg.drawLine(0, 0, 100, 0);
        document.querySelectorAll("svg circle").forEach(function (node) {
            var parent, myBB, parentBB;
            if (!node.dataset.parent) {
                return;
            }

            parent = node.parentNode.parentNode.parentNode.querySelector("circle");

            myBB = node.getBoundingClientRect();
            parentBB = parent.getBoundingClientRect();

            var start = {
                x :myBB.left + myBB.width / 2, 
                y: myBB.top
            };
            var end = {
                x: parentBB.left + parentBB.width / 2,
                y: parentBB.bottom
            };
                        
            svg.drawPath([
                "M", start.x, start.y,
                "L", start.x, start.y - (SPACING / 3),
                "L", end.x, start.y - (SPACING / 3),
                "L", end.x, end.y
            ].join(" "));

            
        });
        svg.endGroup();

        svg.getSVG().insertBefore(group, svg.getSVG().firstChild);
    }

    function buildAlert(type, text) {
        var div = document.createElement("div");
        div.classList.add("alert");
        div.classList.add("alert-" + type);
        div.appendChild(document.createTextNode(text));
        return div;
    }

    function handleLoad(json) {
        process = json;
        document.querySelector("#holder").appendChild(svg.getSVG());
        svg.startGroup("fill", "black", "transform", "translate(" + (SPACING / 2) + "," + (SPACING / 2) + ")");
        drawNode("start", 0, {});
        svg.endGroup();
        drawEdges();

        var bbox = svg.getSVG().firstChild.getBBox();
        svg.getSVG().setAttribute("width", bbox.width);
        svg.getSVG().setAttribute("height", bbox.height);

        svg.getSVG().addEventListener("mouseenter", function (e) {
            if (e.target.nodeName === "circle") {
                console.log(lookupText(parseInt(e.target.dataset.text)));
            }            
        }, true);

    }

    $.getJSON("oct9001.json")
            .done(handleLoad
                    );



});