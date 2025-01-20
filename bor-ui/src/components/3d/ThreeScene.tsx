import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, useGLTF, OrbitControls, Loader } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import {
  AnimationMixer,
  Clock,
  Group,
  AnimationAction,
  LoopOnce,
  LoopRepeat,
  Vector3
} from 'three';
import { loadMixamoAnimation } from '../old/loadMixamoAnimation.js';
import { useScene } from '../../contexts/ScenesContext.js';
// import Note from '../Note';

import { getAnimationUrl, getEnvironmentUrl, getModelUrl } from '../../utils/constants.js';
import { useSceneEngine } from '../../contexts/SceneEngineContext.js';
import { SceneConfig } from '../../utils/constants.js';

// Configuration for different models
// interface ModelConfig {
//   cameraPosition: [number, number, number];
//   modelPosition: [number, number, number];
//   modelRotation: [number, number, number];
//   modelScale: [number, number, number];
//   environmentScale: [number, number, number];
//   environmentPosition: [number, number, number];
//   environmentRotation: [number, number, number];
// }

// const MODEL_CONFIG = {
//   cameraPosition: [0, 1.15, 1],
//   modelPosition: [0, 0, 0],
//   modelRotation: [0, 0, 0],
//   modelScale: [1, 1, 1],
//   environmentScale: [2, 1.9, 2],
//   environmentPosition: [0, -1, -5],
//   environmentRotation: [0, Math.PI / 2, 0],
// }

export const IPFS_BASE_URL = 'https://bafybeibgfj5zr3wtmbl6hgx5kuc4suiledti3ozkhydt2mitmkpq7iqbwm.ipfs.flk-ipfs.xyz/animations';
//avoir ca doit etre changer par le bon url cdn


const ANIMATIONS = [
  '/animations/acknowledging.fbx',
  '/animations/angry_gesture.fbx',
  '/animations/annoyed_head_shake.fbx',
  '/animations/being_cocky.fbx',
  // '/animations/blow_a_kiss.fbx',
  '/animations/dismissing_gesture.fbx',
  // '/animations/happy_hand_gesture.fbx',
  '/animations/hard_head_nod.fbx',
  '/animations/head_nod_yes.fbx',
  '/animations/hip_hop_dancing.fbx',
  '/animations/idle.fbx',
  '/animations/laughing.fbx',
  '/animations/lengthy_head_nod.fbx',
  '/animations/look_away_gesture.fbx',
  '/animations/relieved_sigh.fbx',
  '/animations/sarcastic_head_nod.fbx',
  '/animations/shaking_head_no.fbx',
  '/animations/thoughtful_head_shake.fbx',
  '/animations/weight_shift.fbx',
  '/animations/defeated.fbx',
  '/animations/praying.fbx',
  '/animations/hiphop_dancing.fbx',
  '/animations/silly_dancing.fbx',
  '/animations/angry.fbx',
  '/animations/happy_idle.fbx',
  '/animations/floating.fbx',
  '/animations/robot_dance.fbx',
  '/animations/bboy_hipHopMove.fbx',
  '/animations/swing_dancing.fbx',
  '/animations/nervously_look_around.fbx',
  '/animations/arm_stretching.fbx',
  '/animations/salute.fbx',
  '/animations/excited.fbx',
  '/animations/greeting.fbx',
  '/animations/arguing.fbx',
  '/animations/chicken_dance.fbx',
  '/animations/youre_loser.fbx',
  '/animations/look_around.fbx',
  '/animations/saying_no.fbx',
  '/animations/shaking_hands.fbx',
  '/animations/insulting.fbx',
  '/animations/threatening.fbx',
  '/animations/happy.fbx',
  '/animations/are_you_crazy.fbx',
  '/animations/focusing.fbx',
  '/animations/speedbag_boxing.fbx',
  '/animations/idlet.fbx',
  '/animations/Pointing.fbx',
  '/animations/light_dance.fbx',
  '/animations/hands_up.fbx',
  '/animations/trump_dance.fbx',
  '/animations/Listening_To_Music.fbx',
  '/animations/play_golf.fbx',
  '/animations/cheering.fbx',
  '/animations/fist_up.fbx'


];


