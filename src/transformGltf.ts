import { WebIO } from "@gltf-transform/core";
// import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import {
  prune,
  dedup,
  draco,
  join,
  center,
  weld,
  simplify,
  textureCompress,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import {
  ALL_EXTENSIONS,
  // EXTTextureAVIF,
  EXTTextureWebP,
} from "@gltf-transform/extensions";
// import draco3d from "draco3dgltf";

// check if browser supports exporting to this image mime type
const checkSupport = (mimeType: string) =>
  new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.toBlob((blob: Blob | null) => {
      resolve(blob?.type === mimeType);
    }, mimeType);
  });

const io = new WebIO()
  // { credentials: "include" }
  .registerExtensions(ALL_EXTENSIONS)
  // .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({
    // "draco3d.encoder": await draco3d.createEncoderModule(),
    // "draco3d.decoder": DracoDecoderModule,
    "draco3d.encoder": new DracoEncoderModule(),
  });

export const transformGltf = async (gltfRaw: ArrayBuffer) => {
  const gltf = new Uint8Array(gltfRaw);
  const document = await io.readBinary(gltf);

  const avif = await checkSupport("image/avif");
  const webp = await checkSupport("image/webp");

  await MeshoptSimplifier.ready;
  await document.createExtension(EXTTextureWebP);
  // await document.createExtension(EXTTextureAVIF);

  await document.transform(
    center(),
    dedup(),
    prune(),
    join({ keepNamed: false }),
    weld({}),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0, error: 0.001 }),
    draco({ method: "edgebreaker" }),

    textureCompress({
      // encoder: sharp,
      // quality: 0.8, // only supported by sharp

      targetFormat: avif ? "avif" : webp ? "webp" : "jpeg", // error: 'image/webp' MIME type requires an extension
      // targetFormat: "jpeg",
      // resize: [512, 512],
    }),
  );

  const glb = await io.writeBinary(document);
  return glb;
};
