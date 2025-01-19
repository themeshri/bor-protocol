import { PassThrough, Readable } from "stream";
import {
    IAgentRuntime,
    ISpeechService,
    ServiceType,
} from "@ai16z/eliza/src/types.ts";
import { getWavHeader } from "./audioUtils.ts";
import { synthesize } from "../vendor/vits.ts";
import { Service } from "@ai16z/eliza/src/types.ts";
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as https from 'https';

function prependWavHeader(
    readable: Readable,
    audioLength: number,
    sampleRate: number,
    channelCount: number = 1,
    bitsPerSample: number = 16
): Readable {
    const wavHeader = getWavHeader(
        audioLength,
        sampleRate,
        channelCount,
        bitsPerSample
    );
    let pushedHeader = false;
    const passThrough = new PassThrough();
    
    readable.on("data", function (data) {
        if (!pushedHeader) {
            passThrough.push(wavHeader);
            pushedHeader = true;
        }
        passThrough.push(data);
    });
    
    readable.on("end", function () {
        passThrough.end();
    });
    
    return passThrough;
}

async function playHTTextToSpeech(runtime: IAgentRuntime,text: string): Promise<Readable> {
    console.log("PlayHT TTS:", text);
    
    const options = {
        method: 'POST',
        hostname: 'api.play.ht',
        path: '/api/v2/tts/stream',
        headers: {
            'accept': 'audio/mpeg',
            'content-type': 'application/json',
            'AUTHORIZATION': process.env.PLAYHT_API_KEY,  // Use environment variables instead of hardcoded values
            'X-USER-ID': process.env.PLAYHT_USER_ID
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                // Read error response body for better error handling
                let errorData = '';
                res.on('data', chunk => errorData += chunk);
                res.on('end', () => {
                    reject(new Error(`PlayHT API request failed with status ${res.statusCode}: ${errorData}`));
                });
                return;
            }

            const passThrough = new PassThrough();
            
            // Add data event logging to debug stream content
            let dataReceived = false;
            res.on('data', (chunk) => {
                dataReceived = true;
                console.log(`Received chunk of size: ${chunk.length} bytes`);
            });

            res.pipe(passThrough);

            res.on('end', () => {
                if (!dataReceived) {
                    reject(new Error('No audio data received from PlayHT API'));
                }
                console.log('Stream ended');
            });

            res.on('error', (error) => {
                passThrough.destroy(error);
                reject(error);
            });

            resolve(passThrough);
        });

        req.on('error', (error) => {
            reject(error);
        });

        const requestBody = {
            text: text,
            
            voice: 's3://voice-cloning-zero-shot/952aed5d-9b38-4a58-a867-08c448af36b5/original/manifest.json',
            output_format: 'mp3',
            voice_engine: 'PlayDialog',
            quality: 'premium'  // Added quality parameter
        };

        req.write(JSON.stringify(requestBody));
        req.end();
    });
}
/*
async function playHTTextToSpeech(runtime: IAgentRuntime, text: string): Promise<Readable> {
    console.log("PlayHT TTS:", text);
    
    const options = {
        method: 'POST',
        hostname: 'api.play.ht',
        path: '/api/v2/tts/stream',
        headers: {
            'accept': 'audio/mpeg',
            'content-type': 'application/json',
            'AUTHORIZATION': runtime.getSetting("PLAYHT_API_KEY") || '58e7fce59457420fbe35a85996f5b2cb',
            'X-USER-ID': runtime.getSetting("PLAYHT_USER_ID") || 's8tJVSr2JcQ1ju7rc1rbBRlUOvV2'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`PlayHT API request failed with status ${res.statusCode}`));
                return;
            }

            // Create a readable stream from the response
            const readable = new Readable({
                read() {}
            });

            res.on('data', (chunk) => {
                readable.push(chunk);
            });

            res.on('end', () => {
                readable.push(null);
            });

            res.on('error', (error) => {
                readable.destroy(error);
                reject(error);
            });

            resolve(readable);
        });

        req.on('error', (error) => {
            reject(error);
        });

        const requestBody = {
            text: text,
            voice: runtime.getSetting("PLAYHT_VOICE_ID") || 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json',
            output_format: 'mp3',
            voice_engine: 'PlayDialog'
        };

        req.write(JSON.stringify(requestBody));
        req.end();
    });
}*/

async function vitsTextToSpeech(runtime: IAgentRuntime, text: string): Promise<Readable> {
    console.log("VITS TTS:", text);
    
    try {
        const { audio } = await synthesize(text, {
            engine: "vits",
            voice: "aEO01A4wXwd1O8GPgGlF",
        });

        if (audio instanceof Buffer) {
            console.log("Audio is a buffer");
            return Readable.from(audio);
        } 
        
        if ("audioChannels" in audio && "sampleRate" in audio) {
            console.log("Audio is RawAudio");
            const floatBuffer = Buffer.from(audio.audioChannels[0].buffer);
            console.log("Buffer length:", floatBuffer.length);

            const sampleRate = audio.sampleRate;
            const floatArray = new Float32Array(floatBuffer.buffer);

            // Convert 32-bit float audio to 16-bit PCM
            const pcmBuffer = new Int16Array(floatArray.length);
            for (let i = 0; i < floatArray.length; i++) {
                pcmBuffer[i] = Math.round(floatArray[i] * 32767);
            }

            // Prepend WAV header
            const wavHeaderBuffer = getWavHeader(
                pcmBuffer.length * 2,
                sampleRate,
                1,
                16
            );
            const wavBuffer = Buffer.concat([
                wavHeaderBuffer,
                Buffer.from(pcmBuffer.buffer),
            ]);

            return Readable.from(wavBuffer);
        }

        throw new Error("Unsupported audio format");
    } catch (error) {
        console.error('Error generating audio with VITS:', error);
        throw error;
    }
}

export class SpeechService extends Service implements ISpeechService {
    static serviceType: ServiceType = ServiceType.SPEECH_GENERATION;
    
    async generate(runtime: IAgentRuntime, text: string): Promise<Readable> {
        let audioStream: Readable;
        
        try {
            // Try PlayHT first if credentials are available
            if (runtime.getSetting("PLAYHT_API_KEY") && runtime.getSetting("PLAYHT_USER_ID")) {
              return   await playHTTextToSpeech( runtime,text);
            } else {
                // Fallback to VITS
              return await vitsTextToSpeech(runtime, text);
            }
            /*

            // Create a PassThrough stream to duplicate the audio data
            const passThrough = new PassThrough();
            audioStream.pipe(passThrough);

            // Save to file while also returning the stream
            const fileStream = createWriteStream('output.mp3');
            console.log('Saving audio file to:', process.cwd() + '/output.mp3');
            
            pipeline(audioStream, fileStream).catch(err => {
                console.error('Error saving audio file:', err);
            });

            return passThrough;*/
        } catch (error) {
            console.error('Error in speech generation:', error);
            throw error;
        }
    }
}