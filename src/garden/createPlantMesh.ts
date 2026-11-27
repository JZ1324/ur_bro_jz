import * as THREE from 'three';
import { plantVoxels } from './plantModels';
import type { PlantColors, PlantKind } from './plantings';
import type { FlowerDesign } from './flowerDesign';

// Keep WebGL construction separate so HTML thumbnails can use the voxel shapes
// without loading the renderer.
export function createPlantMesh(kind: PlantKind, colors: PlantColors, geometry: THREE.BoxGeometry, material: THREE.MeshStandardMaterial, withSoil = false, design?: FlowerDesign) {
  const voxels = plantVoxels(kind, colors, design);
  if (withSoil) {
    voxels.forEach(voxel => { voxel.y += .22; });
    voxels.unshift(
      { x: 0, y: .09, z: 0, w: 1.04, h: .18, d: .92, color: '#c4ad89' },
      { x: 0, y: .20, z: 0, w: 1.07, h: .04, d: .95, color: '#aabc8e' },
    );
  }
  const mesh = new THREE.InstancedMesh(geometry, material, voxels.length);
  const block = new THREE.Object3D();
  voxels.forEach((voxel, index) => {
    block.position.set(voxel.x, voxel.y, voxel.z); block.scale.set(voxel.w, voxel.h, voxel.d); block.updateMatrix();
    mesh.setMatrixAt(index, block.matrix); mesh.setColorAt(index, new THREE.Color(voxel.color));
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}
