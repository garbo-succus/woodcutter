import { WebIO } from "@gltf-transform/core";
// import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
// import draco3d from "draco3dgltf";
import {
  prune,
  dedup,
  // draco,
  join,
  center,
  weld,
  simplify,
  textureCompress,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import { checker } from "three/src/nodes/TSL.js";

// check if browser supports exporting to this image mime type
const checkSupport = (mimeType: string) =>
  new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.toBlob((blob: Blob | null) => {
      resolve(blob?.type === mimeType);
    }, mimeType);
  });

const io = new WebIO({ credentials: "include" });
// .registerExtensions([KHRDracoMeshCompression])
// .registerDependencies({
//     'draco3d.encoder': await draco3d.createEncoderModule()

export const transformGltf = async (gltfRaw: ArrayBuffer) => {
  const gltf = new Uint8Array(gltfRaw);
  const document = await io.readBinary(gltf);

  // const avif = await checkSupport("image/avif");
  // const webp = await checkSupport("image/webp");

  await document.transform(
    center(),
    dedup(),
    prune(),
    join({ keepNamed: false }),
    weld({}),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0, error: 0.001 }),
    // draco({method: 'edgebreaker'}),

    textureCompress({
      // encoder: sharp,
      // quality: 0.8, // only supported by sharp

      //avif ? "avif" : webp ? "webp" : // error: 'image/webp' MIME type requires an extension
      targetFormat: "jpeg",
      // resize: [512, 512],
    }),
  );

  const glb = await io.writeBinary(document);
  return glb;
};
