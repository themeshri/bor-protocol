export const SOCKET_URL = 'ws://localhost:6969'
export const API_URL = 'http://localhost:6969'

export const BORP_AGENT_ID = ""

export const SOCKET_EVENTS = {
   CONNECTION: 'connection',
   DISCONNECT: 'disconnect',
   NEW_COMMENT: 'new comment',
   CONNECTED: 'connected'
} as const;

export const STREAMER_ADDRESS = 'mdx5dxD754H8uGrz6Wc96tZfFjPqSgBvqUDbKycpump'; // Default address


export interface Gift {
 id: string;
 name: string;
 coins: number;
 icon: string;
}


interface Model {
 model: string; // model file name -- must be a vrm file located in the public/models folder
 name: string; // model name -- unused
 description: string; // model description -- unused
 agentId: string; // needed to set up animation/aiReply/audio handlers per model, coming in from the server
 clothes: string; // unused
 defaultAnimation: string; // animation to play when the model is loaded
 modelPosition: [number, number, number]; // position of the model in the scene
 modelRotation: [number, number, number]; // rotation of the model in the scene
 modelScale: [number, number, number]; // scale of the model in the scene 
}

export interface SceneConfig {
 name: string; // scene name -- unused
 description: string; // scene description -- unused
 environmentURL: string; // environment file name -- must be a glb file located in the public/environments folder

 // Camera settings
 cameraPosition: [number, number, number]; // camera position in the scene
 cameraRotation: number; // camera rotation in the scene
 cameraPitch: number; // camera pitch in the scene

 // Environment settings
 environmentScale: [number, number, number]; // scale of the environment in the scene
 environmentPosition: [number, number, number]; // position of the environment in the scene
 environmentRotation: [number, number, number]; // rotation of the environment in the scene

 // Array of models instead of single model config
 models: Model[];
}

// Extend your existing NewStreamConfig interface
export interface NewStreamConfig {
 id: number;
 title: string;
 agentId: string;
 twitter: string;
 modelName: string;
 description: string;
 identifier: string;
 color: string;
 type: string;
 component: string;
 bgm?: string | string[]; 
 creator: {
   avatar: string;
   title: string;
   username: string;
 };
 sceneConfigs: (SceneConfig)[];  
}

// Add BGM URL constants
export const BGM_URLS = {
   BORP: {
       CAFE: '/audio/musicbg.mp3',
       DEFAULT: '/audio/musicbg.mp3'
   },
} as const;


export const NEW_STREAM_CONFIGS: NewStreamConfig[] = [
 {
   id: 0,
   title: "Trump stream",
   agentId: "795df77f-1620-07db-bd9a-0e2dfefef248",
   twitter: "@bor_live",
   modelName: "Trump",
   identifier: "Trump",
   description: "My first stream!",
   color: "#FE2C55",
   type: "stream",
   component: "ThreeScene",
   creator: { avatar: "/images/borp.webp", title: "Just hanging out", username: "Borp" },
   bgm: BGM_URLS.BORP.DEFAULT,
   sceneConfigs: [
     {
       "id": 0,
       "name": "Cafe",
       "environmentURL": "tt.glb",
       "models": [
        //  {
        //   "model": "Clown doll A.vrm",
        //   "agentId": "a9f3105f-7b14-09bd-919f-a1482637a374",       // model's need to store the agentId for now. this is because of the way animations are triggered via SceneEngine into ThreeScene by the model's agentId
        //    "name": "Borp",
        //    "description": "Borp",
        //    "clothes": "casual",
        //    "defaultAnimation": "offensive_idle",
        //    "modelPosition": [
        //      1.0999999999999999,
        //      -0.4999999999999999,
        //      -7.3000000000000185
        //    ],
        //    "modelRotation": [
        //      0,
        //      2.1000000000000005,
        //      0
        //    ],
        //    "modelScale": [
        //      0.9605960100000004,
        //      0.9605960100000004,
        //      0.9605960100000004
        //    ]
        //  },
         {
           "model": "tromp.vrm",
           "name": "Bor",
           "agentId": "795df77f-1620-07db-bd9a-0e2dfefef248",
           "description": "Bor",
           "clothes": "casual",
           "defaultAnimation": "idlet",
           "modelPosition": [
             1.51,
             -0.4999999999999999,
             -7.650000000000005
           ],
           "modelRotation": [
             0,
             7.799999999999988,
             0
           ],
           "modelScale": [
             0.9605960100000004,
             0.9605960100000004,
             0.9605960100000004
           ]
         }
       ],
       "environmentScale": [
         1,
         1,
         1
       ],
       "environmentPosition": [
         3, //depth
         -1, //up was -1
         -3.5 // lef right
       ],
       "environmentRotation": [
         0,
         1.5707963267948966,
         0
       ],
       "cameraPitch": 0,
       "cameraPosition": [
         2.86339364354024,
         0.75999999999999,
         -7.734076601144114
       ],
       "cameraRotation": -4.708758241001718
     },

   ],
   stats: {
     likes: 0,
     comments: 0,
     bookmarks: 0,
     shares: 0
   },
 },
]


// SCENES
export const ANIMATIONS_BASE_URL = '/animations';
export const ENVIRONMENTS_BASE_URL = '/environments';
export const MODELS_BASE_URL = '/models';

