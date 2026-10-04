# Virtual Tour — React + Three.js

## Run
```bash
npm install
npm run dev
```

Open the Vite URL, usually http://localhost:5173

## Replace demo panoramas
Put the client's equirectangular 360° JPGs in:
`public/panoramas/`

Then update `src/data/scenes.js`.

## Hotspots
Each hotspot uses a 3D position:
`position: [x, y, z]`

`type: "scene"` switches scenes.
`type: "info"` opens an information card.

## Important
The demo panoramas are generated placeholders. Replace them with properly licensed/client-owned 360° images for production.
