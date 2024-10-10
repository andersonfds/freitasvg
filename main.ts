import { parseSVG, SVG } from "./src/converters/svg";

const svg = parseSVG(`
    <svg width="500" height="500" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
  <!-- Regular Shapes -->
  <!-- Square -->
  <rect x="20" y="20" width="100" height="100" fill="blue" />
  
  <!-- Rectangle -->
  <rect x="140" y="20" width="150" height="80" fill="green" />

  <!-- Circle -->
  <circle cx="100" cy="250" r="50" fill="red" />

  <!-- Ellipse -->
  <ellipse cx="300" cy="250" rx="80" ry="50" fill="orange" />

  <!-- Line -->
  <line x1="20" y1="400" x2="200" y2="400" stroke="black" stroke-width="5"/>

  <!-- Shapes using <path> with relative commands -->
  <!-- Square with path -->
  <path d="M 20 320 h 100 v 100 h -100 z" fill="purple" />
  
  <!-- Rectangle with path -->
  <path d="M 160 320 h 200 v 60 h -200 z" fill="lightblue" />
  
  <!-- Circle with path (relative arc) -->
  <path d="M 250 500 m -50, 0 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0" fill="pink" />
  
  <!-- Ellipse with path (relative arc) -->
  <path d="M 400 500 m -80, 0 a 80,50 0 1,0 160,0 a 80,50 0 1,0 -160,0" fill="yellow" />
</svg>
`);
console.log(svg);