/*

makerjs-easel-api
Integration between Maker.js and Inventables Easel Api 2.0

https://github.com/danmarshall/makerjs-easel-api

Copyright 2107 Dan Marshall

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

import * as makerjs from "makerjs";

export interface EaselPoint {
    x: number,
    y: number,
}

export interface EaselPathPoint extends EaselPoint {
    lh?: EaselPoint;
    rh?: EaselPoint;
}

export interface EaselShape {
    type: String; // "rectangle", "ellipse", "polygon", "path", "polyline", "line"
    flipping: {
        horizontal: boolean, // True if the shape is "flipped" horizontally
        vertical: boolean    // True if the shape is "flipped" vertically
    };
    center: EaselPoint;
    width: number;    // Width in inches of the shape
    height: number;   // Height in inches of the shape
    rotation: number; // Amount of counter-clockwise rotation in radians    
}

export interface EaselLine extends EaselShape {
    point1: EaselPoint;
    point2: EaselPoint;
}

export interface EaselPolyline extends EaselShape {
    points: EaselPoint[];
}

export interface EaselPolygon extends EaselShape {
    points: EaselPoint[];
}

export interface EaselPath extends EaselShape {
    points: EaselPoint[][];
}

export interface EaselText extends EaselShape {
    font: string;
    text: string;
}

export function toEaselPoint(p: makerjs.IPoint, lh?: EaselPoint, rh?: EaselPoint): EaselPathPoint {
    var result: EaselPathPoint = { x: p[0], y: p[1] };
    if (lh) result.lh = lh;
    if (rh) result.rh = rh;
    return result;
}

export function fromEaselPoint(e: EaselPoint): makerjs.IPoint {
    if (!e) return [0, 0];
    return [e.x, e.y];
}

export class EaselPathModel implements makerjs.IModel {

    public models: makerjs.IModelMap = {};
    public paths: makerjs.IPathMap = {};

    constructor(points: EaselPathPoint[]) {

        var connect = (a: number, b: number) => {

            var origin = fromEaselPoint(points[a]);
            var end = fromEaselPoint(points[b]);

            if (points[a].rh || points[b].lh) {
                var control1: makerjs.IPoint = makerjs.point.add(origin, fromEaselPoint(points[a].rh));
                var control2: makerjs.IPoint = makerjs.point.add(end, fromEaselPoint(points[b].lh));
                this.models["Bezier" + i] = new makerjs.models.BezierCurve(origin, control1, control2, end);
            } else {
                this.paths["ShapeLine" + i] = new makerjs.paths.Line(origin, end);
            }
        }

        for (var i = 1; i < points.length; i++) {
            connect(i - 1, i);
        }

    }
}

export function importEaselShape(shape: EaselPath | EaselPolygon | EaselPolyline) {
    var model: makerjs.IModel;

    //convert Easel objects to Maker.js models
    if (shape.type == 'rectangle') {
        model = new makerjs.models.Rectangle(shape.width, shape.height);
    } else {

        model = { models: {} };

        var pointsArray;

        if (Array.isArray(shape.points[0])) {
            pointsArray = shape.points;
        } else {
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

/**
 * Get key points (a minimal a number of points) along a chain of paths.
 * 
 * @param chainContext Chain of paths to get points from.
 * @param maxArcFacet The maximum length between points on an arc or circle.
 * @returns Array of points which are on the chain.
 */
export function exportChainToEaselPoints(chainContext: makerjs.IChain): EaselPathPoint[] {

    function swapEndpoints(line: makerjs.IPathLine) {
        var temp = line.origin;
        line.origin = line.end;
        line.end = temp;
    }

    function addLine(a: number) {
        var link = chainContext.links[a];
        var pathContext = makerjs.path.moveRelative(link.walkedPath.pathContext, link.walkedPath.offset);

        switch (pathContext.type) {
            case makerjs.pathType.Arc:
                var ellipticArc = new makerjs.models.EllipticArc(pathContext as makerjs.IPathArc, 1, 1);
                var curveCount = makerjs.model.countChildModels(ellipticArc);

                for (var i = 0; i < curveCount; i++) {
                    var index = link.reversed ? curveCount - i : i + 1;
                    var id = 'Curve_' + index;
                    var bez = ellipticArc.models[id] as makerjs.models.BezierCurve;
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
                var line = pathContext as makerjs.IPathLine;
                if (link.reversed) {
                    swapEndpoints(line);
                }
                lines.push(line);
                break;
        }

    }

    var lines: makerjs.IPathLine[] = [];
    for (var i = 0; i < chainContext.links.length; i++) {
        addLine(i);
    }

    function addPoint(prev: makerjs.IPathLine, curr: makerjs.IPathLine) {
        var prevSeed = prev as makerjs.IPathBezierSeed;
        var currSeed = curr as makerjs.IPathBezierSeed;

        var p = toEaselPoint(currSeed.origin);

        if (prevSeed && prevSeed.controls) {
            p.lh = toEaselPoint(prevSeed.controls[1]);
        }

        if (currSeed.controls) {
            p.rh = toEaselPoint(currSeed.controls[0]);
        }

        result.push(p)
    }

    var result: EaselPathPoint[] = [];
    for (var j = 0; j < lines.length; j++) {
        addPoint(lines[j - 1], lines[j]);
    }

    var curr = lines[j - 1] as makerjs.IPathBezierSeed;
    var last = toEaselPoint(curr.end);
    if (curr.controls) {
        last.lh = toEaselPoint(curr.controls[1]);
    }
    result.push(last);

    return result;
}
