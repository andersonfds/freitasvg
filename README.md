# FreitasSVG (WIP)

A library that converts SVG into Glyphs format. Suitable to build SVG fonts.

## How does it differ from other tools?

- It can render both in the server and in the client, perfect to build previews withouth the need to upload the file to the server.
- It doesn't require a CLI, it can be used as a library.
- It directly reads the SVG string, no need to save the file to the disk.

### How to use?

```typescript
import { parseSVG } from 'freitas-svg';

const svg = parseSVG`<svg width="100" height="100" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="16" height="16" fill="blue" />
</svg>`;

const glyph = svg.toGlyphPath();
```

#### Rendering in the client

```typescript
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

glyph.draw(ctx);

// Then make some magic to save the image as a file
// If you want an example its in the `main.ts` file
```

#### Rendering in the server

Since the `canvas` is not available in the nodejs apis, you can use the `node-canvas` package.

```bash
npm install canvas
```

And then:

```typescript
import { createCanvas } from 'canvas';

const canvas = createCanvas(100, 100);
const ctx = canvas.getContext('2d');

glyph.draw(ctx);
```

### How to install?

```bash
npm install freitasvg
```

### Usecases

- Convert SVG icons into a font.
- Render the conversion from SVG-font glyphs in the client without the need to upload the file to the server, ultimately saving bandwidth.

### Contributing

Feel free to open an issue or a pull request. It is very simple to build the project, just run `npm run develop -- shapes.svg` and it will generate an image `canvas.png` with the SVG rendered, you can use this to change the code and see the results without relying on the browser.

If you want to add an image asset that is not checked in the source control, you can name prefix it with "private_" and it will be ignored by git, i.e. `private_svg_thingy.svg`. And to execute the script with this file, you can run `npm run develop -- private_svg_thingy.svg`.

### Whats next?

Soon enough I will be adding preview support to all major web frameworks, like React, Vue and Angular. And also a CLI to convert SVG files into Glyphs format.

#### Features

- [x] Parse SVG into Glyphs format
- [x] Render the Glyphs in the client
- [x] Lists warnings when the SVG is not compatible