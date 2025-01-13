# Bor Protocol UI

Bor_ui is a modern web-based application designed to deliver immersive 3D experiences and connect chat functionalities. Built with Vite, React, and Three.js, it provides a platform for interactive 3D streaming and social features.

## Project Structure

The project includes several essential components and contexts:

- **ThreeScene.tsx**: Core component for rendering 3D scenes using @react-three/fiber
- **SceneWrapper.tsx**: Wrapper component for managing scene layouts and transitions
- **constants.ts**: Configuration for BGM, scenes, and environment settings
- **SceneEngineContext.tsx**: Context provider for scene rendering logic
- **ScenesContext.tsx**: Manages multiple scenes and their states

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **3D Libraries**: Three.js, @react-three/fiber, @react-three/drei
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Web3**: Solana Web3.js

## Getting Started

### Prerequisites
- Node.js
- npm or yarn
- Bun (for server)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/bor_ui.git
   ```

2. Install dependencies:
   ```bash
   cd bor_ui
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Visit `http://localhost:5173` to view the application.

### Development Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint
- `npm run server`: Start Bun server

### Changing character model, bg music or the environmnt and camera angle.

change directly in the file 
bor_ui/src/utils/constants.ts


## Contributing

We welcome contributions to improve Bor_ui. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. See the LICENSE file for details.