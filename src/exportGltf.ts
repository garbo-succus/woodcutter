import {
  Box3,
  Vector3,
  Mesh,
  Material,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
} from "three";
import { GLTFExporter } from "three-stdlib";
import React from "react";
import { transformGltf } from "./transformGltf";

interface ExportOptions {
  maxTextureSize?: number;
}

export async function exportGltf(meshRef: React.RefObject<Mesh>, options: ExportOptions = {}) {
  if (meshRef.current) {
    const mesh = meshRef.current;

    const box = new Box3().setFromObject(mesh);
    const size = box.getSize(new Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    const originalScale = mesh.scale.clone();
    const originalMaterials = mesh.material;

    if (maxDimension > 0) {
      const scaleFactor = 1 / maxDimension;
      mesh.scale.multiplyScalar(scaleFactor);
    }

    // Clone materials and set colors to white for export
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((material: Material) => {
        const cloned = material.clone();
        if (
          cloned instanceof MeshStandardMaterial ||
          cloned instanceof MeshPhysicalMaterial
        ) {
          cloned.color.setHex(0xffffff);
        }
        return cloned;
      });
    } else {
      const cloned = (mesh.material as Material).clone();
      if (
        cloned instanceof MeshStandardMaterial ||
        cloned instanceof MeshPhysicalMaterial
      ) {
        cloned.color.setHex(0xffffff);
      }
      mesh.material = cloned;
    }

    const exporter = new GLTFExporter();
    exporter.parse(
      mesh,
      async (gltfProp) => {
        const gltf = gltfProp as ArrayBuffer;
        const transformed = await transformGltf(gltf);
        const blob = new Blob([transformed], {
          type: "model/gltf-binary",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "token.glb";
        a.click();
        URL.revokeObjectURL(url);

        mesh.scale.copy(originalScale);
        mesh.material = originalMaterials;
      },
      (error) => {
        console.error("Error exporting GLTF:", error);
        mesh.scale.copy(originalScale);
        mesh.material = originalMaterials;
      },
      { binary: true, maxTextureSize: options.maxTextureSize ?? 256 },
    );
  }
}
