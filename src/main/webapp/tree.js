
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

    function addCircle(x, y, radius) {
        _add(buildElement("circle", "cx", x, "cy", y, "r", radius));
    }

    function addLine(x1, y1, x2, y2) {
        var path = ["M", x1, y1, "L", x2, y2].join(" ");
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
        startGroup: createGroup,
        endGroup: leaveGroup,
        getSVG, svg
    };

};

$(function () {
    "use strict";

    var svg = SVG();
    var SPACING = 20;

    var process;

    function drawNode(id, depth, visited, parent) {
        if (id !== "end") {

            visited[id] = true;
        }

        var i, group, width, w, groups = [], bbox;
        var node = process.flow[id];

        width = 1;
        svg.drawCircle(0, 0, SPACING / 2);
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
        
        if (parent !== null) {
            
        }

        var children = node.next;
        if (children === undefined) {
            return width;
        }

        for (i = 0; i < children.length; i += 1) {
            if (children[i] in visited) {
                continue;
            }
            group = svg.startGroup("fill", "black");
            w = drawNode(children[i], depth + 1, Object.assign(visited), group);
            if (w > width) {
                width = w;
            }
            svg.endGroup();
            if (groups.length > 0) {
                bbox = groups[groups.length - 1].getBoundingClientRect();
                //group.setAttribute("transform", "translate(" + (SPACING * width) + "," + (bbox.bottom) + ")");
                group.setAttribute("transform", "translate(" + bbox.right + "," + (SPACING * width)  + ")");                
            } else {
                //group.setAttribute("transform", "translate(" + (SPACING * width) + "," + 0 + ")");
                group.setAttribute("transform", "translate(" + 0 + "," + (SPACING * width) + ")");                
            }
            groups.push(group);
        }
        
        return children.length;
    }

    function handleLoad(json) {
        process = json;
        document.querySelector("#holder").appendChild(svg.getSVG());
        svg.startGroup("fill", "black", "transform", "translate(" + SPACING + "," + SPACING + ")");
        drawNode("start", 0, {});
        svg.endGroup();


    }

    $.getJSON("oct9001.json")
            .done(handleLoad);

});