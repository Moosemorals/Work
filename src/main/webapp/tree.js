
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

    function drawNode(id, depth, visited, parent) {

        var i, groups = [], bbox, circle, labelGroup, parentGroup, type;
        var node = process.flow[id];
        
        type = node.type.substring(0, node.type.length - "Stanza".length);

        labelGroup = svg.startGroup("class", "label");
        
        labelGroup.dataset.text = node.text;
        labelGroup.dataset.id = id;
        labelGroup.classList.add(type);
        labelGroup.classList.add("id-" + id);
        
        circle = svg.drawCircle(0, 0, (SPACING / 2));        
        
        if (parent !== undefined) {
            circle.dataset.parent = parent;
        }

        svg.startGroup();
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

        if (id in visited) {
            labelGroup.classList.add("loop");
            return;
        }
        if (id !== "end") {
            visited[id] = true;
        }

        for (i = 0; i < children.length; i += 1) {
            groups.push(svg.startGroup());
            drawNode(children[i], depth + 1, Object.assign(visited), id);
            svg.endGroup();
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

        $(svgNode).find(".label").each(function () {
            var node = process.flow[this.dataset.id];            
            var type = node.type.substring(0, node.type.length - "Stanza".length);            
            var options = {
                title: type,
                trigger: "hover"
            };
            
            if (type !== "End") {
                options.content = lookupText(node.text);                
            } else {
                options.template = '<div class="popover" role="tooltip"><div class="popover-arrow"></div><h3 class="popover-title"></h3></div>';
            }
                        
            $(this).popover(options);            
        });
        
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