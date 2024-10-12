import { Path } from "opentype.js";
import { circleToPath, ellipseToPath, lineToPath, parsePath, rectToPath, SvgCommand, SvgCommands } from "./path-parser";
import { DOMParser } from "linkedom";
import { svgCommandsToPathCommands } from "~converters/glyph";

export interface ViewBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class SVG {
    private _commands: SvgCommands = [];
    private _warnings: string[] = [];

    get warnings(): string[] {
        return this._warnings;
    }

    get svgCommands(): SvgCommands {
        return this._commands;
    }

    constructor(readonly box: ViewBox) {
    }

    toGlyphPath(): Path {
        const path = new Path();
        path.strokeWidth = 0;
        path.commands = svgCommandsToPathCommands(this.svgCommands);

        return path;
    }

    warn(message: string): void {
        this._warnings.push(message);
    }

    addCommand(...commands: SvgCommands): void {
        commands.forEach(command => {
            this._commands.push(command);
        });
    }
}

function getLineThickness(el: SVGLineElement): number {
    if (el.hasAttribute('stroke-width')) {
        return parseFloat(el.getAttribute('stroke-width') || '0');
    }

    if (el.style.strokeWidth) {
        return parseFloat(el.style.strokeWidth);
    }

    return 1;
}

function computeWarnings(svg: SVG, el: SVGElement) {
    const unsupportedAttributes = ['transform', 'mask', 'filter'];

    unsupportedAttributes.forEach(attr => {
        if (el.hasAttribute(attr)) {
            svg.warn(`Unsupported attribute: ${attr}`);
        }
    });
}

export function parseSVG(svgElement: string): SVG {
    const dom = (new DOMParser).parseFromString(svgElement, 'image/svg+xml');
    const svg = dom.querySelector('svg');

    if (!svg) {
        throw new Error('No SVG element found');
    }

    const [x, y, width, height] = svg.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, 0, 0];
    const viewBox = { x: x || 0, y: y || 0, width: width || 0, height: height || 0 };

    const output = new SVG(viewBox);

    function addCommands(commands: SvgCommands) {
        output.addCommand(...commands);
    }

    if (svg.hasAttribute('width')) {
        output.warn('"width" attribute will be ignored');
    }

    if (svg.hasAttribute('height')) {
        output.warn('"height" attribute will be ignored');
    }

    svg.querySelectorAll('path').forEach(path => {
        computeWarnings(output, path);
        const parsed = parsePath(path.getAttribute('d') || '');
        addCommands(parsed);
    });

    svg.querySelectorAll('circle').forEach(circle => {
        computeWarnings(output, circle);

        const cx = parseFloat(circle.getAttribute('cx') || '0');
        const cy = parseFloat(circle.getAttribute('cy') || '0');
        const r = parseFloat(circle.getAttribute('r') || '0');
        const parsed = parsePath(circleToPath(cx, cy, r));
        addCommands(parsed);
    });

    svg.querySelectorAll('ellipse').forEach(ellipse => {
        computeWarnings(output, ellipse);

        const cx = parseFloat(ellipse.getAttribute('cx') || '0');
        const cy = parseFloat(ellipse.getAttribute('cy') || '0');
        const rx = parseFloat(ellipse.getAttribute('rx') || '0');
        const ry = parseFloat(ellipse.getAttribute('ry') || '0');

        const parsed = parsePath(ellipseToPath(cx, cy, rx, ry));
        addCommands(parsed);
    });

    svg.querySelectorAll('rect').forEach(rect => {
        computeWarnings(output, rect);
        const x = parseFloat(rect.getAttribute('x') || '0');
        const y = parseFloat(rect.getAttribute('y') || '0');
        const width = parseFloat(rect.getAttribute('width') || '0');
        const height = parseFloat(rect.getAttribute('height') || '0');

        const parsed = parsePath(rectToPath(x, y, width, height));
        addCommands(parsed);
    });

    svg.querySelectorAll('line').forEach(line => {
        computeWarnings(output, line);
        const x1 = parseFloat(line.getAttribute('x1') || '0');
        const y1 = parseFloat(line.getAttribute('y1') || '0');
        const x2 = parseFloat(line.getAttribute('x2') || '0');
        const y2 = parseFloat(line.getAttribute('y2') || '0');

        const parsed = parsePath(lineToPath(x1, y1, x2, y2, getLineThickness(line)));
        addCommands(parsed);
    });

    return output;
}