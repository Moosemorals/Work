
window.Christmas = (function () {
    "use strict";
    var svg = SVG({width: 640, height: 640});
    var svgNode = svg.getSVG();


    function drawTriangle(x1, x2,l, h) {
        var sqrt3 = Math.sqrt(3);
        
        var path = svg.drawPath([

            "M", x1, 1 / (2 * sqrt3),
            "L", x2, 1 / (2 * sqrt3),
            "L", 0, -1 / sqrt3,
            "Z"
        ].join(" "));
        path.setAttribute("fill", "hsl(" + h + ", 55%, " + l + "%)");
    }

    function drawTrunk(x1, x2, l, h) {

        var path = svg.drawPath([            
            "M", x1, h,
            "L", x1, -h,
            "L", x2, -h,
            "L", x2, h,
            "Z"
        ].join(" "));
        path.setAttribute("fill", "hsl(25, 55%, " + l + "%)");
    }

    function drawTree(x, y, fill) {
        var i, j, scale;

        var shades = [[-0.4, 0.4, 25], [-0.3, 0.3, 35], [-0.2, 0.2, 45], [0.13, 0.05, 55]];

        svg.startGroup("transform", "translate(" + x + "," + (y + 20) + ") scale(10, 50)");
        for (i = 0; i < shades.length; i += 1) {
            drawTrunk(shades[i][0], shades[i][1], shades[i][2], 0.25);
        }
        svg.endGroup();

        for (i = 0; i < 3; i += 1) {
            scale = 50 - (i * 12);
            svg.startGroup("transform", "translate(" + x + "," + (y - (50 - scale)) + ") scale(" + scale + "," + scale + ")");
            for (j = 0; j < shades.length; j += 1) {
                drawTriangle(shades[j][0], shades[j][1], shades[j][2], fill );
            }
            svg.endGroup();
        }
    }
    
    function drawBackground() {
        var i, star;
        var grad = svg.createLinearGradient("background", [
            {offset: "25%", "stop-color": "white"},
            {offset: "50%", "stop-color": "black"}
        ]);
        
        grad.setAttribute("x1", "50%");
        grad.setAttribute("y1", "100%");
        grad.setAttribute("x2", "50%");
        grad.setAttribute("y2", "0%");
        
        svg.startGroup("fill", "url(#background)");
        svg.drawPath("M 0 0 L 200 0 L 200 200 L 0 200 Z");
        svg.endGroup();
        
        svg.startGroup("fill", "yellow");
        for (i = 0; i < 40; i += 1) {
            star = svg.drawText(Math.random() * 200 / 0.2, Math.random() * 60 / 0.2, "\u2605");
            star.setAttribute("transform", "scale(0.2, 0.2)");
            star.setAttribute("class", "twinkle");
            star.setAttribute("style", "animation-delay: " + Math.random() * 30 + "s");
        }
        svg.endGroup();
    }

    function init() {
        var i, j, fill, scale;
        svgNode.setAttribute("viewBox", "0 0 200 200");

        var cords = [];
        
        drawBackground();

        for (i = 0; i < 5; i += 1) {
            for (j = 0; j < 5; j += 1) {
                cords.push([Math.random() * 10 + (i  * 40) + j, 100 - (j * 4) + Math.random() * 10]);
            }
        }

        cords.sort(function (a, b) {
            return a[1] - b[1];
        });

        for (i = 0; i < cords.length; i += 1) {
            fill = Math.random() * 20 + 90;
            scale = 1 + Math.floor(i / 5) * 0.1;
            svg.startGroup("transform", "scale(" + scale + "," + scale + ")");
            drawTree(cords[i][0], cords[i][1], fill);  
            svg.endGroup();
        }


        document.querySelector("#holder").appendChild(svgNode);
    }

    init();

})();

