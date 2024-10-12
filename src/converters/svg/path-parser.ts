export enum Command {
    MoveTo = 'M',
    LineTo = 'L',
    CurveTo = 'C',
    QuadraticCurveTo = 'Q',
    VerticalLineTo = 'V',
    HorizontalLineTo = 'H',
    Arc = 'A',
    ClosePath = 'Z',
};

interface BasicCommand {
    type: Command;
    relative: boolean;
    args: number[];
};

type Arc = BasicCommand & {
    type: Command.Arc;
    args: [number, number, number, number, number, number, number];
};

type MoveTo = BasicCommand & {
    type: Command.MoveTo;
    args: [number, number];
};

type LineTo = BasicCommand & {
    type: Command.LineTo;
    args: [number, number];
};

type CurveTo = BasicCommand & {
    type: Command.CurveTo;
    args: [number, number, number, number, number, number];
};

type QuadraticCurveTo = BasicCommand & {
    type: Command.QuadraticCurveTo;
    args: [number, number, number, number];
};

type VerticalLineTo = BasicCommand & {
    type: Command.VerticalLineTo;
    args: [number];
};

type HorizontalLineTo = BasicCommand & {
    type: Command.HorizontalLineTo;
    args: [number];
};

type ClosePath = BasicCommand & {
    type: Command.ClosePath;
};

export type SvgCommand = Arc | MoveTo | LineTo | CurveTo | QuadraticCurveTo | VerticalLineTo | HorizontalLineTo | ClosePath;
export type SvgCommands = SvgCommand[];

/**
 * Parses an SVG Path and converts arc commands to cubic bezier curves for easier processing
 * @param svg The SVG path string to parse
 * @returns A list of commands that make up the SVG path
 */
export function parsePath(svg: string): SvgCommands {
    const commandRegex = /([MLCQZHVAhvmlcqza])([^MLCQZHVAhvmlcqza]*)/gi;
    let match: RegExpExecArray | null;

    const output: SvgCommands = [];

    while ((match = commandRegex.exec(svg)) !== null) {
        const command = match[1];
        const relative = command.toLowerCase() === command;
        const args = match[2]
            .trim()
            .split(/[\s,]+/)
            .map(parseFloat);

        output.push({
            type: command.toUpperCase() as Command,
            args: args as any,
            relative,
        });

    }

    return output;
}

function ellipseToBeziers(cx: number, cy: number, rx: number, ry: number): string {
    const kappa = 0.5522847498307936; // Approximation constant for control point distance

    // Control point offsets for both x and y
    const ox = rx * kappa; // Horizontal control point offset
    const oy = ry * kappa; // Vertical control point offset

    return [
        `M ${cx - rx} ${cy}`,
        `C ${cx - rx} ${cy - oy} ${cx - ox} ${cy - ry} ${cx} ${cy - ry}`,
        `C ${cx + ox} ${cy - ry} ${cx + rx} ${cy - oy} ${cx + rx} ${cy}`,
        `C ${cx + rx} ${cy + oy} ${cx + ox} ${cy + ry} ${cx} ${cy + ry}`,
        `C ${cx - ox} ${cy + ry} ${cx - rx} ${cy + oy} ${cx - rx} ${cy}`,
        `Z`,
    ].join(' ');
}

export function ellipseToPath(cx: number, cy: number, rx: number, ry: number): string {
    return ellipseToBeziers(cx, cy, rx, ry);
}

export function circleToPath(cx: number, cy: number, r: number): string {
    return ellipseToBeziers(cx, cy, r, r);
}

export function rectToPath(x: number, y: number, width: number, height: number): string {
    const path = [
        `M ${x} ${y}`,
        `h ${width}`,
        `v ${height}`,
        `h -${width}`,
        `z`,
    ];

    return path.join(' ');
}

export function lineToPath(x1: number, y1: number, x2: number, y2: number, thickness: number): string {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const dx = Math.sin(angle) * thickness / 2;
    const dy = Math.cos(angle) * thickness / 2;

    const path = [
        `M ${x1 + dx} ${y1 - dy}`,
        `L ${x2 + dx} ${y2 - dy}`,
        `L ${x2 - dx} ${y2 + dy}`,
        `L ${x1 - dx} ${y1 + dy}`,
        `Z`,
    ];

    return path.join(' ');
}
