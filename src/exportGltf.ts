import { Box3, Vector3, Mesh } from "three";
import { GLTFExporter } from "three-stdlib";

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
      (gltf: ArrayBuffer) => {
        const blob = new Blob([gltf], {
          type: "model/gltf-binary",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "star.glb";
        a.click();
        URL.revokeObjectURL(url);

        mesh.scale.copy(originalScale);
      },
      (error) => {
        console.error("Error exporting GLTF:", error);
        mesh.scale.copy(originalScale);
      },
      { binary: true },
    );
  }
}