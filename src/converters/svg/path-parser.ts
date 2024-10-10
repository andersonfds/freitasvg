enum Command {
    MoveTo = 'M',
    LineTo = 'L',
    CurveTo = 'C',
    QuadraticCurveTo = 'Q',
    VerticalLineTo = 'V',
    HorizontalLineTo = 'H',
    ClosePath = 'Z',
};

interface BasicCommand {
    type: Command;
    relative: boolean;
    args: number[];
};

type Arc = BasicCommand & {
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

export type SvgCommand = MoveTo | LineTo | CurveTo | QuadraticCurveTo | VerticalLineTo | HorizontalLineTo | ClosePath;
export type SvgCommands = SvgCommand[];


function arcToCubicBeziers(x1: number, y1: number, rx: number, ry: number, angle: number, largeArcFlag: number, sweepFlag: number, x2: number, y2: number) {
    const curves = [];

    // Convert the angle to radians
    const angleRad = (Math.PI / 180) * angle;

    // Calculate the necessary values based on the arc-to-bezier formula
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);

    let dx = (x1 - x2) / 2;
    let dy = (y1 - y2) / 2;

    let x1p = cosAngle * dx + sinAngle * dy;
    let y1p = -sinAngle * dx + cosAngle * dy;

    let rxSq = rx * rx;
    let rySq = ry * ry;
    let x1pSq = x1p * x1p;
    let y1pSq = y1p * y1p;

    let radicant = (rxSq * rySq) - (rxSq * y1pSq) - (rySq * x1pSq);
    if (radicant < 0) {
        // If the radicant is negative, scale the radii to meet the arc condition
        const scale = Math.sqrt(1 - radicant / (rxSq * rySq));
        rx *= scale;
        ry *= scale;
        radicant = 0;
    }

    const root = (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt(radicant / ((rxSq * y1pSq) + (rySq * x1pSq)));

    const cxp = root * (rx * y1p / ry);
    const cyp = root * -(ry * x1p / rx);

    const cx = cosAngle * cxp - sinAngle * cyp + (x1 + x2) / 2;
    const cy = sinAngle * cxp + cosAngle * cyp + (y1 + y2) / 2;

    let theta1 = Math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx);
    let deltaTheta = Math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx) - theta1;

    if (sweepFlag === 0 && deltaTheta > 0) {
        deltaTheta -= 2 * Math.PI;
    } else if (sweepFlag === 1 && deltaTheta < 0) {
        deltaTheta += 2 * Math.PI;
    }

    let segments = Math.ceil(Math.abs(deltaTheta / (Math.PI / 2)));
    let segmentTheta = deltaTheta / segments;

    for (let i = 0; i < segments; i++) {
        const theta2 = theta1 + (i + 1) * segmentTheta;
        const theta1Current = theta1 + i * segmentTheta;

        // Calculate control points for each Bezier segment
        const t = (4 / 3) * Math.tan(segmentTheta / 4);

        const sinTheta1 = Math.sin(theta1Current);
        const cosTheta1 = Math.cos(theta1Current);
        const sinTheta2 = Math.sin(theta2);
        const cosTheta2 = Math.cos(theta2);

        const x1Ctrl = cx + rx * (cosTheta1 - t * sinTheta1);
        const y1Ctrl = cy + ry * (sinTheta1 + t * cosTheta1);
        const x2Ctrl = cx + rx * (cosTheta2 + t * sinTheta2);
        const y2Ctrl = cy + ry * (sinTheta2 - t * cosTheta2);

        const xEnd = cx + rx * cosTheta2;
        const yEnd = cy + ry * sinTheta2;

        curves.push({
            x1: x1Ctrl,
            y1: y1Ctrl,
            x2: x2Ctrl,
            y2: y2Ctrl,
            x: xEnd,
            y: yEnd
        });
    }

    return curves;
}

/**
 * Parses an SVG Path and converts arc commands to cubic bezier curves for easier processing
 * @param svg The SVG path string to parse
 * @returns A list of commands that make up the SVG path
 */
export function parsePath(svg: string): SvgCommands {
    const commandRegex = /([MLCQZHVhvmlcqza])([^MLCQZHVhvmlcqza]*)/gi;
    let match: RegExpExecArray | null;

    const output: SvgCommands = [];

    while ((match = commandRegex.exec(svg)) !== null) {
        const command = match[1];
        const relative = command.toLowerCase() === command;
        const args = match[2]
            .trim()
            .split(/[\s,]+/)
            .map(parseFloat);

        if (!Object.values(Command).includes(command.toUpperCase() as Command)) {
            if (command.toUpperCase() === 'A') {
                const [rx, ry, angle, largeArcFlag, sweepFlag, x, y] = args;
                const [x0, y0] = output[output.length - 1].args.slice(-2);

                const curves = arcToCubicBeziers(x0, y0, rx, ry, angle, largeArcFlag, sweepFlag, x, y);

                curves.forEach(curve => {
                    output.push({
                        type: Command.CurveTo,
                        relative,
                        args: [curve.x1, curve.y1, curve.x2, curve.y2, curve.x, curve.y]
                    });
                });

                continue;
            }

            continue;
        }

        output.push({
            type: command.toUpperCase() as Command,
            args: args as any,
            relative,
        });

    }

    return output;
}

export function ellipseToPath(cx: number, cy: number, rx: number, ry: number): string {
    const path = [
        `M ${cx - rx} ${cy}`,
        `a ${rx} ${ry} 0 1 0 ${rx * 2} 0`,
        `a ${rx} ${ry} 0 1 0 -${rx * 2} 0`,
    ];

    return path.join(' ');
}

export function circleToPath(cx: number, cy: number, r: number): string {
    return ellipseToPath(cx, cy, r, r);
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

export function lineToPath(x1: number, y1: number, x2: number, y2: number): string {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
}