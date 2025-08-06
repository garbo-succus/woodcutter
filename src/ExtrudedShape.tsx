import { useLoader } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import React from "react";
import { Shape, Mesh, ExtrudeGeometry, TextureLoader } from "three";
import * as BufferGeometryUtils from "three-stdlib";
import type { SettingsType } from "./Settings";

const BackgroundShape = (props: React.ComponentProps<"group">) => {
  return (
    <group {...props}>
      <mesh position={[-0.25, -0.05, 0]}>
        <boxGeometry args={[0.5, 0.1, 1]} />
        <meshStandardMaterial color="#ccc" />
      </mesh>
      <mesh position={[0.25, -0.05, 0]}>
        <boxGeometry args={[0.5, 0.1, 1]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
};

interface ExtrudedShapeProps {
  shape: Shape;
  settings: SettingsType;
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

    const offset = settings.depth + settings.bevelThickness;

    return (
      <group position={[0, offset / 2, 0]}>
        <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
          <extrudeGeometry ref={geometryRef} args={[shape, settings]} />
          <meshPhysicalMaterial
            attach="material-0"
            color={color}
            map={endGrainDiffuse}
            normalMap={endGrainNormal}
            clearcoat={settings.clearcoat}
            clearcoatRoughness={settings.clearcoatRoughness}
            roughness={settings.roughness}
            metalness={settings.metalness}
            transmission={settings.transmission}
            dispersion={settings.dispersion}
            ior={settings.ior}
            iridescence={settings.iridescence}
            iridescenceIOR={settings.iridescenceIOR}
            iridescenceThicknessRange={[0, settings.iridescenceThickness]}
            sheen={settings.sheen}
            sheenRoughness={settings.sheenRoughness}
            sheenColor={settings.sheenColor}
            specularIntensity={settings.specularIntensity}
            specularColor={settings.specularColor}
            thickness={settings.thickness}
            reflectivity={settings.reflectivity}
          />
          <meshPhysicalMaterial
            attach="material-1"
            color={color}
            map={edgeGrainDiffuse}
            normalMap={edgeGrainNormal}
            clearcoat={settings.clearcoat}
            clearcoatRoughness={settings.clearcoatRoughness}
            roughness={settings.roughness}
            metalness={settings.metalness}
            transmission={settings.transmission}
            dispersion={settings.dispersion}
            ior={settings.ior}
            iridescence={settings.iridescence}
            iridescenceIOR={settings.iridescenceIOR}
            iridescenceThicknessRange={[0, settings.iridescenceThickness]}
            sheen={settings.sheen}
            sheenRoughness={settings.sheenRoughness}
            sheenColor={settings.sheenColor}
            specularIntensity={settings.specularIntensity}
            specularColor={settings.specularColor}
            thickness={settings.thickness}
            reflectivity={settings.reflectivity}
          />
        </mesh>
        {settings.showBackgroundShape && (
          <BackgroundShape position={[0, -offset, 0]} />
        )}
      </group>
    );
  },
);

export default ExtrudedShape;
