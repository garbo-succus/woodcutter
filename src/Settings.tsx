import { MathUtils, Shape, Mesh, Box2, Vector2 } from "three";
import { useState, useEffect } from "react";
import { useEffectOnce } from "react-use";
import { SVGLoader } from "three-stdlib";
import ShapeSelector from "./ShapeSelector";
import { exportGltf } from "./exportGltf";
import { cleanupShape } from "./shapeCleanup";

const colors = [
  { value: "#FFFFFF", name: "White" },
  { value: "#B22222", name: "Red" },
  { value: "#FFD700", name: "Yellow" },
  { value: "#228B22", name: "Green" },
  { value: "#4B0082", name: "Purple" },
  { value: "#4169E1", name: "Blue" },
];

// Function to auto-scale a shape so the largest dimension is 1
function autoScaleShape(originalShape: Shape): Shape {
  const points = originalShape.getPoints();
  if (points.length === 0) return originalShape;

  // Calculate bounding box
  const box = new Box2();
  points.forEach((point) => box.expandByPoint(point));

  const size = box.getSize(new Vector2());
  const maxDimension = Math.max(size.x, size.y);

  if (maxDimension === 0) return originalShape;

  const scale = 1 / maxDimension;
  const center = box.getCenter(new Vector2());

  // Create new scaled and centered shape
  const scaledShape = new Shape();
  if (points.length > 0) {
    const firstPoint = points[0];
    const scaledX = (firstPoint.x - center.x) * scale;
    const scaledY = (firstPoint.y - center.y) * scale;
    scaledShape.moveTo(scaledX, scaledY);

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const scaledX = (point.x - center.x) * scale;
      const scaledY = (point.y - center.y) * scale;
      scaledShape.lineTo(scaledX, scaledY);
    }
  }

  return scaledShape;
}

// Function to convert SVG to Three.js Shape using SVGLoader
function svgToShape(svgText: string): Shape | null {
  try {
    const loader = new SVGLoader();
    const svgData = loader.parse(svgText);

    // Get the first path from the SVG
    if (svgData.paths && svgData.paths.length > 0) {
      const path = svgData.paths[0];

      // Convert the first shape from the path
      const shapes = SVGLoader.createShapes(path);
      if (shapes.length > 0) {
        const rawShape = shapes[0];
        // Center the imported shape
        return centerShape(rawShape);
      }
    }

    return null;
  } catch (error) {
    console.error("Error parsing SVG:", error);
    return null;
  }
}

// Function to center a shape around the origin
function centerShape(originalShape: Shape): Shape {
  const points = originalShape.getPoints();
  if (points.length === 0) return originalShape;

  // Calculate bounding box
  const box = new Box2();
  points.forEach((point) => box.expandByPoint(point));

  const center = box.getCenter(new Vector2());

  // Create new centered shape
  const centeredShape = new Shape();
  if (points.length > 0) {
    const firstPoint = points[0];
    const centeredX = firstPoint.x - center.x;
    const centeredY = firstPoint.y - center.y;
    centeredShape.moveTo(centeredX, centeredY);

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const centeredX = point.x - center.x;
      const centeredY = point.y - center.y;
      centeredShape.lineTo(centeredX, centeredY);
    }
  }

  return centeredShape;
}

// eslint-disable-next-line react-refresh/only-export-components
export const defaultSettings = {
  bevelEnabled: true,
  depth: 0.2,
  bevelThickness: 0.05,
  steps: 1,
  bevelSize: 0.05,
  bevelOffset: -0.05,
  bevelSegments: 4,
  maxSmoothAngle: Math.PI,
  previewColor: colors[3].value,
  showBackgroundShape: true,
  cleanupMethod: 1,
  clearcoat: 0,
  clearcoatRoughness: 0.1,
  roughness: 1,
  metalness: 0,
  transmission: 0,
  dispersion: 0,
  ior: 1.5,
  iridescence: 0,
  iridescenceIOR: 1.3,
  iridescenceThickness: 400,
  sheen: 0,
  sheenRoughness: 1,
  sheenColor: "#FFFFFF",
  specularIntensity: 1,
  specularColor: "#FFFFFF",
  thickness: 0,
  reflectivity: 0.5,
  materialInputType: "range",
  maxTextureSize: 256,
};

