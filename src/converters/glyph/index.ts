import { PathCommand } from "opentype.js";
import { SvgCommands, Command } from "~converters/svg/path-parser";


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

export function svgCommandsToPathCommands(svgCommands: SvgCommands): PathCommand[] {
    let currentX: number = 0, currentY: number = 0;
    const output: PathCommand[] = [];

    svgCommands.forEach(command => {

        switch (command.type) {
            case Command.MoveTo:
            case Command.LineTo:
                if (command.relative) {
                    currentX += command.args[0];
                    currentY += command.args[1];
                } else {
                    currentX = command.args[0];
                    currentY = command.args[1];
                }

                output.push({
                    type: command.type,
                    x: currentX,
                    y: currentY,
                });

                break;

            case Command.HorizontalLineTo:
                if (command.relative) {
                    currentX += command.args[0];
                } else {
                    currentX = command.args[0];
                }

                output.push({
                    type: Command.LineTo,
                    x: currentX,
                    y: currentY,
                });

                break;

            case Command.VerticalLineTo:
                if (command.relative) {
                    currentY += command.args[0];
                } else {
                    currentY = command.args[0];
                }

                output.push({
                    type: Command.LineTo,
                    x: currentX,
                    y: currentY,
                });

                break;

            case Command.CurveTo:
                output.push({
                    type: Command.CurveTo,
                    x1: command.args[0],
                    y1: command.args[1],
                    x2: command.args[2],
                    y2: command.args[3],
                    x: command.args[4],
                    y: command.args[5],
                });


                break;
            case Command.QuadraticCurveTo:
                output.push({
                    type: Command.QuadraticCurveTo,
                    x1: command.args[0],
                    y1: command.args[1],
                    x: command.args[2],
                    y: command.args[3],
                });

                break;

            case Command.Arc:
                const xEnd = command.relative ? currentX + command.args[5] : command.args[5];
                const yEnd = command.relative ? currentY + command.args[6] : command.args[6];

                const curves = arcToCubicBeziers(currentX, currentY, command.args[0], command.args[1], command.args[2], command.args[3], command.args[4], xEnd, yEnd);

                curves.forEach(curve => {
                    output.push({
                        type: Command.CurveTo,
                        x1: curve.x1,
                        y1: curve.y1,
                        x2: curve.x2,
                        y2: curve.y2,
                        x: curve.x,
                        y: curve.y,
                    });
                });

                currentX = xEnd;
                currentY = yEnd;

                break;

            case Command.ClosePath:
                output.push({
                    type: Command.ClosePath,
                });

                break;
        }

    });

    return output;
}