import { Shape, Box2, Vector2 } from "three";
import { useRef, useState, useEffect } from "react";
import { SVGLoader } from "three-stdlib";
import { cleanupShape } from "./shapeCleanup";
import { useEffectOnce } from "react-use";

interface ShapeSelectorProps {
  shape: Shape;
  onShapeChange: (shape: Shape) => void;
  cleanupMethod: number;
}

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
        return shapes[0];
      }
    }

    return null;
  } catch (error) {
    console.error("Error parsing SVG:", error);
    return null;
  }
}

export default function ShapeSelector({
  onShapeChange,
  cleanupMethod,
}: ShapeSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [svgPreview, setSvgPreview] = useState<string>("/star.svg");
  const [originalShape, setOriginalShape] = useState<Shape | null>(null);

  // Load initial star.svg on component mount by simulating file change
  useEffectOnce(() => {
    const loadInitialShape = async () => {
      try {
        const response = await fetch("/star.svg");
        const svgText = await response.text();

        // Create a synthetic file change event
        const blob = new Blob([svgText], { type: "image/svg+xml" });
        const file = new File([blob], "star.svg", { type: "image/svg+xml" });

        // Create synthetic event
        const syntheticEvent = {
          target: {
            files: [file],
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        // Use the same handler as user file uploads
        await handleFileSelect(syntheticEvent);
      } catch (error) {
        console.error("Error loading initial star.svg:", error);
      }
    };

    loadInitialShape();
  });

  // Re-process original shape when cleanup method changes
  useEffect(() => {
    if (originalShape) {
      const cleanedShape = cleanupShape(originalShape, cleanupMethod);
      const scaledShape = autoScaleShape(cleanedShape);
      onShapeChange(scaledShape);
    }
  }, [cleanupMethod, originalShape, onShapeChange]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.includes("svg")) return;

    const text = await file.text();
    const newShape = svgToShape(text);

    if (newShape) {
      setOriginalShape(newShape);
      const cleanedShape = cleanupShape(newShape, cleanupMethod);
      const scaledShape = autoScaleShape(cleanedShape);
      onShapeChange(scaledShape);
    }

    // Create preview URL
    const blob = new Blob([text], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    setSvgPreview(url);
  };

  return (
    <>
      <div className="field">
        <label>
          Shape image{" "}
          <a href="https://www.w3schools.com/graphics/svg_intro.asp">(SVG)</a>:
        </label>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
        </div>
        {svgPreview && (
          <div className="svg-preview">
            <img
              src={svgPreview}
              alt="SVG Preview"
              style={{
                width: "100px",
                height: "100px",
                border: "1px solid #ccc",
              }}
            />
          </div>
        )}
      </div>
      <div style={{ fontSize: "12px", color: "darkred" }}>
        <b>TODO:</b> Only the first shape in the SVG is used.
      </div>
    </>
  );
}
