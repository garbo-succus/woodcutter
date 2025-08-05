import { MathUtils, Shape, Mesh } from "three";
import { useState } from "react";
import ShapeSelector from "./ShapeSelector";
import { exportGltf } from "./exportGltf";


const colors = [
  { value: "#FFFFFF", name: "White" },
  { value: "#B22222", name: "Red" },
  { value: "#FFD700", name: "Yellow" },
  { value: "#228B22", name: "Green" },
  { value: "#4B0082", name: "Purple" },
  { value: "#4169E1", name: "Blue" },
];


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
  cleanupMethod: 1,
  clearcoat: 0,
  roughness: 1,
  metalness: 0,
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
}

function CollapsibleSection({
  title,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div>
      <div
        className={`collapsible-header ${isExpanded ? "expanded" : ""}`}
        onClick={onToggle}
      >
        <h3 className="collapsible-title">{title}</h3>
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

  return (
    <CollapsibleSection
      title="Shape"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <ShapeSelector
        shape={shape}
        onShapeChange={onShapeChange}
        cleanupMethod={settings.cleanupMethod}
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

function MaterialSection({ settings, onSettingsChange }: SectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CollapsibleSection
      title="Material"
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <div style={{ fontSize: "12px", color: "darkred", paddingBottom: "8px" }}>
        <b>TODO:</b> edge & end grain textures not applied to all faces.
      </div>

      <div className="field">
        <label>Preview Color:</label>
        <select
          value={settings.previewColor}
          onChange={(e) =>
            onSettingsChange({
              ...settings,
              previewColor: e.target.value,
            })
          }
        >
          {colors.map((color) => (
            <option key={color.value} value={color.value}>
              {color.name}
            </option>
          ))}
        </select>
        <div className="description">The exported model is always white.</div>
      </div>

      <div className="field">
        <label>Roughness:</label>
        <input
          type="range"
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
          type="range"
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
        <label>Clearcoat:</label>
        <input
          type="range"
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
    >
      <div className="field">
        <label>Depth:</label>
        <input
          min={0}
          type="number"
          step="0.1"
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

      <MaterialSection
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <BevelSection settings={settings} onSettingsChange={onSettingsChange} />

      <div className="button-container">
        <button type="button" onClick={() => onSettingsChange(defaultSettings)}>
          Reset
        </button>

        <button type="button" onClick={() => exportGltf(meshRef)}>
          Download GLTF
        </button>
      </div>

      <div className="description">
        Need help? <a href="https://discord.gg/sJVbJcd">Visit our Discord</a>
      </div>
    </div>
  );
}
