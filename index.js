"use strict";
exports.__esModule = true;
var makerjs = require("makerjs");
function toEaselPoint(p, lh, rh) {
    var result = { x: p[0], y: p[1] };
    if (lh)
        result.lh = lh;
    if (rh)
        result.rh = rh;
    return result;
}
exports.toEaselPoint = toEaselPoint;
function fromEaselPoint(e) {
    if (!e)
        return [0, 0];
    return [e.x, e.y];
}
exports.fromEaselPoint = fromEaselPoint;
var EaselPathModel = (function () {
    function EaselPathModel(points) {
        var _this = this;
        this.models = {};
        this.paths = {};
        var connect = function (a, b) {
            var origin = fromEaselPoint(points[a]);
            var end = fromEaselPoint(points[b]);
            if (points[a].rh || points[b].lh) {
                var control1 = makerjs.point.add(origin, fromEaselPoint(points[a].rh));
                var control2 = makerjs.point.add(end, fromEaselPoint(points[b].lh));
                _this.models["Bezier" + i] = new makerjs.models.BezierCurve(origin, control1, control2, end);
            }
            else {
                _this.paths["ShapeLine" + i] = new makerjs.paths.Line(origin, end);
            }
        };
        for (var i = 1; i < points.length; i++) {
            connect(i - 1, i);
        }
    }
    return EaselPathModel;
}());
exports.EaselPathModel = EaselPathModel;
function importEaselShape(shape) {
    var model;
    //convert Easel objects to Maker.js models
    if (shape.type == 'rectangle') {
        model = new makerjs.models.Rectangle(shape.width, shape.height);
    }
    else {
        model = { models: {} };
        var pointsArray;
        if (Array.isArray(shape.points[0])) {
            pointsArray = shape.points;
        }
        else {
            pointsArray = [shape.points];
        }
        for (var i = 0; i < pointsArray.length; i++) {
            var points = pointsArray[i].map(fromEaselPoint);
            switch (shape.type) {
                case 'polygon':
                    model.models[i] = new makerjs.models.ConnectTheDots(true, points);
                    break;
                case 'path':
                    model.models[i] = new EaselPathModel(pointsArray[i]);
                    break;
                case 'polyline':
                    model.models[i] = new makerjs.models.ConnectTheDots(false, points);
                    break;
            }
        }
    }
    var scale = 1;
    var m1 = makerjs.measure.modelExtents(model);
    if (m1.width > shape.width) {
        scale = shape.width / m1.width;
    }
    makerjs.model.scale(model, scale);
    model = makerjs.model.mirror(model, shape.flipping.horizontal, shape.flipping.vertical);
    makerjs.model.zero(model);
    makerjs.model.originate(model);
    makerjs.model.rotate(model, makerjs.angle.toDegrees(shape.rotation));
    return model;
}
exports.importEaselShape = importEaselShape;
/**
 * Get key points (a minimal a number of points) along a chain of paths.
 *
 * @param chainContext Chain of paths to get points from.
 * @param maxArcFacet The maximum length between points on an arc or circle.
 * @returns Array of points which are on the chain.
 */
function exportChainToEaselPoints(chainContext) {
    function swapEndpoints(line) {
        var temp = line.origin;
        line.origin = line.end;
        line.end = temp;
    }
    function addLine(a) {
        var link = chainContext.links[a];
        var pathContext = makerjs.path.moveRelative(link.walkedPath.pathContext, link.walkedPath.offset);
        switch (pathContext.type) {
            case makerjs.pathType.Arc:
                var ellipticArc = new makerjs.models.EllipticArc(pathContext, 1, 1);
                var curveCount = makerjs.model.countChildModels(ellipticArc);
                for (var i = 0; i < curveCount; i++) {
                    var index = link.reversed ? curveCount - i : i + 1;
                    var id = 'Curve_' + index;
                    var bez = ellipticArc.models[id];
                    var seed = bez.seed;
                    if (link.reversed) {
                        swapEndpoints(seed);
                        seed.controls.reverse();
                    }
                    seed.controls[0] = makerjs.point.subtract(seed.controls[0], seed.origin);
                    seed.controls[1] = makerjs.point.subtract(seed.controls[1], seed.end);
                    lines.push(seed);
                }
                break;
            case makerjs.pathType.Line:
                var line = pathContext;
                if (link.reversed) {
                    swapEndpoints(line);
                }
                lines.push(line);
                break;
        }
    }
    var lines = [];
    for (var i = 0; i < chainContext.links.length; i++) {
        addLine(i);
    }
    function addPoint(prev, curr) {
        var prevSeed = prev;
        var currSeed = curr;
        var p = toEaselPoint(currSeed.origin);
        if (prevSeed && prevSeed.controls) {
            p.lh = toEaselPoint(prevSeed.controls[1]);
        }
        if (currSeed.controls) {
            p.rh = toEaselPoint(currSeed.controls[0]);
        }
        result.push(p);
    }
    var result = [];
    for (var j = 0; j < lines.length; j++) {
        addPoint(lines[j - 1], lines[j]);
    }
    var curr = lines[j - 1];
    var last = toEaselPoint(curr.end);
    if (curr.controls) {
        last.lh = toEaselPoint(curr.controls[1]);
    }
    result.push(last);
    return result;
}
exports.exportChainToEaselPoints = exportChainToEaselPoints;
