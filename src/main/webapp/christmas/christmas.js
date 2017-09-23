window.Christmas = (function () {
    "use strict";
    var svg = SVG({width: 1000, height: 625});
    var svgNode = svg.getSVG();


    // Adapted from https://stackoverflow.com/a/39187274/195833
    function gaussianRand(n) {
        var rand = 0;

        for (var i = 0; i < n; i += 1) {
            rand += Math.random();
        }

        return rand / n;
    }

    function drawTriangle(y, s, x1, x2, l, h) {
        var sqrt3 = Math.sqrt(3);

        var path = svg.drawPath([

            "M", x1 * (s), (1 / (2 * sqrt3) + y) * s,
            "L", x2 * (s), (1 / (2 * sqrt3) + y) * s,
            "L", 0, (-1 / sqrt3 + y) * s,
            "Z"
        ].join(" "));
        path.setAttribute("fill", "hsl(" + h + ", 55%, " + l + "%)");
    }

    function drawTrunk(y, x1, x2, l, w) {

        var path = svg.drawPath([
            "M", x1, w + y,
            "L", x1, -w + y,
            "L", x2, -w + y,
            "L", x2, w + y,
            "Z"
        ].join(" "));
        path.setAttribute("fill", "hsl(25, 55%, " + l + "%)");
    }

    function drawTree(fill) {
        var i, j, scale;

        var shades = [[-0.4, 0.4, 25], [-0.3, 0.3, 35], [-0.2, 0.2, 45], [0.13, 0.05, 55]];

        svg.startGroup("class", "tree");
        svg.startGroup("class", "trunk");
        for (i = 0; i < shades.length; i += 1) {
            drawTrunk(.3, shades[i][0] / 4, shades[i][1] / 4, shades[i][2], 0.15);
        }
        svg.endGroup();

        for (i = 0; i < 3; i += 1) {

            svg.startGroup("class", "branch");
            for (j = 0; j < shades.length; j += 1) {
                drawTriangle(-i / 2, 1 - (0.2 * i), shades[j][0], shades[j][1], shades[j][2], fill);
            }
            svg.endGroup();
        }
        svg.endGroup();
    }

    function drawSnow(width, height) {
        var i, flake;
        var flakeTypes = ["\u2744", "\u2745", "\u2746"];
        var flakes = [];

        for (i = 0; i < flakeTypes.length; i += 1) {
            flake = svg.drawText(0, 0, flakeTypes[i]);
            flake.setAttribute("id", flakeTypes[i]);
            svg.addDef(flake);
        }

        svg.startGroup("class", "snowflakes", "fill", "white");
        for (i = 0; i < 300; i += 1) {
            svg.addUse("#\u2744", Math.random() * width, Math.random() * height);
        }
        svg.endGroup();

        setInterval(function () {
            for (i = 0; i < flakes.length; i += 1) {
                flakes[i].setAttribute("class", "snowflake");
            }
        }, 25);

    }

    function drawBackground(width, height) {
        var i, star, x, y, scale;
        var grad = svg.createLinearGradient("background", [
            {offset: "20%", "stop-color": "#FFFAFA"},
            {offset: "25%", "stop-color": "#303030"},
            {offset: "65%", "stop-color": "#202020"},
            {offset: "80%", "stop-color": "black"}
        ]);

        grad.setAttribute("x1", "50%");
        grad.setAttribute("y1", "100%");
        grad.setAttribute("x2", "50%");
        grad.setAttribute("y2", "0%");

        svg.startGroup("fill", "url(#background)");
        svg.drawPath(["M", -width, -height, "L", width, -height, "L ", width, height, "L", -width, height, "Z"].join(" "));
        svg.endGroup();

        svg.startGroup("fill", "yellow");
        for (i = 0; i < 200; i += 1) {
            y = gaussianRand(6);
            y = (y * 2 * height) - height;
            if (y > 0) {
                y = -y;
            }
            y = -height - y;

            x = (Math.random() * 2 * width) - width;
            scale = Math.random() * 0.1;

            svg.startGroup("transform", "translate(" + x + "," + y + ")  scale(" + scale + "," + scale + ") rotate(" + Math.round(Math.random() * 360) + ")");
            star = svg.drawStar(10, 20, Math.round(Math.random() * 3) + 5);

            star.setAttribute("class", "twinkle");
            star.setAttribute("style", "animation-delay: " + Math.random() * 15 + "s");
            svg.endGroup();
        }
        svg.endGroup();
    }

    function drawForrest(width, height) {
        var scale, cord, i, fill, cords, x1, y1;

        cords = [];
        for (i = 0; i < 150; i += 1) {
            cords.push({
                x: (gaussianRand(2) * 2 * width) - width,
                y: (Math.random() * 2 * height) - height
            });
        }

        cords.sort(function (a, b) {
            return a.y - b.y;
        });

        for (i = 0; i < cords.length; i += 1) {
            cord = cords[i];

            x1 = 1.5 * (1 + cord.y / (2 * height)) * cord.x;
            y1 = cord.y / 4 + 3 * height / 4;

            fill = gaussianRand(6) * 20 + 90;
            scale = (cord.y + height) / 250;

            y1 -= 15 * scale;

            svg.startGroup("transform", "translate(" + x1 + "," + y1 + ") scale(" + 40 * scale + "," + 40 * scale + ")");
            drawTree(fill);
            //svg.drawStar(5, 15, 5);

            svg.endGroup();
        }

    }

    function init() {

        document.querySelector("#holder").appendChild(svgNode);

        var width = 160;
        var height = 100;

        svgNode.setAttribute("viewBox", [-width, -height, width * 2, height * 2].join(" "));

        drawBackground(width, height);
        //  drawSnow(width, height);
        drawForrest(width, height);
    }

    init();

})();

