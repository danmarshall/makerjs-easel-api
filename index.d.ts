import * as makerjs from "makerjs";
export interface EaselPoint {
    x: number;
    y: number;
}
export interface EaselPathPoint extends EaselPoint {
    lh?: EaselPoint;
    rh?: EaselPoint;
}
export interface EaselShape {
    type: String;
    flipping: {
        horizontal: boolean;
        vertical: boolean;
    };
    center: EaselPoint;
    width: number;
    height: number;
    rotation: number;
}
export interface EaselRectangle extends EaselShape {
    type: 'rectangle';
}
export interface EaselEllipse extends EaselShape {
    type: 'ellipse';
}
export interface EaselLine extends EaselShape {
    type: 'line';
    point1: EaselPoint;
    point2: EaselPoint;
}
export interface EaselPolyline extends EaselShape {
    type: 'polyline';
    points: EaselPoint[];
}
export interface EaselPolygon extends EaselShape {
    type: 'polygon';
    points: EaselPoint[];
}
export interface EaselPath extends EaselShape {
    type: 'path';
    points: EaselPoint[][];
}
export interface EaselText extends EaselShape {
    type: 'text';
    font: string;
    text: string;
}
export declare function toEaselPoint(p: makerjs.IPoint, lh?: EaselPoint, rh?: EaselPoint): EaselPathPoint;
export declare function fromEaselPoint(e: EaselPoint): makerjs.IPoint;
export declare class EaselPathModel implements makerjs.IModel {
    models: makerjs.IModelMap;
    paths: makerjs.IPathMap;
    constructor(points: EaselPathPoint[]);
}
export declare function importEaselShape(shape: EaselRectangle | EaselEllipse | EaselPath | EaselPolygon | EaselPolyline): makerjs.IModel;
/**
 * Get key points (a minimal a number of points) along a chain of paths.
 *
 * @param chainContext Chain of paths to get points from.
 * @param maxArcFacet The maximum length between points on an arc or circle.
 * @returns Array of points which are on the chain.
 */
export declare function exportChainToEaselPoints(chainContext: makerjs.IChain): EaselPathPoint[];
export declare function exportModelToEaselPointArray(model: makerjs.IModel): any[];
