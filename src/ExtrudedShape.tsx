import { useLoader } from "@react-three/fiber";
import { type ComponentProps, forwardRef, useRef, useEffect } from "react";
import { Shape, Mesh, ExtrudeGeometry, TextureLoader, FrontSide, DoubleSide } from "three";
import * as BufferGeometryUtils from "three-stdlib";
import type { SettingsType } from "./Settings";

// 1x1 white PNG for placeholder textures
const EMPTY_TEXTURE_URL = "1px.png";

const BackgroundShape = (props: ComponentProps<"group">) => {
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

interface MaterialProps extends ComponentProps<"meshPhysicalMaterial"> {
  mapSrc?: string;
  normalMapSrc?: string;
  iridescenceThickness: number;
  textureScale: number;
}

const Material = ({
  mapSrc = EMPTY_TEXTURE_URL,
  normalMapSrc = EMPTY_TEXTURE_URL,
  iridescenceThickness,
  textureScale,
  ...props
}: MaterialProps) => {
  const [map, normalMap] = useLoader(TextureLoader, [mapSrc, normalMapSrc]);

  // Configure texture wrapping and repeat
  useEffect(() => {
    [map, normalMap].forEach((texture) => {
      texture.wrapS = texture.wrapT = 1000; // RepeatWrapping
      texture.repeat.set(textureScale, textureScale);
    });
  }, [map, normalMap, textureScale]);

  return (
    <meshPhysicalMaterial
      {...props}
      map={map}
      normalMap={normalMap}
      side={props.transmission === 0 ? FrontSide : DoubleSide}
      iridescenceThicknessRange={[0, iridescenceThickness]}
    />
  );
};

const ExtrudedShape = forwardRef<Mesh, ExtrudedShapeProps>(
  ({ shape, settings, color }, ref) => {
    const geometryRef = useRef<ExtrudeGeometry>(null!);

    useEffect(() => {
      if (geometryRef.current && settings.maxSmoothAngle > 0) {
        BufferGeometryUtils.toCreasedNormals(
          geometryRef.current,
          settings.maxSmoothAngle,
        );
      }
    }, [shape, settings]);

    const offset = settings.depth + settings.bevelThickness;

    const showEdgeTextures = settings.textureUrls[2] || settings.textureUrls[3];

    return (
      <group position={[0, offset / 2, 0]}>
        <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
          <extrudeGeometry ref={geometryRef} args={[shape, settings]} />

          <Material
            attach={"material-0"}
            mapSrc={settings.textureUrls[0]}
            normalMapSrc={settings.textureUrls[1]}
            color={color}
            clearcoat={settings.clearcoat}
            clearcoatRoughness={settings.clearcoatRoughness}
            roughness={settings.roughness}
            metalness={settings.metalness}
            transmission={settings.transmission}
            dispersion={settings.dispersion}
            ior={settings.ior}
            iridescence={settings.iridescence}
            iridescenceIOR={settings.iridescenceIOR}
            iridescenceThickness={settings.iridescenceThickness}
            sheen={settings.sheen}
            sheenRoughness={settings.sheenRoughness}
            sheenColor={settings.sheenColor}
            specularIntensity={settings.specularIntensity}
            specularColor={settings.specularColor}
            thickness={settings.thickness}
            reflectivity={settings.reflectivity}
            textureScale={settings.textureScale}
          />
          <Material
            attach={"material-1"}
            mapSrc={
              showEdgeTextures
                ? settings.textureUrls[2]
                : settings.textureUrls[0]
            }
            normalMapSrc={
              showEdgeTextures
                ? settings.textureUrls[3]
                : settings.textureUrls[1]
            }
            color={color}
            clearcoat={settings.clearcoat}
            clearcoatRoughness={settings.clearcoatRoughness}
            roughness={settings.roughness}
            metalness={settings.metalness}
            transmission={settings.transmission}
            dispersion={settings.dispersion}
            ior={settings.ior}
            iridescence={settings.iridescence}
            iridescenceIOR={settings.iridescenceIOR}
            iridescenceThickness={settings.iridescenceThickness}
            sheen={settings.sheen}
            sheenRoughness={settings.sheenRoughness}
            sheenColor={settings.sheenColor}
            specularIntensity={settings.specularIntensity}
            specularColor={settings.specularColor}
            thickness={settings.thickness}
            reflectivity={settings.reflectivity}
            textureScale={showEdgeTextures ? settings.edgeTextureScale : settings.textureScale}
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
