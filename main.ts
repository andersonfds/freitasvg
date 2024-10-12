import { createCanvas } from 'canvas';
import fs from 'fs';
import { parseSVG } from "./src/converters/svg";

const folderWithSVGs = __dirname + '/assets';
const files = fs.readdirSync(folderWithSVGs).filter(file => file.endsWith('.svg'));
const fillStyle = '#696969';

const canvas = createCanvas(500, 500);
const ctx = canvas.getContext('2d');

async function main(file: string) {
    const svgText = fs.readFileSync(folderWithSVGs + '/' + file, 'utf8');
    const svg = parseSVG(svgText);

    const viewBox = svg.box;
    const width = viewBox.width || 500;
    const height = viewBox.height || 500;

    // clear to white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = fillStyle;

    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    const glyph = svg.toGlyphPath();
    glyph.fill = fillStyle;

    // Scale to fit on viewbox
    const scale = Math.min(canvas.width / width, canvas.height / height);
    ctx.scale(scale, scale);

    svg.warnings.forEach(warn => console.warn(warn));

    glyph.draw(ctx as any);

    // write to filesystem
    const out = fs.createWriteStream(__dirname + '/canvas.png');

    const stream = canvas.createPNGStream();
    stream.pipe(out);

    // wait until user presses enter
    console.log(`Rendering ${file} to canvas.png`);
}

main(process.argv[2] || files[0]);