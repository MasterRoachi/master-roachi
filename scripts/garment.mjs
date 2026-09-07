// Prepares a downloaded 3D garment for the store viewer.
//
//   node scripts/garment.mjs public/store/hoodie.glb
//
// Sketchfab exports are built to be looked at in Sketchfab, not shipped to a
// phone: the hoodie arrived at 4.7MB and 148,426 triangles, against the tee's
// 305KB and 14,834. This gets a new garment to roughly the tee's weight so the
// store keeps loading like the store.
//
// What it does, and why each step:
//
//   textures    dropped entirely. components/ShirtViewer.tsx replaces every
//               material with one flat cloth colour taken off the Printful
//               mockup, so the model's own maps are never sampled — they are
//               pure download. The tee ships with zero images for the same
//               reason.
//   weld        merges vertices split only by a normal or UV seam, which is
//               what makes simplification able to collapse an edge at all.
//   simplify    the actual reduction. Error is bounded rather than the ratio
//               being trusted: cloth is mostly folds, and a decimator given a
//               free hand takes the folds first.
//   quantize    stores positions and normals as integers rather than floats.
//               Roughly halves what is left, and is why the tee carries
//               KHR_mesh_quantization.
//
// The licence file beside the model is not touched and must travel with it.

import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  dedup,
  weld,
  simplify,
  quantize,
  prune,
  flatten,
  join,
} from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/garment.mjs <path-to.glb>');
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`garment: ${file} does not exist`);
  process.exit(1);
}

/** What the tee weighs, and therefore what a second garment should aim at. */
const TARGET_TRIS = 16000;

const before = fs.statSync(file).size;

await MeshoptSimplifier.ready;
// Extensions must be registered or they are silently dropped on write.
// quantize() emits KHR_mesh_quantization, and without the declaration a
// loader reads the integer positions as if they were floats — the tee
// carries that extension for exactly this reason.
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(file);

const countTris = () =>
  doc
    .getRoot()
    .listMeshes()
    .reduce(
      (n, mesh) =>
        n +
        mesh
          .listPrimitives()
          .reduce((m, p) => m + (p.getIndices()?.getCount() ?? 0) / 3, 0),
      0,
    );

const trisBefore = countTris();

// Materials first: unhook every texture so prune can collect the images. Done
// before simplification so the UVs they needed go with them.
for (const material of doc.getRoot().listMaterials()) {
  material
    .setBaseColorTexture(null)
    .setNormalTexture(null)
    .setEmissiveTexture(null)
    .setOcclusionTexture(null)
    .setMetallicRoughnessTexture(null);
}

// The ratio is what is left over after the error budget, not a promise: the
// simplifier stops at whichever bound it reaches first, and on this model the
// error bound is the one that bites.
const ratio = Math.min(1, TARGET_TRIS / Math.max(trisBefore, 1));

await doc.transform(
  dedup(),
  flatten(),
  join(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.008 }),
  prune({ keepAttributes: false }),
  quantize(),
);

await io.write(file, doc);

const after = fs.statSync(file).size;
const trisAfter = countTris();
const kb = (n) => (n / 1024).toFixed(0) + 'KB';

console.log(`garment: ${path.basename(file)}`);
console.log(
  `  triangles  ${Math.round(trisBefore).toLocaleString()} → ${Math.round(
    trisAfter,
  ).toLocaleString()}`,
);
console.log(`  size       ${kb(before)} → ${kb(after)}`);
console.log(`  images     ${doc.getRoot().listTextures().length}`);
