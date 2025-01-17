/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TWITCH_BOT_USERNAME: string
    readonly VITE_TWITCH_ACCESS_TOKEN: string
    readonly VITE_TWITCH_CHANNEL: string
    readonly VITE_TWITCH_CLIENT_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}