import { Box3, Vector3, Mesh } from "three";
import { GLTFExporter } from "three-stdlib";

export function exportGltf(meshRef: React.RefObject<Mesh>) {
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
      mesh.material = mesh.material.map((material: any) => {
        const cloned = material.clone();
        if (cloned.color) {
          cloned.color.setHex(0xffffff);
        }
        return cloned;
      });
    } else {
      const cloned = (mesh.material as any).clone();
      if (cloned.color) {
        cloned.color.setHex(0xffffff);
      }
      mesh.material = cloned;
    }

    const exporter = new GLTFExporter();
    exporter.parse(
      mesh,
      (gltfProp) => {
        const gltf = gltfProp as ArrayBuffer;
        const blob = new Blob([gltf], {
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
      { binary: true, maxTextureSize: 512 },
    );
  }
}
