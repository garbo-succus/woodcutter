import { useLoader } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import React from "react";
import { Shape, Mesh, ExtrudeGeometry, TextureLoader } from "three";
import * as BufferGeometryUtils from "three-stdlib";

interface ExtrudedShapeProps {
  shape: Shape;
  settings: any;
  color: string;
}

const ExtrudedShape = React.forwardRef<Mesh, ExtrudedShapeProps>(
  ({ shape, settings, color }, ref) => {
    const geometryRef = useRef<ExtrudeGeometry>(null!);

    // Load textures
    const [endGrainDiffuse, endGrainNormal, edgeGrainDiffuse, edgeGrainNormal] =
      useLoader(TextureLoader, [
        "/endGrain_diffuse.jpg",
        "/endGrain_normals.jpg",
        "/edgeGrain_diffuse.jpg",
        "/edgeGrain_normals.jpg",
      ]);

    // Configure texture wrapping and repeat
    useEffect(() => {
      [
        endGrainDiffuse,
        endGrainNormal,
        edgeGrainDiffuse,
        edgeGrainNormal,
      ].forEach((texture) => {
        texture.wrapS = texture.wrapT = 1000; // RepeatWrapping
        texture.repeat.set(2, 2);
      });
    }, [endGrainDiffuse, endGrainNormal, edgeGrainDiffuse, edgeGrainNormal]);

    useEffect(() => {
      if (geometryRef.current && settings.maxSmoothAngle > 0) {
        BufferGeometryUtils.toCreasedNormals(
          geometryRef.current,
          settings.maxSmoothAngle,
        );
      }
    }, [shape, settings]);

    return (
      <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
        <extrudeGeometry ref={geometryRef} args={[shape, settings]} />
        {[
          // Material 0: Side faces (edge grain)
          <meshStandardMaterial
            key="edge"
            color={color}
            map={edgeGrainDiffuse}
            normalMap={edgeGrainNormal}
          />,
          // Material 1: Front/back face (end grain)
          <meshStandardMaterial
            key="front"
            color={color}
            map={endGrainDiffuse}
            normalMap={endGrainNormal}
          />,
        ]}
      </mesh>
    );
  },
);

export default ExtrudedShape;