// Helper function to get model name from URL
const getModelNameFromUrl = (url: string): string => {
  const parts = url.split('/');
  return parts[parts.length - 1];
};

// Make CafeEnvironment a proper React component
const CafeEnvironment: React.FC<{ environmentUrl: string, config: ModelConfig }> = ({ environmentUrl: _environmentUrl, config }) => {
  // console.log("CAFE_ENVIRONMENT", _environmentUrl)
  const environmentUrl = getEnvironmentUrl(_environmentUrl)
  const { scene } = useGLTF(environmentUrl);

  if (!scene) {
    console.error('Cafe scene is missing');
    return null;
  }

  return (
    <primitive
      object={scene}
      scale={config.environmentScale}
      position={config.environmentPosition}
      rotation={config.environmentRotation}
    />
  );
};

type ConfigKey = keyof ModelConfig;


// Example usage:
// updateSceneConfig('cameraPosition', [0, 1.5, 1], setSceneConfig);

// Then in your component:

interface AudioData {
  buffer: Float32Array;
  duration: number;
  timestamp: number;
}

interface LipSyncConfig {
  threshold: number;
  smoothing: number;
  mouthOpenValue: number;
}

interface ModelConfig {
  // ... existing properties ...
  lipSyncConfig?: {
    threshold: number;
    smoothing: number;
    mouthOpenValue: number;
  };
}

