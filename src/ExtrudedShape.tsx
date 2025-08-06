import { useLoader } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import React from "react";
import { Shape, Mesh, ExtrudeGeometry, TextureLoader } from "three";
import * as BufferGeometryUtils from "three-stdlib";
import type { SettingsType } from "./Settings";

// 1x1 white PNG for placeholder textures
const EMPTY_TEXTURE_URL = "1px.png";

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

    // Load textures, replacing undefined URLs with placeholder texture
    const textures = useLoader(
      TextureLoader,
      settings.textureUrls.map((url) => url || EMPTY_TEXTURE_URL),
    );

    // Configure texture wrapping and repeat
    useEffect(() => {
      textures.forEach((texture) => {
        texture.wrapS = texture.wrapT = 1000; // RepeatWrapping
        texture.repeat.set(2, 2);
      });
    }, [textures]);

    useEffect(() => {
      if (geometryRef.current && settings.maxSmoothAngle > 0) {
        BufferGeometryUtils.toCreasedNormals(
          geometryRef.current,
          settings.maxSmoothAngle,
        );
      }
    }, [shape, settings]);

    const offset = settings.depth + settings.bevelThickness;

    const t0 = [
      settings.textureUrls[0] ? textures[0] : null,
      settings.textureUrls[1] ? textures[1] : null,
    ];
    const t1 =
      settings.textureUrls[2] || settings.textureUrls[3]
        ? [
            settings.textureUrls[2] ? textures[2] : null,
            settings.textureUrls[3] ? textures[3] : null,
          ]
        : t0;

    return (
      <group position={[0, offset / 2, 0]}>
        <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
          <extrudeGeometry ref={geometryRef} args={[shape, settings]} />

          <meshPhysicalMaterial
            attach={"material-0"}
            color={color}
            map={t0[0]}
            normalMap={t0[1]}
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
            map={t1[0]}
            normalMap={t1[1]}
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
