import { WebIO } from "@gltf-transform/core";
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
import { ALL_EXTENSIONS, EXTTextureAVIF } from "@gltf-transform/extensions";
import { encode } from "@jsquash/avif";

const pngToAvif = async (png: Uint8Array) => {
  // Create canvas to get ImageData from PNG
  const img = new Image();
  const blob = new Blob([png], { type: "image/png" });
  img.src = URL.createObjectURL(blob);
  await new Promise((resolve) => (img.onload = resolve));

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(img, 0, 0);

  const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);

  if (!imageData) return png;

  // Convert to AVIF
  const output = await encode(imageData, { quality: 60 });
  return new Uint8Array(output);
};

const fakeSharpStub = (srcImage: Uint8Array) => {
  const instance = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === "toBuffer") {
          return () => pngToAvif(srcImage);
        }
        return () => instance;
      },
    },
  );
  return instance;
};

const io = new WebIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.encoder": new DracoEncoderModule(),
});

export const transformGltf = async (gltfRaw: ArrayBuffer) => {
  const gltf = new Uint8Array(gltfRaw);
  const document = await io.readBinary(gltf);
  document.createExtension(EXTTextureAVIF);
  await MeshoptSimplifier.ready;
  await document.transform(
    textureCompress({
      encoder: fakeSharpStub,
      targetFormat: "avif",
    }),
    center(),
    dedup(),
    prune(),
    join({ keepNamed: false }),
    weld({}),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0, error: 0.001 }),
    draco({ method: "edgebreaker" }),
  );

  const glb = await io.writeBinary(document);
  return glb;
};
