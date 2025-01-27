# Bor Protocol

_Powering autonomous AI livestreamer agents_


## Overview
Bor Protocol is a comprehensive platform for creating and managing autonomous AI livestreamer agents on X. The project consists of multiple components working together to deliver an immersive streaming experience, powered by the Eliza AI framework. The system enables AI agents to interact with viewers in real-time through various social platforms while maintaining engaging 3D visual presence.

## System Architecture

### Component Interaction Flow
```
[Viewers] <-> [Chrome Extension] <->[UI chat] <-> [Backend Server] <-> [Eliza/client-borp] <-> [Bor 3D UI]
                                                          ^               ^
                                                          |               |
                                                      [MongoDB]      [PostgreSQL]
```


# AI Capabilities
- 🧠 Advanced AI Model Support
  - Model switching
  - Response optimization
- 🗣️ Voice Generation
  - Real-time synthesis
  - Multiple voices
- 💾 Memory and Context
  - Long-term memory
  - Context management
  - User history tracking
 

    
# Project Components

## 1. Bor UI (Frontend)
A modern web-based application that serves as the visual interface for the AI agent:

#### Core Technologies
- React 18 + TypeScript for robust type-safe development
- Three.js and @react-three/fiber for 3D rendering
- Vite for fast development and optimized builds
- Tailwind CSS for responsive styling

#### Key Features
- Real-time 3D character rendering and animation
- WebGL-powered visual effects
- Integrated chat display and interaction

#### Scene Configuration
- Customizable 3D environments
- Dynamic lighting and camera systems
- Background music and sound effect management

## 2. Chrome Extension
A specialized browser extension for capturing live stream interactions on Twitter: 
There is no API endpoint for video livestreaming on X. That's why we created a special browser plugin to capture the live chat messages.

#### Core Features
- Real-time chat monitoring and filtering
- Message queuing and processing
- Duplicate detection and filtering
- Local storage for offline capability

#### Technical Implementation
- Background service worker for continuous monitoring
- Message transformation and normalization
- WebSocket integration for real-time communication
- Rate limiting and throttling mechanisms

## 3. Backend Server
A Node.js-based backend service orchestrating the entire system:

#### Core Services
- WebSocket server for real-time communication
- RESTful API endpoints for system management
- Stream state management
- User session handling
- Database operations

#### Technical Features
- Horizontal scaling support
- Message queue implementation
- Rate limiting and security measures
- Error handling and logging
- Performance monitoring

#### API Endpoints
```
Stream Management:
GET    /api/streams           # List active streams
POST   /api/streams           # Create new stream
PUT    /api/streams/:id       # Update stream config
DELETE /api/streams/:id       # End stream

User Management:
GET    /api/users/:id         # Get user profile
POST   /api/users             # Create user
PUT    /api/users/:id         # Update user

Interaction Endpoints:
POST   /api/messages          # Send message
GET    /api/messages/:roomId  # Get room messages
POST   /api/reactions         # Send reaction
```

## 4. Eliza AI Framework / client-borp
The core AI engine powering the autonomous agents:
We created our own client in the ELiza framework called bor-client that enables the connection to the 3d UI and the backend server.
The bor-client is responsible for generating:
- Fresh thoughts
- Responding and interacting with chat: Respond with a message and an action (animation)
- Generating periodic animaions for the stream

#### Core Capabilities
- Context-aware response generation
- Memory management and retrieval
- Action system for custom behaviors

#### AI Model Integration
- Multiple model support with fallback
- Context window management
- Response formatting and filtering


## Getting Started

### Prerequisites
- Node.js 23+ (required for modern JavaScript features)
- pnpm (for efficient package management)
- MongoDB 6.0+ (for data persistence)
- Chrome Browser 91+ (for extension)
- Bun 1.0+ (for server-side JavaScript runtime)
- API keys for text generation (openai, anthropic...) + Elevenlabs
- Bunny.net account for media storage
- GPU with CUDA support (optional, for local AI models)

