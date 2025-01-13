import React, { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { AnimationMixer, Clock, Group, Vector3, Euler } from 'three';

function VRMScene({ 
  backgroundUrl, 
  vrmUrl, 
  cameraRef, 
  modelPosition, 
  modelRotation, 
  modelScale,
  cameraTarget,
  setModelPosition, 
  setModelRotation,
  setCameraTarget 
}) {
  const backgroundRef = useRef(new Group());
  const vrmModelRef = useRef(new Group());
  const mixerRef = useRef();
  const vrmRef = useRef(null);
  const clockRef = useRef(new Clock());
  const controlsRef = useRef();

  const loadVRMModel = useCallback(() => {
    if (!vrmUrl) return;

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      vrmUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm;
        vrmRef.current = vrm;
        VRMUtils.rotateVRM0(vrm);
        
        vrmModelRef.current.clear();
        vrmModelRef.current.add(vrm.scene);

        mixerRef.current = new AnimationMixer(vrm.scene);
      },
      (progress) => // console.log(`VRM loading: ${(progress.loaded / progress.total) * 100}%`),
      (error) => console.error("Error loading VRM:", error)
    );
  }, [vrmUrl]);

  const loadBackgroundModel = useCallback(() => {
    if (!backgroundUrl) return;

    const loader = new GLTFLoader();
    loader.load(
      backgroundUrl,
      (gltf) => {
        const scene = gltf.scene;
        backgroundRef.current.clear();
        backgroundRef.current.add(scene);
      },
      (progress) => // console.log(`Background loading: ${(progress.loaded / progress.total) * 100}%`),
      (error) => console.error("Error loading background:", error)
    );
  }, [backgroundUrl]);

  useEffect(() => {
    if (controlsRef.current && cameraTarget) {
      controlsRef.current.target.set(cameraTarget.x, cameraTarget.y, cameraTarget.z);
      controlsRef.current.update();
    }
  }, [cameraTarget]);

  useEffect(() => {
    loadBackgroundModel();
  }, [loadBackgroundModel]);

  useEffect(() => {
    loadVRMModel();
  }, [loadVRMModel]);

  useEffect(() => {
    if (vrmModelRef.current) {
      vrmModelRef.current.position.set(modelPosition.x, modelPosition.y, modelPosition.z);
      vrmModelRef.current.rotation.set(modelRotation.x, modelRotation.y, modelRotation.z);
      vrmModelRef.current.scale.set(modelScale.x, modelScale.y, modelScale.z);
    }
  }, [modelPosition, modelRotation, modelScale]);

  useFrame(() => {
    const delta = clockRef.current.getDelta();
    if (mixerRef.current) mixerRef.current.update(delta);

    if (controlsRef.current) {
      const target = controlsRef.current.target;
      setCameraTarget({
        x: Number(target.x.toFixed(2)),
        y: Number(target.y.toFixed(2)),
        z: Number(target.z.toFixed(2))
      });
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 1, 5]} far={1000} />
      <OrbitControls 
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={1000}
        minDistance={0.1}
        zoomSpeed={0.5}
        panSpeed={0.5}
        rotateSpeed={0.5}
        screenSpacePanning={true}
        enableDamping={true}
        dampingFactor={0.05}
      />
      <primitive object={backgroundRef.current} />
      <primitive object={vrmModelRef.current} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <gridHelper args={[20, 20]} />
    </>
  );
}

