import { circleToPath, ellipseToPath, lineToPath, parsePath, rectToPath, SvgCommands } from "./path-parser";
import { parseHTML } from "linkedom";

export class SVG {
    private _commands: SvgCommands = [];

    constructor(commands: SvgCommands = []) {
        this._commands = commands;
    }
}

export function parseSVG(svg: string): SVG {
    const svgOutput: SvgCommands = [];
    const dom = parseHTML(svg);

    dom.window.document.querySelectorAll('path').forEach(path => {
        const parsed = parsePath(path.getAttribute('d') || '');

        if (parsed.length) {
            svgOutput.push(...parsed);
        }
    });

    dom.window.document.querySelectorAll('circle').forEach(circle => {
        const cx = parseFloat(circle.getAttribute('cx') || '0');
        const cy = parseFloat(circle.getAttribute('cy') || '0');
        const r = parseFloat(circle.getAttribute('r') || '0');

        const parsed = parsePath(circleToPath(cx, cy, r));

        if (parsed.length) {
            svgOutput.push(...parsed);
        }
    });

    dom.window.document.querySelectorAll('ellipse').forEach(ellipse => {
        const cx = parseFloat(ellipse.getAttribute('cx') || '0');
        const cy = parseFloat(ellipse.getAttribute('cy') || '0');
        const rx = parseFloat(ellipse.getAttribute('rx') || '0');
        const ry = parseFloat(ellipse.getAttribute('ry') || '0');

        const parsed = parsePath(ellipseToPath(cx, cy, rx, ry));

        if (parsed.length) {
            svgOutput.push(...parsed);
        }
    });

    dom.window.document.querySelectorAll('rect').forEach(rect => {
        const x = parseFloat(rect.getAttribute('x') || '0');
        const y = parseFloat(rect.getAttribute('y') || '0');
        const width = parseFloat(rect.getAttribute('width') || '0');
        const height = parseFloat(rect.getAttribute('height') || '0');

        const parsed = parsePath(rectToPath(x, y, width, height));

        if (parsed.length) {
            svgOutput.push(...parsed);
        }
    });

    dom.window.document.querySelectorAll('line').forEach(line => {
        const x1 = parseFloat(line.getAttribute('x1') || '0');
        const y1 = parseFloat(line.getAttribute('y1') || '0');
        const x2 = parseFloat(line.getAttribute('x2') || '0');
        const y2 = parseFloat(line.getAttribute('y2') || '0');

        const parsed = parsePath(lineToPath(x1, y1, x2, y2));

        if (parsed.length) {
            svgOutput.push(...parsed);
        }
    });

    return new SVG(svgOutput);
}