// should just be key of ANIMATION_MAP
export const getAnimationUrl = (animation: keyof typeof ANIMATION_MAP) => {
   const animationFile = ANIMATION_MAP[animation];
   const animationUrl = `${ANIMATIONS_BASE_URL}/${animationFile}`;
   console.log('🎬 Getting Animation URL:', {
       animation,
       animationFile,
       fullUrl: animationUrl
   });
   return animationUrl;
};
export const getEnvironmentUrl = (environment: string) => {
   return `${ENVIRONMENTS_BASE_URL}/${environment}`;
}
export const getModelUrl = (model: string) => `${MODELS_BASE_URL}/${model}`;



export const ANIMATION_MAP: { [key: string]: string } = {
  "pointing": "Pointing.fbx",
  "light_dance": "light_dance.fbx",
  "hands_up": "hands_up.fbx",
  "trump_dance": "trump_dance.fbx",
  "listening_to_music": "Listening_To_Music.fbx",
  "play_golf": "play_golf.fbx",
  "cheering": "cheering.fbx",
  "fist_up": "fist_up.fbx",
   "acknowledging": "acknowledging.fbx",
   "angry_gesture": "angry_gesture.fbx",
   "annoyed_head_shake": "annoyed_head_shake.fbx",
   "appearing": "appearing.fbx",
   "being_cocky": "being_cocky.fbx",
  //  "blow_a_kiss": "blow_a_kiss.fbx",
   "got_assasinated": "brutal_assassination.fbx",
  //  "dancing_twerk": "dancing_twerk.fbx",
   "hip_hop_dancing": "hip_hop_dancing.fbx",
   "floating": "idle/floating.fbx",
   "capoeira": ".fbx",
   "dismissing_gesture": "dismissing_gesture.fbx",
  //  "happy_hand_gesture": "happy_hand_gesture.fbx",
   "hard_head_nod": "hard_head_nod.fbx",
   "head_nod_yes": "head_nod_yes.fbx",
   "idle": "idle-2.fbx",
   "idlet": "idlet.fbx",
   "idle-2": "idle-2.fbx",
   "idle_basic": "idle.fbx",
   "weight_shift": "weight_shift.fbx",
   "idle_dwarf": "idle/idle_dwarf.fbx",
  //  "joyful_jump": "joyful_jump.fbx",
   "laughing": "laughing.fbx",
   "lengthy_head_nod": "lengthy_head_nod.fbx",
   "look_away_gesture": "look_away_gesture.fbx",
   "offensive_idle": "offensive_idle.fbx",
   "relieved_sigh": "relieved_sigh.fbx",
   "rumba_dancing": "rumba_dancing.fbx",
   "sarcastic_head_nod": "sarcastic_head_nod.fbx",
   "shaking_head_no": "shaking_head_no.fbx",
   "silly_dancing": "silly_dancing.fbx",
   "sitting_disbelief": "sitting_disbelief.fbx",
   "sitting_legs_swinging": "sitting_legs_swinging.fbx",
   "sitting_yell": "sitting_yell.fbx",
   "sitting": "sitting.fbx",
   "standing_clap": "standing_clap.fbx",
   "thoughtful_head_shake": "thoughtful_head_shake.fbx",
   "walk_with_rifle": "walk_with_rifle.fbx",
  //  "belly_dance": "dance/belly_dance.fbx",
  //  "maraschino": "dance/maraschino.fbx",
   "defeated": "defeated.fbx",
   "praying": "praying.fbx",
   "hiphop_dancing": "hiphop_dancing.fbx",
   "angry": "angry.fbx",
   "happy_idle": "happy_idle.fbx",
   "robot_dance": "robot_dance.fbx",
   "bboy_hiphopmove": "bboy_hiphopmove.fbx",
   "swing_dancing": "swing_dancing.fbx",
   "nervously_look_around": "nervously_look_around.fbx",
   "arm_stretching": "arm_stretching.fbx",
   "salute": "salute.fbx",
   "excited": "excited.fbx",
   "greeting": "greeting.fbx",
   "arguing": "arguing.fbx",
   "chicken_dance": "chicken_dance.fbx",
   "youre_loser": "youre_loser.fbx",
   "look_around": "look_around.fbx",
   "saying_no": "saying_no.fbx",
   "shaking_hands": "shaking_hands.fbx",
   "insulting": "insulting.fbx",
   "threatening": "threatening.fbx",
   "happy": "happy.fbx",
   "are_you_crazy": "are_you_crazy.fbx",
   "focusing": "focusing.fbx",
   "speedbag_boxing": "speedbag_boxing.fbx",



};


const MESSAGE_TIMEOUTS = {
   "small": 3000,    // For messages < 50 chars
   "medium": 8000,  // For messages 50-150 chars
   "large": 12000    // For messages > 150 chars
}

export const getMessageTimeout = (text: string): number => {
   const charCount = text.length;
   if (charCount < 100) return MESSAGE_TIMEOUTS.small;
   if (charCount <= 200) return MESSAGE_TIMEOUTS.medium;
   return MESSAGE_TIMEOUTS.large;
}


// Used for the gift modal and any other quick lookups
// Should be replaced with DB
export const AGENT_MAP: { [agentId: string]: { name: string } } = {
  "a9f3105f-7b14-09bd-919f-a1482637a374": {
      name: "Borp",
  },
   
}