export type SettingsType = typeof defaultSettings;

interface SettingsProps {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
  meshRef: React.RefObject<Mesh>;
  shape: Shape;
  onShapeChange: (shape: Shape) => void;
}

interface SectionProps {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
}

interface CollapsibleSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  type?: "h3" | "h4";
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
  type = "h3",
}: CollapsibleSectionProps) {
  const HeadingTag = type;

  return (
    <div>
      <div
        className={`collapsible-header ${isExpanded ? "expanded" : ""}`}
        onClick={onToggle}
      >
        <HeadingTag className="collapsible-title">{title}</HeadingTag>
        <button type="button" className="collapsible-button">
          {isExpanded ? "−" : "+"}
        </button>
      </div>
      {isExpanded && <div>{children}</div>}
    </div>
  );
}

function ShapeSection({
  settings,
  onSettingsChange,
  shape,
  onShapeChange,
}: SectionProps & { shape: Shape; onShapeChange: (shape: Shape) => void }) {
  const [expanded, setExpanded] = useState(true);
  const [svgPreview, setSvgPreview] = useState<string>("/star.svg");
  const [originalShape, setOriginalShape] = useState<Shape | null>(null);

  // Load initial star.svg on component mount by simulating file change
  useEffectOnce(() => {
    const loadInitialShape = async () => {
      try {
        const response = await fetch("/star.svg");
        const svgText = await response.text();
        const newShape = svgToShape(svgText);

        if (newShape) {
          setOriginalShape(newShape);
          const cleanedShape = cleanupShape(newShape, settings.cleanupMethod);
          const scaledShape = autoScaleShape(cleanedShape);
          onShapeChange(scaledShape);
        }
      } catch (error) {
        console.error("Error loading initial star.svg:", error);
      }
    };

    loadInitialShape();
  });

  // Re-process original shape when cleanup method changes
  useEffect(() => {
    if (originalShape) {
      const cleanedShape = cleanupShape(originalShape, settings.cleanupMethod);
      const scaledShape = autoScaleShape(cleanedShape);
      onShapeChange(scaledShape);
    }
  }, [settings.cleanupMethod, originalShape, onShapeChange]);

  return (
    <CollapsibleSection
      title="Shape"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      type="h3"
    >
      <ShapeSelector
        shape={shape}
        onShapeChange={onShapeChange}
        cleanupMethod={settings.cleanupMethod}
        svgPreview={svgPreview}
        onSvgPreviewChange={setSvgPreview}
        originalShape={originalShape}
        onOriginalShapeChange={setOriginalShape}
      />

      <div className="field">
        <label>Cleanup method:</label>
        <select
          value={settings.cleanupMethod}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              cleanupMethod: parseInt(e.target.value),
            })
          }
        >
          <option value={0}>None</option>
          <option value={1}>Normal</option>
          <option value={2}>Aggressive</option>
        </select>
        <div className="description">
          Changes how the imported shape is tidied up.
        </div>
      </div>
    </CollapsibleSection>
  );
}

function ClearcoatSection({ settings, onSettingsChange }: SectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CollapsibleSection
      title="Clearcoat"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      type="h4"
    >
      <div className="field">
        <label>Clearcoat:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.1}
          value={settings.clearcoat}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              clearcoat: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Add a layer of varnish to the surface.
        </div>
      </div>

      <div className="field">
        <label>Clearcoat Roughness:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.05}
          value={settings.clearcoatRoughness}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              clearcoatRoughness: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Controls the roughness of the clearcoat layer.
        </div>
      </div>
    </CollapsibleSection>
  );
}

function IridescenceSection({ settings, onSettingsChange }: SectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CollapsibleSection
      title="Iridescence"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      type="h4"
    >
      <div className="field">
        <label>Iridescence:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.05}
          value={settings.iridescence}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              iridescence: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Creates rainbow-like color shifts at different angles.
        </div>
      </div>

      <div className="field">
        <label>Iridescence IOR:</label>
        <input
          type={settings.materialInputType}
          min={1}
          max={2.5}
          step={0.05}
          value={settings.iridescenceIOR}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              iridescenceIOR: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Index of refraction for the iridescent layer.
        </div>
      </div>

      <div className="field">
        <label>Iridescence Thickness:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1000}
          step={10}
          value={settings.iridescenceThickness}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              iridescenceThickness: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Thickness of the iridescent layer in nanometers.
        </div>
      </div>
    </CollapsibleSection>
  );
}