### Detailed Installation

1. Clone the repository:
```bash
git clone https://github.com/themeshri/bor-protocol.git
cd bor-protocol
```

2. Install dependencies for each component:

Frontend (bor_ui):
```bash
cd bor_ui
npm install
```

Backend (bor-server):
```bash
cd server_bor
npm install
```

Eliza Framework:
```bash
cd elizarepo
pnpm install
# Install CUDA support if needed
npx --no node-llama-cpp source download --gpu cuda
```

3. Environment Configuration:
Create and configure `.env` files for each component:

Frontend (.env):
```env
VITE_API_URL=http://localhost:6969
VITE_WS_URL=ws://localhost:6969
```

Backend (.env):
```env
PORT=6969
MONGO_URI=
BUNNY_STORAGE_API_KEY=
BUNNY_STORAGE_HOST=
BUNNY_STORAGE_PATH=
BUNNY_CDN_URL=
```

Eliza (.env):
```env
OPENAI_API_KEY=your_key
ELEVENLABS_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

4. Start the Development Environment:

Frontend:
```bash
cd bor_ui
pnpm run dev
```

Backend:
```bash
cd bor-server
npm run dev  # Uses nodemon for hot reload
```

Eliza:
```bash
cd elizarepo
pnpm build
pnpm start
```

Chrome Extension:
1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `bor-extension` directory
5. Configure extension settings in the popup menu

For more detailed documentation we recommend that you read the README docs of each subfolder (bor-ui, bor-server, bor-extensin and Eliza).



## Configuration

### Character Model & Environment
Modify settings in `bor_ui/src/utils/constants.ts`:
```typescript
export const CHARACTER_CONFIG = {
  model: './models/character.glb',
  scale: 1.0,
  animations: ['Idle', 'Talk', 'Wave'],
  expressions: ['happy', 'neutral', 'thinking']
};

export const ENVIRONMENT_CONFIG = {
  scene: './scenes/studio.glb',
  lighting: 'studio',
  camera: {
    position: [0, 1.6, 2],
    fov: 50
  }
};
```

### Backend Configuration
Configure server settings in `server_bor/.env`:
```env
# Server Configuration
PORT=6969
NODE_ENV=development
LOG_LEVEL=debug

# Database
MONGO_URI=mongodb://localhost:27017/bor
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_secret
API_RATE_LIMIT=100
CORS_ORIGINS=http://localhost:5173

# WebSocket
WS_HEARTBEAT_INTERVAL=30000
WS_TIMEOUT=60000
```

### AI Model Configuration
Configure AI settings in `elizarepo/.env`:
```env

# API Keys
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
ELEVENLABS_API_KEY=your_key

# Voice Generation
ELEVENLABS_VOICE_ID=your_voice_id
VOICE_STABILITY=0.5
VOICE_SIMILARITY=0.75
```

Available AI Models:
- OpenAI (GPT-4, GPT-4-turbo)
  - Best for general conversation
  - High coherence and context understanding
- Anthropic (Claude)
  - Excellent for long-form content
  - Strong reasoning capabilities
- Local Llama (70B or 405B)
  - No API costs
  - Requires GPU for optimal performance
- Grok
  - Real-time data integration
  - Platform-specific knowledge
- Groq
  - Fast inference times
  - Cost-effective for high volume

## Performance Optimization

### Frontend Optimization
- Use of React.memo for component memoization
- Three.js scene optimization
- Asset preloading and caching
- WebGL state management

### Backend Optimization
- Database indexing
- Query optimization
- Connection pooling
- Caching strategies

### AI Response Optimization
- Context window management
- Response streaming
- Batch processing
- Cache frequently used responses

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write unit tests for new features
- Document API changes
- Update relevant README sections

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support, please open an issue in the repository or contact the maintainers directly.

## Acknowledgments

- ElizaOS
- AikoTV
- Three.js community for 3D rendering support
- OpenAI for AI model access
- ElevenLabs for voice generation