export default function SceneConfigurator() {
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [vrmUrl, setVrmUrl] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [modelPosition, setModelPosition] = useState(new Vector3(0, 0, 0));
  const [modelRotation, setModelRotation] = useState(new Euler(0, 0, 0));
  const [modelScale, setModelScale] = useState(new Vector3(1, 1, 1));
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 1, z: 5 });
  const [cameraTarget, setCameraTarget] = useState({ x: 0, y: 0, z: 0 });
  const cameraRef = useRef();
  const fileInputRef = useRef();
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [vrmFile, setVrmFile] = useState(null);
  const backgroundInputRef = useRef();
  const vrmInputRef = useRef();

  const MOVE_AMOUNT = 0.1;
  const ROTATE_AMOUNT = 0.1;
  const SCALE_AMOUNT = 0.1;

  const updateCameraPosition = useCallback(() => {
    if (cameraRef.current) {
      const pos = cameraRef.current.position;
      setCameraPosition({
        x: Number(pos.x.toFixed(2)),
        y: Number(pos.y.toFixed(2)),
        z: Number(pos.z.toFixed(2))
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(updateCameraPosition, 100);
    return () => clearInterval(interval);
  }, [updateCameraPosition]);

  const handleKeyDown = (event) => {
    const isInputField = event.target.tagName.toLowerCase() === 'input';
    if (isInputField) return;

    const controlKeys = ['w', 's', 'a', 'd', 'q', 'e', 'r', 'f', 'z', 'c', 'v', 'b', 'x', 'y', 'n'];
    if (controlKeys.includes(event.key.toLowerCase())) {
      event.preventDefault();
    }

    // Model Scale Controls
    if (event.shiftKey) {
      setModelScale((prev) => {
        const newScale = prev.clone();
        switch (event.key.toLowerCase()) {
          case 'x': 
            return new Vector3().setScalar(Math.max(0.1, prev.x - SCALE_AMOUNT));
          case 'y': 
            return new Vector3().setScalar(Math.max(0.1, prev.x - SCALE_AMOUNT));
          case 'n':
            newScale.z = Math.max(0.1, newScale.z - SCALE_AMOUNT);
            break;
        }
        return newScale;
      });
    } else {
      setModelScale((prev) => {
        const newScale = prev.clone();
        switch (event.key.toLowerCase()) {
          case 'x': newScale.x = Math.max(0.1, newScale.x + SCALE_AMOUNT); break;
          case 'y': newScale.y = Math.max(0.1, newScale.y + SCALE_AMOUNT); break;
          case 'n': newScale.z = Math.max(0.1, newScale.z + SCALE_AMOUNT); break;
        }
        return newScale;
      });
    }

    // Model Position Controls
    setModelPosition((prev) => {
      const newPos = prev.clone();
      switch (event.key.toLowerCase()) {
        case 'w': newPos.z -= MOVE_AMOUNT; break;
        case 's': newPos.z += MOVE_AMOUNT; break;
        case 'a': newPos.x -= MOVE_AMOUNT; break;
        case 'd': newPos.x += MOVE_AMOUNT; break;
        case 'q': newPos.y += MOVE_AMOUNT; break;
        case 'e': newPos.y -= MOVE_AMOUNT; break;
      }
      return newPos;
    });

    // Model Rotation Controls
    setModelRotation((prev) => {
      const newRot = new Euler(prev.x, prev.y, prev.z);
      switch (event.key.toLowerCase()) {
        case 'r': newRot.x -= ROTATE_AMOUNT; break;
        case 'f': newRot.x += ROTATE_AMOUNT; break;
        case 'z': newRot.y -= ROTATE_AMOUNT; break;
        case 'c': newRot.y += ROTATE_AMOUNT; break;
        case 'v': newRot.z -= ROTATE_AMOUNT; break;
        case 'b': newRot.z += ROTATE_AMOUNT; break;
      }
      return newRot;
    });
  };

  const handleLoadModels = () => {
    if (!backgroundUrl || !vrmUrl) {
      alert('Please provide both background and VRM model URLs');
      return;
    }
    setIsLoaded(true);
  };

  const handleUploadConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        
        // Update all state values from the config
        setBackgroundUrl(config.background);
        setVrmUrl(config.vrmModel);
        setModelPosition(new Vector3(
          config.modelPosition.x,
          config.modelPosition.y,
          config.modelPosition.z
        ));
        setModelRotation(new Euler(
          config.modelRotation.x,
          config.modelRotation.y,
          config.modelRotation.z
        ));
        setModelScale(new Vector3(
          config.modelScale.x,
          config.modelScale.y,
          config.modelScale.z
        ));
        
        // Update camera position and target
        setCameraPosition({
          x: config.cameraPosition.x,
          y: config.cameraPosition.y,
          z: config.cameraPosition.z
        });
        setCameraTarget({
          x: config.cameraTarget.x,
          y: config.cameraTarget.y,
          z: config.cameraTarget.z
        });

        // Directly update camera position
        if (cameraRef.current) {
          cameraRef.current.position.set(
            config.cameraPosition.x,
            config.cameraPosition.y,
            config.cameraPosition.z
          );
          cameraRef.current.fov = config.cameraConfig.fov;
          cameraRef.current.near = config.cameraConfig.near;
          cameraRef.current.far = config.cameraConfig.far;
          cameraRef.current.zoom = config.cameraConfig.zoom;
          cameraRef.current.filmGauge = config.cameraConfig.filmGauge;
          cameraRef.current.filmOffset = config.cameraConfig.filmOffset;
          cameraRef.current.updateProjectionMatrix();
          cameraRef.current.updateMatrixWorld();
        }

        // Automatically load the scene after config is loaded
        setIsLoaded(true);
      } catch (error) {
        console.error('Error parsing config file:', error);
        alert('Error loading configuration file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadConfig = () => {
    if (!backgroundUrl || !vrmUrl) {
      alert('Please provide both background and VRM model URLs');
      return;
    }
  
    const camera = cameraRef.current;
    
    const config = {
      background: backgroundUrl,
      vrmModel: vrmUrl,
      cameraPosition: {
        x: Number(cameraPosition.x.toFixed(4)),
        y: Number(cameraPosition.y.toFixed(4)),
        z: Number(cameraPosition.z.toFixed(4))
      },
      cameraTarget: {
        x: Number(cameraTarget.x.toFixed(4)),
        y: Number(cameraTarget.y.toFixed(4)),
        z: Number(cameraTarget.z.toFixed(4))
      },
      cameraConfig: {
        fov: camera?.fov || 50,
        near: camera?.near || 0.1,
        far: camera?.far || 1000,
        zoom: camera?.zoom || 1,
        aspect: camera?.aspect || window.innerWidth / window.innerHeight,
        filmGauge: camera?.filmGauge || 35,
        filmOffset: camera?.filmOffset || 0
      },
      modelPosition: {
        x: Number(modelPosition.x.toFixed(4)),
        y: Number(modelPosition.y.toFixed(4)),
        z: Number(modelPosition.z.toFixed(4))
      },
      modelRotation: {
        x: Number(modelRotation.x.toFixed(4)),
        y: Number(modelRotation.y.toFixed(4)),
        z: Number(modelRotation.z.toFixed(4))
      },
      modelScale: {
        x: Number(modelScale.x.toFixed(4)),
        y: Number(modelScale.y.toFixed(4)),
        z: Number(modelScale.z.toFixed(4))
      }
    };
  
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scene-config.json';
    link.click();
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (type === 'background') {
      setBackgroundFile(file);
      setBackgroundUrl(url);
    } else if (type === 'vrm') {
      setVrmFile(file);
      setVrmUrl(url);
    }
  };

  return (
    <div 
      className="scene-configurator" 
      onKeyDown={handleKeyDown}
      tabIndex={0} 
      style={{ outline: 'none' }}
    >
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        zIndex: 1000, 
        backgroundColor: 'rgba(0,0,0,0.85)', 
        color: 'white', 
        padding: '12px', 
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        fontSize: '12px',
        fontFamily: 'monospace',
        minWidth: '180px',
        maxWidth: '200px',
        lineHeight: '1.2'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#88ccff' }}>Scene Information</div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px', alignItems: 'center' }}>
        <div style={{ color: '#88ccff', gridColumn: '1 / -1', marginTop: '4px' }}>Camera:</div>
          <div>X:</div><div>{cameraPosition.x}</div>
          <div>Y:</div><div>{cameraPosition.y}</div>
          <div>Z:</div><div>{cameraPosition.z}</div>
          
          <div style={{ color: '#88ccff', gridColumn: '1 / -1', marginTop: '4px' }}>Look At:</div>
          <div>X:</div><div>{cameraTarget.x}</div>
          <div>Y:</div><div>{cameraTarget.y}</div>
          <div>Z:</div><div>{cameraTarget.z}</div>
          
          <div style={{ color: '#88ccff', gridColumn: '1 / -1', marginTop: '4px' }}>Position:</div>
          <div>X:</div><div>{modelPosition.x.toFixed(2)}</div>
          <div>Y:</div><div>{modelPosition.y.toFixed(2)}</div>
          <div>Z:</div><div>{modelPosition.z.toFixed(2)}</div>
          
          <div style={{ color: '#88ccff', gridColumn: '1 / -1', marginTop: '4px' }}>Rotation:</div>
          <div>X:</div><div>{(modelRotation.x * (180/Math.PI)).toFixed(1)}°</div>
          <div>Y:</div><div>{(modelRotation.y * (180/Math.PI)).toFixed(1)}°</div>
          <div>Z:</div><div>{(modelRotation.z * (180/Math.PI)).toFixed(1)}°</div>
          
          <div style={{ color: '#88ccff', gridColumn: '1 / -1', marginTop: '4px' }}>Scale:</div>
          <div>X:</div><div>{modelScale.x.toFixed(2)}</div>
          <div>Y:</div><div>{modelScale.y.toFixed(2)}</div>
          <div>Z:</div><div>{modelScale.z.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ 
        position: 'absolute', 
        top: 20, 
        right: 20, 
        zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        <div style={{ marginBottom: '15px', color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
          Load Models
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ 
            display: 'block', 
            color: '#88ccff', 
            marginBottom: '5px',
            fontSize: '14px' 
          }}>
            Background Model:
          </label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Enter Background URL"
              value={backgroundUrl}
              onChange={(e) => setBackgroundUrl(e.target.value)}
              style={{ 
                width: '300px',
                padding: '8px 12px',
                border: '1px solid #666',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.9)',
                fontSize: '14px'
              }}
            />
            <input
              ref={backgroundInputRef}
              type="file"
              accept=".glb,.gltf"
              onChange={(e) => handleFileUpload(e, 'background')}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => backgroundInputRef.current?.click()}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Upload File
            </button>
          </div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            color: '#88ccff', 
            marginBottom: '5px',
            fontSize: '14px'
          }}>
            VRM Model:
          </label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Enter VRM Model URL"
              value={vrmUrl}
              onChange={(e) => setVrmUrl(e.target.value)}
              style={{ 
                width: '300px',
                padding: '8px 12px',
                border: '1px solid #666',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.9)',
                fontSize: '14px'
              }}
            />
            <input
              ref={vrmInputRef}
              type="file"
              accept=".vrm"
              onChange={(e) => handleFileUpload(e, 'vrm')}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => vrmInputRef.current?.click()}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Upload File
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleLoadModels} 
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
          >
            Load Models
          </button>
          <button 
            onClick={handleDownloadConfig} 
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
          >
            Download Config
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleUploadConfig}
            style={{ display: 'none' }}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              padding: '8px 16px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F57C00'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FF9800'}
          >
            Upload Config
          </button>
        </div>
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: 20, 
        left: 20, 
        zIndex: 1000, 
        backgroundColor: 'rgba(0,0,0,0.85)', 
        color: 'white', 
        padding: '15px', 
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ color: '#88ccff', marginBottom: '5px' }}>Camera (Mouse):</div>
          <div>• Left Click + Drag: Rotate View</div>
          <div>• Right Click + Drag or Middle Click + Drag: Pan</div>
          <div>• Mouse Wheel: Zoom</div>
        </div>
        
        <div>
          <div style={{ color: '#88ccff', marginBottom: '5px' }}>Model Controls:</div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: '#aaddff', marginBottom: '3px' }}>Position:</div>
            <div>• WASD: Move in X/Z plane</div>
            <div>• Q/E: Move Up/Down</div>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <div style={{ color: '#aaddff', marginBottom: '3px' }}>Rotation:</div>
            <div>• R/F: Pitch (X)</div>
            <div>• Z/C: Yaw (Y)</div>
            <div>• V/B: Roll (Z)</div>
          </div>
          
          <div>
            <div style={{ color: '#aaddff', marginBottom: '3px' }}>Scale:</div>
            <div>• X: Scale X axis</div>
            <div>• Y: Scale Y axis</div>
            <div>• N: Scale Z axis</div>
            <div>• Hold Shift + X/Y: Uniform scale up/down</div>
          </div>
        </div>
      </div>

      {isLoaded && (
        <Canvas style={{ width: '100vw', height: '100vh' }}>
          <Suspense fallback={null}>
            <VRMScene
              backgroundUrl={backgroundUrl}
              vrmUrl={vrmUrl}
              cameraRef={cameraRef}
              modelPosition={modelPosition}
              modelRotation={modelRotation}
              modelScale={modelScale}
              cameraTarget={cameraTarget}
              setModelPosition={setModelPosition}
              setModelRotation={setModelRotation}
              setCameraTarget={setCameraTarget}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}