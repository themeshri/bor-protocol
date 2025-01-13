// @ts-nocheck
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { useRef, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export const useVrm = () => {
  const { current: loader } = useRef(new GLTFLoader())
  const [vrm, setVrm] = useState(null)

  // Register the VRMLoaderPlugin to the GLTFLoader
  loader.register((parser) => new VRMLoaderPlugin(parser))

  const loadVrm = url => {
    loader.load(
      url,
      gltf => {
        // Retrieve the VRM instance from gltf.userData
        const vrm = gltf.userData.vrm
        setVrm(vrm)
      },
      undefined,
      error => console.error('Error loading VRM:', error)
    )
  }

  return { vrm, loadVrm }
}