export function ThreeScene({ debugMode }: { debugMode: boolean }) {
  const modelRefs = useRef<(Group | undefined)[]>([]);
  const vrmRefs = useRef<any[]>([]);
  const mixerRefs = useRef<(AnimationMixer | undefined)[]>([]); 
  const actionsRefs = useRef<{ [key: string]: AnimationAction }[]>([]);

  const clockRef = useRef(new Clock());
  const currentActionRef = useRef<string | null>(null);
  const nextAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { animation, animationFile, audioData } = useSceneEngine();
  const { newScenes, activeScene, sceneConfigIndex } = useScene();
  const scene = newScenes[activeScene];

  const activeSceneConfig: SceneConfig = useMemo(() => scene?.sceneConfigs[sceneConfigIndex], [scene, sceneConfigIndex])
  const environmentUrl = activeSceneConfig?.environmentURL

  const models = activeSceneConfig?.models || [];

  // This is the config we use for the scene
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>(activeSceneConfig);

  console.log({sceneConfig})

  // This is the index of the model we are currently using (editor)
  const [selectedModelIndex, setSelectedModelIndex] = useState<number>(0);
  const currentModel = getModelUrl(models[selectedModelIndex].model);

  // Add camera position state
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(sceneConfig.cameraPosition);
  const [cameraRotation, setCameraRotation] = useState<number>(sceneConfig.cameraRotation);
  const [cameraPitch, setCameraPitch] = useState<number>(sceneConfig.cameraPitch);

  console.log("THIS IS THE SCENE CONFIG", { ...sceneConfig, cameraPosition, cameraRotation, cameraPitch })

  const updateSceneConfig = useCallback((
    key: ConfigKey,
    value: [number, number, number]
  ) => {
    setSceneConfig(prev => ({
      ...prev,
      [key]: value
    }));
  }, [setSceneConfig]);


  // Function to play a specific animation
  const playAnimation = useCallback((animationPath: string, loopOnce: boolean = true, modelIndex: number = 0) => {
    console.log('🎬 Playing Animation:', { 
      animationPath, 
      loopOnce, 
      modelIndex,
      hasMixer: !!mixerRefs.current[modelIndex],
      hasActions: !!actionsRefs.current[modelIndex]
    });

    const mixer = mixerRefs.current[modelIndex];
    const actions = actionsRefs.current[modelIndex];
    if (!mixer || !actions?.[animationPath]) return;

    // Cancel any pending animation timeouts
    if (nextAnimationTimeoutRef.current) {
      clearTimeout(nextAnimationTimeoutRef.current);
    }

    // Fade out current animation if it exists
    if (currentActionRef.current && actions[currentActionRef.current]) {
      const currentAction = actions[currentActionRef.current];
      currentAction.fadeOut(0.5);
    }

    // Play new animation
    const action = actions[animationPath];
    action.reset();
    action.clampWhenFinished = loopOnce;
    action.loop = loopOnce ? LoopOnce : LoopRepeat;
    action.fadeIn(0.5);
    action.play();

    currentActionRef.current = animationPath;

    // If playing a one-shot animation, return to idle afterwards
    if (loopOnce) {
      const onFinished = () => {
        mixer.removeEventListener('finished', onFinished);
        nextAnimationTimeoutRef.current = setTimeout(() => {
          const defaultAnim = models[modelIndex].defaultAnimation || 'idle';
          playAnimation(getAnimationUrl(defaultAnim), false, modelIndex);
        }, 100);
      };

      mixer.addEventListener('finished', onFinished);
    }
  }, [models]);

  // Handle animation changes coming in from top level
  useEffect(() => {
    if (!animation || !animationFile) return;
    
    console.log('🎮 ThreeScene Animation Update:', { 
      animation,
      animationFile,
      models: models.map(m => ({ 
        agentId: m.agentId, 
        defaultAnimation: m.defaultAnimation ?? 'idle'
      }))
    });
    
    // Process animations for all agents
    Object.entries(animation).forEach(([agentId, currentAnimation]) => {
      // Find the model index for this agent
      const modelIndex = models.findIndex(model => model.agentId === agentId);
      
      console.log('🎯 Processing Agent:', { 
        agentId,
        modelIndex, 
        currentAnimation,
        hasVRM: !!vrmRefs.current[modelIndex],
      });

      if (modelIndex === -1) return;

      const vrm = vrmRefs.current[modelIndex];
      if (!vrm) return;

      if (actionsRefs.current[modelIndex]?.[currentAnimation]) {
        console.log('▶️ Playing Existing Animation:', {
          agentId,
          animation: currentAnimation,
          modelIndex
        });
        playAnimation(currentAnimation, true, modelIndex);
      } else {
        console.log('🔄 Loading New Animation:', {
          agentId,
          animation: currentAnimation,
          modelIndex
        });
        loadMixamoAnimation(getAnimationUrl(currentAnimation), vrm)
          .then(clip => {
            if (mixerRefs.current[modelIndex]) {
              console.log('✅ Animation Loaded Successfully:', {
                agentId,
                animation: currentAnimation,
                modelIndex
              });
              const action = mixerRefs.current[modelIndex].clipAction(clip);
              actionsRefs.current[modelIndex][currentAnimation] = action;
              playAnimation(currentAnimation, true, modelIndex);
            }
          })
          .catch(error => {
            console.error('❌ Animation Load Error:', {
              agentId,
              animation: currentAnimation,
              modelIndex,
              error: error.message
            });
          });
      }
    });
  }, [animation, animationFile, models, playAnimation]);


  // Add a cleanup function to clear models
  const cleanupModels = useCallback(() => {
    // Clear all models
    modelRefs.current.forEach(model => {
      if (model) {
        model.clear();
      }
    });
    modelRefs.current = [];
    vrmRefs.current = [];
    mixerRefs.current = [];
    actionsRefs.current = [];
  }, []);

  // Add loading state
  const [modelsLoaded, setModelsLoaded] = useState<boolean[]>([]);
  const [allModelsLoaded, setAllModelsLoaded] = useState(false);

  // Modify the model loading effect
  useEffect(() => {
    if (!sceneConfig) return;

    // Initialize loading states
    setModelsLoaded(new Array(models.length).fill(false));
    setAllModelsLoaded(false);

    // Cleanup existing models when models array changes
    cleanupModels();

    // Initialize refs for new models
    models.forEach((_, index) => {
      modelRefs.current[index] = new Group();
    });

    // Update positions for new models
    models.forEach((modelConfig, index) => {
      if (modelRefs.current[index]) {
        modelRefs.current[index].position.set(...modelConfig.modelPosition);
        modelRefs.current[index].rotation.set(...modelConfig.modelRotation);
        modelRefs.current[index].scale.set(...modelConfig.modelScale);
      }
    });

    // Load new models
    const loader = new GLTFLoader();
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser, {
        autoUpdateHumanBones: true
      });
    });

    // Load each model in parallel
    const loadPromises = models.map((modelConfig, index) => {
      const modelUrl = getModelUrl(modelConfig.model);
      
      return new Promise((resolve, reject) => {
        loader.load(
          modelUrl,
          async (gltf) => {
            const vrm = gltf.userData.vrm;
            vrmRefs.current[index] = vrm;

            vrm.scene.traverse((obj) => {
              obj.frustumCulled = false;
            });

            VRMUtils.rotateVRM0(vrm);

            // Create a new Group if it doesn't exist
            if (!modelRefs.current[index]) {
              modelRefs.current[index] = new Group();
            }

            // Clear and add the new scene
            modelRefs.current[index].clear();
            modelRefs.current[index].add(vrm.scene);

            // Create animation mixer for this model
            const mixer = new AnimationMixer(vrm.scene);
            mixerRefs.current[index] = mixer;
            actionsRefs.current[index] = {};

            try {
              // Load default animation for this model
              const idleAnimation = getAnimationUrl(modelConfig.defaultAnimation || 'idle');
              const clip = await loadMixamoAnimation(idleAnimation, vrm);
              const action = mixer.clipAction(clip);
              actionsRefs.current[index][idleAnimation] = action;
              
              // Play the idle animation
              action.reset();
              action.loop = LoopRepeat;
              action.fadeIn(0.5);
              action.play();
            } catch (error) {
              console.error(`Error loading idle animation for model ${index}:`, error);
            }

            resolve(vrm);
          },
          undefined,
          reject
        );
      });
    });

    // Wait for all models to load
    Promise.all(loadPromises).catch(error => {
      console.error('Error loading models:', error);
    });

    return () => {
      cleanupModels();
    };
  }, [models, cleanupModels]); // Add models to dependency array to reload when they change

  // Update animation frame
  useFrame(() => {
    const clock = clockRef.current;
    const delta = clock.getDelta();

    // Update mixers
    if (mixerRefs.current) {
      mixerRefs.current.forEach(mixer => {
        if (mixer) {
          mixer.update(delta);
        }
      });
    }

    if (vrmRefs.current) {
      const elapsedTime = clock.elapsedTime;

      // Lip sync logic
      vrmRefs.current.forEach((vrm, index) => {
        if (!vrm || !vrm.expressionManager) return;

        if (audioData.isPlaying) {
          // Map audio amplitude to mouth movement
          const mouthOpen = Math.min(audioData.amplitude * 1.5, 1.0);
          
          // Apply smoothing
          const currentMouthOpen = vrm.expressionManager.getValue('aa') || 0;
          const smoothedMouthOpen = currentMouthOpen * 0.5 + mouthOpen * 0.5;

          // Update mouth expressions
          vrm.expressionManager.setValue('aa', smoothedMouthOpen);
          vrm.expressionManager.setValue('ih', smoothedMouthOpen * 0.5);
          vrm.expressionManager.setValue('ou', smoothedMouthOpen * 0.3);
        } else {
          // Reset mouth when not speaking
          vrm.expressionManager.setValue('aa', 0);
          vrm.expressionManager.setValue('ih', 0);
          vrm.expressionManager.setValue('ou', 0);
        }

        // Blinking logic (existing code)
        const blinkInterval = 5;
        const blinkDuration = 0.2;
        const doubleBlink = Math.floor(elapsedTime / blinkInterval) % 2 === 1;
        const timeSinceLastInterval = elapsedTime % blinkInterval;

        let blinkValue = 0;

        if (timeSinceLastInterval < blinkDuration) {
          blinkValue = Math.cos(Math.PI * timeSinceLastInterval / blinkDuration) * 0.5 + 0.5;
        }

        if (doubleBlink && timeSinceLastInterval > blinkDuration + 0.15 && timeSinceLastInterval < (2 * blinkDuration + 0.15)) {
          blinkValue = Math.cos(Math.PI * (timeSinceLastInterval - blinkDuration - 0.15) / blinkDuration) * 0.5 + 0.5;
        }

        vrm.expressionManager.setValue('blinkLeft', blinkValue);
        vrm.expressionManager.setValue('blinkRight', blinkValue);

        vrm.update(delta);
      });
    }
  });


  console.log({vrmRefs})

  // Add this near your other refs
  const modelPositionsRef = useRef<[number, number, number][]>([]);

  // Initialize the positions ref when models change
  useEffect(() => {
    modelPositionsRef.current = models.map(model => [...model.modelPosition]);
  }, [models]);

  // Add this with your other refs
  const modelRotationsRef = useRef<[number, number, number][]>([]);

  // Initialize the rotations ref when models change
  useEffect(() => {
    modelRotationsRef.current = models.map(model => [...model.modelRotation]);
  }, [models]);

  // Add this helper function at the component level
  const logSceneConfig = () => {
    const currentConfig = {
      id: activeSceneConfig.id,
      name: activeSceneConfig.name,
      environmentURL: environmentUrl,
      models: models.map((model, index) => ({
        ...model,
        modelPosition: modelPositionsRef.current[index] || model.modelPosition,
        modelRotation: modelRotationsRef.current[index] || model.modelRotation,
        modelScale: modelRefs.current[index]?.scale.toArray() || model.modelScale,
      })),
      environmentScale: sceneConfig.environmentScale,
      environmentPosition: sceneConfig.environmentPosition,
      environmentRotation: sceneConfig.environmentRotation,
      cameraPitch,
      cameraPosition,
      cameraRotation,
    };

    console.log("THIS IS THE CURRENT CONFIG", JSON.stringify(currentConfig, null, 2));
  };

  // Update the keyboard handler
  useEffect(() => {
    if (!debugMode) return;
    
    const handleKeyPress = (event: KeyboardEvent) => {
      const moveSpeed = 0.1;
      const rotateSpeed = 0.1;
      const cameraRotateSpeed = Math.PI / 32;

      // Model selection controls
      if (event.key >= '1' && event.key <= '9') {
        const index = parseInt(event.key) - 1;
        if (index < models.length) {
          setSelectedModelIndex(index);
          console.log(`Selected model ${index}`);
        }
        return;
      }

      switch (event.key.toLowerCase()) {
        // Camera rotation
        case 'q':
          setCameraRotation(prev => prev - cameraRotateSpeed);
          break;
        case 'e':
          setCameraRotation(prev => prev + cameraRotateSpeed);
          break;
        case 'r':
          setCameraPitch(prev => Math.max(prev - cameraRotateSpeed, -Math.PI / 3)); // Limit looking up to 60 degrees
          break;
        case 'f':
          setCameraPitch(prev => Math.min(prev + cameraRotateSpeed, Math.PI / 3)); // Limit looking down to 60 degrees
          break;



        // Existing camera movement controls
        case 'w':
          setCameraPosition([
            cameraPosition[0] + Math.sin(cameraRotation) * moveSpeed,
            cameraPosition[1],
            cameraPosition[2] - Math.cos(cameraRotation) * moveSpeed
          ]);
          break;
        case 's':
          setCameraPosition([
            cameraPosition[0] - Math.sin(cameraRotation) * moveSpeed,
            cameraPosition[1],
            cameraPosition[2] + Math.cos(cameraRotation) * moveSpeed
          ]);
          break;
        case 'a':
          setCameraPosition([
            cameraPosition[0] - Math.cos(cameraRotation) * moveSpeed,
            cameraPosition[1],
            cameraPosition[2] - Math.sin(cameraRotation) * moveSpeed
          ]);
          break;
        case 'd':
          setCameraPosition([
            cameraPosition[0] + Math.cos(cameraRotation) * moveSpeed,
            cameraPosition[1],
            cameraPosition[2] + Math.sin(cameraRotation) * moveSpeed
          ]);
          break;
        // New camera Y-axis controls
        case 'z':
          setCameraPosition([
            cameraPosition[0],
            cameraPosition[1] - moveSpeed, // Move down
            cameraPosition[2]
          ]);
          break;
        case 'x':
          setCameraPosition([
            cameraPosition[0],
            cameraPosition[1] + moveSpeed, // Move up
            cameraPosition[2]
          ]);
          break;

        // Model controls - now using selectedModelIndex
        case 'i':
        case 'k':
        case 'j':
        case 'l':
        case 'n':
        case 'm':
          {
            const currentPosition = modelPositionsRef.current[selectedModelIndex] || [0, 0, 0];
            const newPosition = [...currentPosition] as [number, number, number];

            switch (event.key.toLowerCase()) {
              case 'i': newPosition[2] -= moveSpeed; break;
              case 'k': newPosition[2] += moveSpeed; break;
              case 'j': newPosition[0] -= moveSpeed; break;
              case 'l': newPosition[0] += moveSpeed; break;
              case 'n': newPosition[1] -= moveSpeed; break;
              case 'm': newPosition[1] += moveSpeed; break;
            }

            // Update the ref immediately
            modelPositionsRef.current[selectedModelIndex] = newPosition;

            // Update Three.js object
            if (modelRefs.current[selectedModelIndex]) {
              modelRefs.current[selectedModelIndex].position.set(...newPosition);
            }

            // Update scene config
            setSceneConfig(prev => {
              const newModels = [...prev.models];
              newModels[selectedModelIndex] = {
                ...newModels[selectedModelIndex],
                modelPosition: newPosition
              };
              return { ...prev, models: newModels };
            });
          }
          break;
        case 'u':
          {
            const currentRotation = modelRotationsRef.current[selectedModelIndex] || [0, 0, 0];
            const newRotation = [...currentRotation] as [number, number, number];

            newRotation[1] -= rotateSpeed;

            // Update the ref immediately
            modelRotationsRef.current[selectedModelIndex] = newRotation;

            // Update Three.js object
            if (modelRefs.current[selectedModelIndex]) {
              modelRefs.current[selectedModelIndex].rotation.set(...newRotation);
            }

            // Update scene config
            setSceneConfig(prev => {
              const newModels = [...prev.models];
              newModels[selectedModelIndex] = {
                ...newModels[selectedModelIndex],
                modelRotation: newRotation
              };
              return { ...prev, models: newModels };
            });
          }
          break;
        case 'o':
          {
            const currentRotation = modelRotationsRef.current[selectedModelIndex] || [0, 0, 0];
            const newRotation = [...currentRotation] as [number, number, number];

            newRotation[1] += rotateSpeed;

            // Update the ref immediately
            modelRotationsRef.current[selectedModelIndex] = newRotation;

            // Update Three.js object
            if (modelRefs.current[selectedModelIndex]) {
              modelRefs.current[selectedModelIndex].rotation.set(...newRotation);
            }

            // Update scene config
            setSceneConfig(prev => {
              const newModels = [...prev.models];
              newModels[selectedModelIndex] = {
                ...newModels[selectedModelIndex],
                modelRotation: newRotation
              };
              return { ...prev, models: newModels };
            });
          }
          break;
        case ',':
          {
            const newModels = [...models];
            const newScale = newModels[selectedModelIndex].modelScale.map(s => s * 0.9) as [number, number, number];
            newModels[selectedModelIndex] = {
              ...newModels[selectedModelIndex],
              modelScale: newScale
            };
            // Immediately update the model scale
            if (modelRefs.current[selectedModelIndex]) {
              modelRefs.current[selectedModelIndex].scale.set(...newScale);
            }
            setSceneConfig(prev => ({ ...prev, models: newModels }));
          }
          break;
        case '.':
          {
            const newModels = [...models];
            const newScale = newModels[selectedModelIndex].modelScale.map(s => s * 1.1) as [number, number, number];
            newModels[selectedModelIndex] = {
              ...newModels[selectedModelIndex],
              modelScale: newScale
            };
            // Immediately update the model scale
            if (modelRefs.current[selectedModelIndex]) {
              modelRefs.current[selectedModelIndex].scale.set(...newScale);
            }
            setSceneConfig(prev => ({ ...prev, models: newModels }));
          }
          break;
        // Add this case to log config when 'P' is pressed
        case 'p':
          logSceneConfig();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [debugMode, models, selectedModelIndex, cameraPosition, cameraPitch, cameraRotation]);

  useEffect(() => {
    if (activeSceneConfig) {
      setSceneConfig(activeSceneConfig);
      // Update camera settings from the new config
      setCameraPosition(activeSceneConfig.cameraPosition);
      setCameraRotation(activeSceneConfig.cameraRotation);
      setCameraPitch(activeSceneConfig.cameraPitch);
    }
  }, [activeSceneConfig]);

  useEffect(() => {
    if (!sceneConfig?.models) return;
    
    sceneConfig.models.forEach((modelConfig, index) => {
      if (modelRefs.current[index]) {
        // Update position
        modelRefs.current[index].position.set(...modelConfig.modelPosition);
        modelPositionsRef.current[index] = [...modelConfig.modelPosition];
        
        // Update rotation
        modelRefs.current[index].rotation.set(...modelConfig.modelRotation);
        modelRotationsRef.current[index] = [...modelConfig.modelRotation];
        
        // Update scale
        modelRefs.current[index].scale.set(...modelConfig.modelScale);
      }
    });
  }, [sceneConfig]);

  // Add this if you want to log on every change
  useEffect(() => {
    if (debugMode) {
      logSceneConfig();
    }
  }, [sceneConfig, cameraPosition, cameraPitch, cameraRotation, models]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);

  const updateLipSync = useCallback((audioData: AudioData, modelIndex: number) => {
    const vrm = vrmRefs.current[modelIndex];
    if (!vrm || !vrm.expressionManager) return;

    // Get current audio amplitude
    const amplitude = Math.max(...audioData.buffer);
    
    // Configure lip sync parameters
    const lipSyncConfig: LipSyncConfig = {
      threshold: 0.1,
      smoothing: 0.5,
      mouthOpenValue: 1.0
    };

    // Calculate mouth opening based on amplitude
    const mouthOpen = Math.min(
      amplitude * lipSyncConfig.mouthOpenValue, 
      lipSyncConfig.mouthOpenValue
    );

    // Apply smoothing
    const currentMouthOpen = vrm.expressionManager.getValue('aa') || 0;
    const smoothedMouthOpen = currentMouthOpen * lipSyncConfig.smoothing + 
      mouthOpen * (1 - lipSyncConfig.smoothing);

    // Update VRM expressions for mouth movement
    vrm.expressionManager.setValue('aa', smoothedMouthOpen);
    vrm.expressionManager.setValue('ih', smoothedMouthOpen * 0.5);
    vrm.expressionManager.setValue('ou', smoothedMouthOpen * 0.3);
  }, []);

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Float32Array(bufferLength);

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playAudioWithLipSync = useCallback(async (
    audioUrl: string, 
    modelIndex: number
  ) => {
    if (!audioContextRef.current || !analyserRef.current || !dataArrayRef.current) return;

    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      // Start audio playback
      source.start();

      // Update lip sync on each animation frame
      const updateLips = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
        
        updateLipSync({
          buffer: dataArrayRef.current,
          duration: audioBuffer.duration,
          timestamp: audioContextRef.current?.currentTime || 0
        }, modelIndex);

        if (audioContextRef.current?.state === 'running') {
          requestAnimationFrame(updateLips);
        }
      };

      requestAnimationFrame(updateLips);

      // Clean up when audio ends
      source.onended = () => {
        source.disconnect();
        // Reset mouth to closed position
        const vrm = vrmRefs.current[modelIndex];
        if (vrm && vrm.expressionManager) {
          vrm.expressionManager.setValue('aa', 0);
          vrm.expressionManager.setValue('ih', 0);
          vrm.expressionManager.setValue('ou', 0);
        }
      };

    } catch (error) {
      console.error('Error playing audio with lip sync:', error);
    }
  }, [updateLipSync]);

  if (!sceneConfig) return null;

  const modelConfigs = sceneConfig?.models || [];

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={cameraPosition}
        rotation={[cameraPitch, cameraRotation, 0]}
      />
      <CafeEnvironment environmentUrl={environmentUrl} config={sceneConfig} />
      {modelConfigs
        // Add filter to prevent duplicate agentIds
        .filter((model, index, self) => 
          index === self.findIndex(m => m.agentId === model.agentId)
        )
        .map((modelConfig, index) => {
          console.log(`Rendering model ${index}:`, {
            ref: modelRefs.current[index],
            position: modelConfig.modelPosition,
            agentId: modelConfig.agentId
          });
          return (
            <primitive 
              key={`model-${modelConfig.agentId}`} // Change key to use agentId
              object={modelRefs.current[index] || new Group()}
              position={modelConfig.modelPosition}
              rotation={modelConfig.modelRotation}
              scale={modelConfig.modelScale}
            />
          );
        })}

      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 5, 5]}  
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} />

      <Environment
        preset="sunset"
        background={false}
        blur={0.8}
      />

      <mesh
        rotation-x={-Math.PI / 2}
        position-y={-1}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#232323"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </>
  );
}

export default ThreeScene;