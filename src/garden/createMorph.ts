import * as THREE from 'three';
import { clamp, journeyFrame, sectionIds } from './journey.ts';
import { paintGardenColour } from './palette.ts';

export type VoxelManifest = { version: number; count: number; stride: number; layouts: string[]; buffer: string };

export function createMorph(manifest: VoxelManifest, buffer: ArrayBuffer) {
  if (manifest.version !== 1 || manifest.stride !== 12 || manifest.count < 1 || manifest.count > 12000
    || manifest.layouts.join(',') !== sectionIds.join(',')
    || buffer.byteLength !== manifest.count * manifest.stride * sectionIds.length * 4) {
    throw new Error('Invalid garden voxel asset');
  }
  const data = new Float32Array(buffer.slice(0));
  if (!data.every(Number.isFinite)) throw new Error('Invalid voxel coordinates');
  const { count, stride } = manifest;
  const paint = new THREE.Color();
  // The first two layouts are the garden's cherry tree. Repaint both identically
  // so scrolling into About never produces a colour seam or changes its shape.
  for (let i = 0; i < count * stride * 2; i += stride) {
    paintGardenColour(paint.setRGB(data[i + 9], data[i + 10], data[i + 11], THREE.LinearSRGBColorSpace));
    data[i + 9] = paint.r;
    data[i + 10] = paint.g;
    data[i + 11] = paint.b;
  }
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ roughness: .92 });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = 'Journey_voxels';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const drift = Float32Array.from({ length: count * 3 }, (_, i) => {
    const v = Math.sin((i + 17) * 127.1) * 43758.5453;
    return (v - Math.floor(v) - .5) * 1.2;
  });
  let previous = -1;
  let previousReduced = false;

  function update(progress: number, reducedMotion: boolean) {
    if (progress === previous && reducedMotion === previousReduced) return false;
    previous = progress;
    previousReduced = reducedMotion;
    const { from, to, mix } = journeyFrame(progress, reducedMotion);
    const source = from * count * stride;
    const destination = to * count * stride;
    const arc = from === 0 ? 0 : Math.sin(mix * Math.PI);
    const swirl = arc * .15;
    const cosine = Math.cos(swirl);
    const sine = Math.sin(swirl);
    for (let i = 0; i < count; i++) {
      const a = source + i * stride;
      const b = destination + i * stride;
      const d = i * 3;
      const x = THREE.MathUtils.lerp(data[a], data[b], mix);
      const z = THREE.MathUtils.lerp(data[a + 2], data[b + 2], mix);
      dummy.position.set(
        x * cosine - z * sine + drift[d] * arc,
        THREE.MathUtils.lerp(data[a + 1], data[b + 1], mix) + (drift[d + 1] + .35) * arc,
        x * sine + z * cosine + drift[d + 2] * arc,
      );
      dummy.scale.set(
        THREE.MathUtils.lerp(data[a + 3], data[b + 3], mix),
        THREE.MathUtils.lerp(data[a + 4], data[b + 4], mix),
        THREE.MathUtils.lerp(data[a + 5], data[b + 5], mix),
      );
      dummy.rotation.set(
        THREE.MathUtils.lerp(data[a + 6], data[b + 6], mix) + drift[d] * arc,
        THREE.MathUtils.lerp(data[a + 7], data[b + 7], mix) + drift[d + 1] * arc,
        THREE.MathUtils.lerp(data[a + 8], data[b + 8], mix) + drift[d + 2] * arc,
      );
      color.setRGB(
        clamp(THREE.MathUtils.lerp(data[a + 9], data[b + 9], mix)),
        clamp(THREE.MathUtils.lerp(data[a + 10], data[b + 10], mix)),
        clamp(THREE.MathUtils.lerp(data[a + 11], data[b + 11], mix)),
        THREE.LinearSRGBColorSpace,
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
    return true;
  }

  return {
    mesh, update,
    getLayout(section: typeof sectionIds[number]) {
      const offset = sectionIds.indexOf(section) * count * stride;
      return data.slice(offset, offset + count * stride);
    },
    setLayout(section: typeof sectionIds[number], layout: Float32Array) {
      if (layout.length !== count * stride || !layout.every(Number.isFinite)) throw new Error('Invalid replacement voxel layout');
      data.set(layout, sectionIds.indexOf(section) * count * stride);
      previous = -1;
    },
  };
}
