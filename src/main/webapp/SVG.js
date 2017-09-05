
window.SVG = function (options) {
    "use strict";
    options = options || {};

    var NS = "http://www.w3.org/2000/svg";
    var groupStack = [];

    var svg = buildElement("svg", "width", ("width" in options ? options.width : 640), "height", ("height" in options ? options.height : 480));
    
    var defs = undefined;    


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
    
    function addToDefs(el) {
        if (defs === undefined) {
            defs = buildElement("defs");
            svg.appendChild(defs);
        }
        
        defs.appendChild(el);        
    }
    
    function addUse(href, x, y, width, height) {
        var use = buildElement("use", "x", x, "y", y);
        
        if (width !== undefined && height !== undefined) {
            use.setAttribute("width", width);
            use.setAttribute("height", height);
        }
        
        use.setAttributeNS("http://www.w3.org/1999/xlink", "href", href);        
        
        _add(use);
        
        return use;
    }
    
    function buildLinearGradient(id, stops) {
        var i, stop, key, value;
        var grad = buildElement("linearGradient", "id", id);
        for (i = 0; i < stops.length; i += 1) { 
            stop = buildElement("stop");
            for (key in stops[i]) {
                value = stops[i][key];
                stop.setAttribute(key, value);
            }
            grad.appendChild(stop);
        }
        
        addToDefs(grad);      
        return grad;
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
        createLinearGradient: buildLinearGradient,
        addDef: addToDefs,
        addUse: addUse,
        add: add,
        getSVG, svg
    };

};


