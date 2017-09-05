
window.Christmas = (function () {
    "use strict";
    var svg = SVG({width: "100%", height: "100%"});
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

    function drawBackground(width, height) {
        var i, star, y;
        var grad = svg.createLinearGradient("background", [
            {offset: "20%", "stop-color": "#98641E"},
            {offset: "25%", "stop-color": "#505050"},
            {offset: "55%", "stop-color": "#303030"},
            {offset: "80%", "stop-color": "black"}
        ]);

        grad.setAttribute("x1", "50%");
        grad.setAttribute("y1", "100%");
        grad.setAttribute("x2", "50%");
        grad.setAttribute("y2", "0%");

        svg.startGroup("fill", "url(#background)");
        svg.drawPath(["M 0 0 L ", width, " 0 L ", width, height, " L 0 ", height, "Z"].join(" "));
        svg.endGroup();

        svg.startGroup("fill", "yellow");
        for (i = 0; i < 300; i += 1) {
            y = gaussianRand(6);                        
            y = (y * 2 * height) - height;
            if (y < 0) {
                y = -y;
            }
            
            svg.startGroup("transform", "translate(" + Math.random() * width + "," + y + ")");
            star = svg.drawText(0, 0, "\u2605");
            star.setAttribute("transform", "scale(0.2, 0.2)");
            star.setAttribute("class", "twinkle");
            star.setAttribute("style", "animation-delay: " + Math.random() * 30 + "s");
            svg.endGroup();
        }
        svg.endGroup();
    }

    function init() {
        var row, col, fill, scale, cord, i, bbox, rows, cols;
        var colSpacing = 200;
        document.querySelector("#holder").appendChild(svgNode);
        bbox = svgNode.getBoundingClientRect();

        var width = bbox.width;
        var height = bbox.height;

        rows = 4;
        cols = Math.floor(width / colSpacing);

        var cords = [];

        drawBackground(width, height);

        for (row = 0; row < rows; row += 1) {
            for (col = -1; col < cols + 2; col += 1) {
                cords.push({
                    x: gaussianRand(6) * 5 + col * colSpacing + colSpacing * ((col > cols / 2 ? -row : row) / rows),
                    y: height - (height / 7),
                    col: col,
                    row: row
                });
            }
        }

        cords.sort(function (a, b) {
            if (a.row === b.row) {
                return Math.random() - 0.5;
            } else {
                return b.row - a.row;
            }
        });

        for (i = 0; i < cords.length; i += 1) {
            cord = cords[i];
            fill = gaussianRand(6) * 20 + 90;
            scale = (height / 4) - cord.row * 5;
            svg.startGroup("transform", "translate(" + cord.x + "," + cord.y + ") scale(" + scale + "," + scale + ")");
            drawTree(fill);
            svg.endGroup();
        }
    }

    init();

})();

