import { Canvas } from "@react-three/fiber";
import { Stage, OrbitControls } from "@react-three/drei";
import { useRef, useState } from "react";
import { Mesh, Shape } from "three";
import Settings, { defaultSettings } from "./Settings";
import ExtrudedShape from "./ExtrudedShape";
import Footer from "./Footer";
import "./App.css";

function App() {
  const [settings, setSettings] = useState(defaultSettings);
  const [shape, setShape] = useState(new Shape());
  const meshRef = useRef<Mesh>(null!);

  return (
    <div className="app">
      <div className="main-content">
        <div className="sidebar">
          <h1>Woodcutter</h1>
          <p>
            This is a tool for creating 3D models from 2D cut-outs. It's meant
            for digital tabletop & board game tokens, such as wooden meeples.
          </p>
          <Settings
            settings={settings}
            onSettingsChange={setSettings}
            meshRef={meshRef}
            shape={shape}
            onShapeChange={setShape}
          />
        </div>

        <div className="canvas-container">
          <Canvas camera={{ position: [0, 2, 1] }}>
            <Stage shadows={false} adjustCamera={false}>
              <ExtrudedShape
                ref={meshRef}
                shape={shape}
                settings={settings}
                color={settings.previewColor}
              />
            </Stage>
            <OrbitControls enablePan={false} minDistance={1} maxDistance={3} />
          </Canvas>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default App;