function SpecularSection({ settings, onSettingsChange }: SectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CollapsibleSection
      title="Specular"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      type="h4"
    >
      <div className="field">
        <label>Specular Intensity:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.05}
          value={settings.specularIntensity}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              specularIntensity: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Controls the strength of specular reflections.
        </div>
      </div>

      <div className="field">
        <label>Specular Color:</label>
        <input
          type="color"
          value={settings.specularColor}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              specularColor: e.target.value,
            })
          }
        />
        <div className="description">
          Color tint for the specular reflections.
        </div>
      </div>
    </CollapsibleSection>
  );
}

function TransmissionSection({ settings, onSettingsChange }: SectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CollapsibleSection
      title="Transmission"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      type="h4"
    >
      <div className="field">
        <label>Transmission:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.05}
          value={settings.transmission}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              transmission: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Makes the surface translucent or transparent.
        </div>
      </div>

      <div className="field">
        <label>Dispersion:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.05}
          value={settings.dispersion}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              dispersion: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Creates prismatic color separation in transparent materials.
        </div>
      </div>

      <div className="field">
        <label>IOR (Index of Refraction):</label>
        <input
          type={settings.materialInputType}
          min={1}
          max={2.5}
          step={0.05}
          value={settings.ior}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              ior: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Controls light bending through transparent materials.
        </div>
      </div>

      <div className="field">
        <label>Thickness:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={5}
          step={0.1}
          value={settings.thickness}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              thickness: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Volume thickness for subsurface scattering effects.
        </div>
      </div>
    </CollapsibleSection>
  );
}

function SheenSection({ settings, onSettingsChange }: SectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CollapsibleSection
      title="Sheen"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      type="h4"
    >
      <div className="field">
        <label>Sheen:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.05}
          value={settings.sheen}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              sheen: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Adds fabric-like reflectance to the surface.
        </div>
      </div>

      <div className="field">
        <label>Sheen Roughness:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.05}
          value={settings.sheenRoughness}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              sheenRoughness: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Controls the roughness of the sheen effect.
        </div>
      </div>

      <div className="field">
        <label>Sheen Color:</label>
        <input
          type="color"
          value={settings.sheenColor}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              sheenColor: e.target.value,
            })
          }
        />
        <div className="description">Color tint for the sheen reflectance.</div>
      </div>
    </CollapsibleSection>
  );
}

function OtherSection({ settings, onSettingsChange }: SectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CollapsibleSection
      title="Other"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      type="h4"
    >
      <div className="field">
        <label>Input Type:</label>
        <select
          value={settings.materialInputType}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              materialInputType: e.target.value,
            })
          }
        >
          <option value="range">Sliders</option>
          <option value="number">Numbers</option>
        </select>
        <div className="description">
          Changes how material values are entered.
        </div>
      </div>

      <div className="field">
        <label>Smoothing Angle (°):</label>
        <input
          type="number"
          step={1}
          min={0}
          max={180}
          value={Math.round(MathUtils.radToDeg(settings.maxSmoothAngle))}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              maxSmoothAngle: MathUtils.degToRad(parseFloat(e.target.value)),
            })
          }
        />
        <div className="description">
          Angles below this appear smooth, above appear sharp.
        </div>
      </div>

      <div className="field">
        <label>Show Background:</label>
        <input
          type="checkbox"
          checked={settings.showBackgroundShape}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              showBackgroundShape: e.target.checked,
            })
          }
        />
        <div className="description">
          Shows a background underneath the model.
        </div>
      </div>

      <div className="field">
        <label>Max Texture Size:</label>
        <select
          value={settings.maxTextureSize}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              maxTextureSize: parseInt(e.target.value),
            })
          }
        >
          <option value={128}>128px</option>
          <option value={256}>256px</option>
          <option value={512}>512px</option>
        </select>
        <div className="description">Texture size in the exported model.</div>
      </div>
    </CollapsibleSection>
  );
}

