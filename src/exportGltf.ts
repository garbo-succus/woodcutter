import { Box3, Vector3, Mesh } from "three";
import { GLTFExporter } from "three-stdlib";

interface GLTFResult {
  asset?: {
    generator?: string;
  };
  materials?: Array<{
    pbrMetallicRoughness?: {
      baseColorFactor?: number[];
    };
  }>;
}

export function exportGltf(meshRef: React.RefObject<Mesh>) {
  if (meshRef.current) {
    const mesh = meshRef.current;

    const box = new Box3().setFromObject(mesh);
    const size = box.getSize(new Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    const originalScale = mesh.scale.clone();
    if (maxDimension > 0) {
      const scaleFactor = 1 / maxDimension;
      mesh.scale.multiplyScalar(scaleFactor);
    }

    const exporter = new GLTFExporter();
    exporter.parse(
      mesh,
      (gltf: ArrayBuffer | { [key: string]: unknown }) => {
        const gltfObj = gltf as GLTFResult;

        if (!gltfObj.asset) {
          gltfObj.asset = {};
        }
        gltfObj.asset.generator = "Woodcutter by https://garbo.succus.games/";

        if (gltfObj.materials && gltfObj.materials.length > 0) {
          gltfObj.materials.forEach((material) => {
            if (material.pbrMetallicRoughness) {
              material.pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
            }
          });
        }

        const blob = new Blob([JSON.stringify(gltfObj, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "star.gltf";
        a.click();
        URL.revokeObjectURL(url);

        mesh.scale.copy(originalScale);
      },
      (error) => {
        console.error("Error exporting GLTF:", error);
        mesh.scale.copy(originalScale);
      },
      { binary: false },
    );
  }
}