# For VueJS you can implement a widget, named `Glyph.vue`

First install the package:

```bash
npm install freitasvg
```

Then create the `Glyph.vue` file:

```vue
<script setup lang="ts">
import { parseSVG } from 'freitasvg';
import { onMounted, useTemplateRef } from 'vue';

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas');

const svg = parseSVG(`PUT YOUR SVG HERE`);

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear the transforms in the canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Scale to fit the canvas from the SVG viewBox perspective
  ctx.scale(canvas.width / svg.box.width, canvas.height / svg.box.height);

  // Render the Glyph to the canvas
  const glyph = svg.toGlyphPath();
  glyph.fill = '#696969';
  glyph.draw(ctx);
});
</script>

<template>
  <canvas ref="canvas" width="1000" height="1000"></canvas>
</template>

<style scoped>
canvas {
  width: 400px;
  height: 400px;
}
</style>
```

> Note that the `PUT YOUR SVG HERE` should be replaced with the SVG string. It should be the whole SVG string, including the `<svg>` tag.