function MaterialSection({ settings, onSettingsChange }: SectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CollapsibleSection
      title="Material"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      type="h3"
    >
      <div style={{ fontSize: "12px", color: "darkred", paddingBottom: "8px" }}>
        <b>TODO:</b> edge & end grain textures not applied to all faces.
      </div>

      <div className="field">
        <label>Preview Color:</label>
        <input
          type="color"
          value={settings.previewColor}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              previewColor: e.target.value,
            })
          }
        />
        <div className="description">
          The exported model is always white. Change it in-game with{" "}
          <code>
            {"{ "}color: '{settings.previewColor}'{" }"}
          </code>
          .
        </div>
      </div>

      <div className="field">
        <label>Roughness:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.05}
          value={settings.roughness}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              roughness: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">Gives the surface a rough finish.</div>
      </div>

      <div className="field">
        <label>Metalness:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.05}
          value={settings.metalness}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              metalness: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">Gives the surface a metallic lustre.</div>
      </div>

      <div className="field">
        <label>Reflectivity:</label>
        <input
          type={settings.materialInputType}
          min={0}
          max={1}
          step={0.05}
          value={settings.reflectivity}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              reflectivity: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Controls the strength of reflections on the surface.
        </div>
      </div>

      <ClearcoatSection
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <IridescenceSection
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <SpecularSection
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <TransmissionSection
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <SheenSection settings={settings} onSettingsChange={onSettingsChange} />

      <OtherSection settings={settings} onSettingsChange={onSettingsChange} />
    </CollapsibleSection>
  );
}

function BevelSection({ settings, onSettingsChange }: SectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CollapsibleSection
      title="Bevel"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
      type="h3"
    >
      <div className="field">
        <label>Depth:</label>
        <input
          min={0.01}
          type="number"
          step="0.01"
          value={settings.depth}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              depth: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">Thickness of the shape.</div>
      </div>

      <div className="field">
        <label>Bevel depth:</label>
        <input
          type="number"
          step="0.01"
          min={0}
          value={settings.bevelThickness}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              bevelThickness: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">Height of the rounded edge.</div>
      </div>

      <div className="field">
        <label>Bevel size:</label>
        <input
          type="number"
          step="0.01"
          min={0}
          value={settings.bevelSize}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              bevelSize: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">Width of the rounded edge.</div>
      </div>

      <div className="field">
        <label>Bevel offset:</label>
        <input
          type="number"
          step="0.01"
          max={0}
          value={settings.bevelOffset}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              bevelOffset: parseFloat(e.target.value),
            })
          }
        />
        <div className="description">
          Shrink model to maintain original size. Should be negative bevel size.
          Lower values might create weird artifacts.
        </div>
      </div>

      <div className="field">
        <label>Bevel Segments:</label>
        <input
          type="number"
          min={0}
          max={16}
          value={settings.bevelSegments}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              bevelSegments: parseInt(e.target.value),
            })
          }
        />
        <div className="description">
          Number of polygons to approximate the rounded edge. More = worse
          performance; 2-4 is usually fine, unless you have a very round shape.
        </div>
      </div>
    </CollapsibleSection>
  );
}

export default function Settings({
  settings,
  onSettingsChange,
  meshRef,
  shape,
  onShapeChange,
}: SettingsProps) {
  return (
    <div className="config">
      <ShapeSection
        settings={settings}
        onSettingsChange={onSettingsChange}
        shape={shape}
        onShapeChange={onShapeChange}
      />

      <BevelSection settings={settings} onSettingsChange={onSettingsChange} />

      <MaterialSection
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <div className="button-container">
        <button type="button" onClick={() => onSettingsChange(defaultSettings)}>
          Reset
        </button>

        <button
          type="button"
          onClick={() =>
            exportGltf(meshRef, { maxTextureSize: settings.maxTextureSize })
          }
        >
          Download file
        </button>
      </div>

      <div className="description">
        Need help? <a href="https://discord.gg/sJVbJcd">Visit our Discord</a>
      </div>
    </div>
  );
}
