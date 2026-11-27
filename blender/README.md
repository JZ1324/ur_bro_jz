# Journey authoring

Run `npm run export:journey` with Python 3 (standard library only). It validates
the board, pieces, layouts and original tree geometry before writing the version
1 Float32 buffer to `public/models`. Run `npm run validate:journey` to validate
without writing files.

`garden_voxels.py` is the unchanged deterministic garden source, in Blender's
Z-up coordinates. `journey_voxels.py` authors the eight Y-up layouts. Boxes use
position, scale, Euler rotation and linear RGB; every layout is deterministically
subdivided to the same 3,877 instances. The first two layouts must remain identical
to the original tree to match the existing `garden.glb` handoff.

The chess scene has an ivory/sage board with a1 dark and all 32 starting pieces.
White faces -Z. Each piece is authored inside its own .64-unit square, wholly
above the .83-unit board surface. The interactive board uses those bounds to
identify each piece's voxels. Keep geometry within the shared pool; do not discard blocks to
fit. The original prototype outside this repository remains the reference.
