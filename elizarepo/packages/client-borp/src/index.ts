import {
    Client,
    Content,
    IAgentRuntime,
    Memory,
    ModelClass,
    ServiceType,
    State,
    UUID
} from "@ai16z/eliza/src/types.ts";
import { stringToUuid } from "@ai16z/eliza/src/uuid.ts";
import { fetchRoomMessages, fetchTopLikers, fetchUnreadComments, getRandomTopLiker, IComment, markCommentsAsRead, postRoomMessage } from './db/index.ts';
import { composeContext, embeddingZeroVector } from "@ai16z/eliza";
import { generateMessageResponse, generateText } from "@ai16z/eliza/src/index.ts";
import https from 'https';
import { parseJSONObjectFromText } from "@ai16z/eliza/src/parsing.ts";
import {
    borpAnimationTemplate,
    borpMessageAnimationTemplate,
    borpMessageHandlerTemplate,
    borpSelectCommentTemplate,
} from "./templates.ts";
import { Readable } from 'stream';
import axios from 'axios';

import { ANIMATION_OPTIONS, SERVER_ENDPOINTS, SERVER_URL, getAllAnimations } from "./constants.ts";
import { AIResponse, StreamingStatusUpdate, TaskPriority } from "./types.ts";

const api_key = process.env.BORP_API_KEY;

export class BorpClient {
    interval: NodeJS.Timeout;

    intervalTopLikers: NodeJS.Timeout;
    intervalTotalLikes: NodeJS.Timeout;
    runtime: IAgentRuntime;

    roomId: UUID;

    private taskQueue: TaskPriority[] = [
 
        {
            name: 'readChatAndReply',
            priority: 1,
            minInterval: 1000 * 20
        },
        {
            name: 'generateFreshThought',
            priority: 3,
            minInterval: 1000 * 60 * 1
        },
        {
            name: 'generatePeriodicAnimation',
            priority: 2,
            minInterval: 1000 * 20
        },
    ];

    private taskInterval: NodeJS.Timeout;
    private lastProcessedTimestamp: Date | undefined;
    private lastAgentChatMessageId: string | null = null;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        this.roomId = stringToUuid(`borp-stream-${this.runtime.agentId}`);
        this.lastProcessedTimestamp = new Date();

        console.log("borp: constructor", {
            runtime: this.runtime,
            settings: this.runtime.character.settings,
            vrm: this.runtime.character.settings?.secrets?.vrm,
            avatar: this.runtime.character.settings?.secrets?.avatar,
            lastProcessedTimestamp: this.lastProcessedTimestamp
        });

        // Start the task scheduler
        this.taskInterval = setInterval(() => {
            this.processNextTask();
        }, 1000); // Check for new tasks every second
    }

    /**
     * Processes the next available task in the task queue based on priority and timing
     * Tasks are executed sequentially to avoid conflicts and maintain system stability
     */
    private async processNextTask() {
        // Get current timestamp to check task eligibility
        const now = Date.now();

        // Find the highest priority task that:
        // 1. Isn't currently running
        // 2. Has waited long enough since its last run (minInterval)
        const eligibleTask = this.taskQueue.find(task => {
            const timeElapsed = now - (task.lastRun || 0);
            return !task.isRunning && timeElapsed >= task.minInterval;
            //return task;
        });

        // Exit if no tasks are eligible to run
        if (!eligibleTask) return;

        // Set task status to running to prevent concurrent execution
        eligibleTask.isRunning = true;

        try {
            // Execute the appropriate task based on task name
            // Each task handles a different aspect of the AI's behavior:
            // - readChatAndReply: Monitor chat and generate responses
            // - generateFreshThought: Create unprompted messages
            // - generatePeriodicAnimation: Update AI's animation state
            // - heartbeat: Maintain connection status
            switch (eligibleTask.name) {
             
                case 'readChatAndReply':
                    await this.readChatAndReply();
                    break;

                case 'generateFreshThought':
                    await this.generateAndShareFreshThought();
                    break;

                case 'generatePeriodicAnimation':
                    await this.generateAndSharePeriodicAnimation();
                    break;

            }
        } catch (error) {
            // Log any errors that occur during task execution
            console.error(`Error executing task ${eligibleTask.name}:`, error);
        } finally {
            // Clean up task state regardless of success/failure:
            // - Update the last run timestamp
            // - Reset the running flag to allow future execution
            eligibleTask.lastRun = Date.now();
            eligibleTask.isRunning = false;
        }
    }

    async heartbeat() {
        await this.updateStreamingStatus({
            isStreaming: true,
        });
        }
    // Chat & Message Processing

    async readChatAndReply() {
        try {
            // Read Comments since last processed timestamp
            console.log(`[${new Date().toLocaleString()}] Borp (${this.runtime.character.name}): Reading chat since`,
                this.lastProcessedTimestamp?.toISOString());

            const { comments } = await fetchUnreadComments(
                this.runtime.agentId,
                this.lastProcessedTimestamp
            );

            if (comments && comments.length > 0) {
                // Process each comment and store it as a memory
                const processedComments = await this.processComments(comments);
                console.log("borp: processedComments", {
                    count: processedComments?.length,
                    lastProcessedTimestamp: this.lastProcessedTimestamp?.toISOString()
                });
            }

            // Update the timestamp to current time after processing
            this.lastProcessedTimestamp = new Date();

        } catch (error) {
            console.error("Error in readChatAndReply:", error);
        }
    }

    async processComments(comments: IComment[]) {
        console.log(comments);
        const commentIds = comments?.map(comment => comment.id) ?? [];

        if (commentIds.length === 0) {
            console.log(`borp (${this.runtime.character.name}): No comments to process`);
            return commentIds;
        }

        // Mark all comments as read
        try {
            await markCommentsAsRead(commentIds);
        } catch (error) {
            console.error("borp: Failed to mark comments as read", { error });
        }

        // Create memories for all comments
        let memoriesCreated = 0;
        await Promise.allSettled(comments.map(async comment => {
            const memory: Memory = {
                id: stringToUuid(`${comment.id}-${this.runtime.agentId}`),
                ...userMessage,
                userId: userIdUUID,
                agentId: this.runtime.agentId,
                roomId: this.roomId,
                content,
                createdAt: comment.createdAt.getTime(),
                embedding: embeddingZeroVector,
            }
            // Create a memory for this comment
            if (content.text) {
                await this.runtime.messageManager.createMemory(memory);
                memoriesCreated++;
            }
        }));

        // If there's only one comment, select it automatically
        let selectedCommentId;
        if (comments.length === 1) {
            selectedCommentId = comments[0].id;
        } else {
            // Otherwise, use the selection logic for multiple comments
            selectedCommentId = await this.selectCommentToRespondTo(comments);
        }

        if (!selectedCommentId) {
            console.log("No suitable comment found to respond to");
            return comments;
        }

        // Find the selected comment
        const selectedComment = comments.find(comment => comment.id === selectedCommentId);
        if (!selectedComment) {
            console.error("Selected comment not found:", selectedCommentId);
            return comments;
        }

        const userIdUUID = stringToUuid(selectedComment.handle);

        // Add this new section to create first interaction memory
        try {
            console.log("Fetching existing memories with params:", {
                roomId: this.roomId,
                agentId: this.runtime.agentId,
                userId: userIdUUID,
                userIdStr: userIdUUID.toString() // Log string representation
            });

            const existingMemories = await this.runtime.messageManager.getMemories({
                roomId: this.roomId,
                agentId: this.runtime.agentId,
                userId: userIdUUID
            });

            console.log("Existing memories result:", {
                found: !!existingMemories,
                count: existingMemories?.length,
                firstMemory: existingMemories?.[0]
            });

            if (selectedComment.message!==undefined && (existingMemories === undefined || existingMemories.length === 0)) {
                // This is the first interaction - create a special memory
                const firstInteractionMemory: Memory = {
                    id: stringToUuid(`first-interaction-${selectedComment.handle}-${this.runtime.agentId}`),
                    userId: userIdUUID,
                    agentId: this.runtime.agentId,
                    roomId: this.roomId,
                    unique: true,
                    content: {
                        text: `My name is ${selectedComment.handle}`,
                        source: "borp",
                        metadata: {
                            isFirstInteraction: true,
                            username: selectedComment.handle,
                            handle: selectedComment.handle,
                            timestamp: new Date().toISOString()
                        }
                    },
                    createdAt: Date.now(),
                    embedding: embeddingZeroVector,
                };

                try {
                    await this.runtime.messageManager.createMemory(firstInteractionMemory);
                    console.log("Successfully created first interaction memory:", {
                        handle: selectedComment.handle,
                        memoryId: firstInteractionMemory.id
                    });
                } catch (createError) {
                    console.error("Error creating first interaction memory:", {
                        error: createError,
                        memory: firstInteractionMemory
                    });
                }
            }
        } catch (error) {
            console.error("Error checking/creating first interaction memory:", {
                error,
                userIdUUID,
                roomId: this.roomId,
                agentId: this.runtime.agentId
            });
        }

        // Process only the selected comment for response
        const content: Content = {
            text: selectedComment.message,
            source: "borp",
        };

        await this.runtime.ensureConnection(
            userIdUUID,
            this.roomId,
            selectedComment.handle,
            selectedComment.handle,
            "borp"
        );

        const userMessage = {
            content,
            userId: userIdUUID,
            agentId: this.runtime.agentId,
            roomId: this.roomId,
        };

        console.log(`borp (${this.runtime.character.name}): selectedComment`, { selectedComment });

        // Get created date
        const createdAt = typeof selectedComment.createdAt === 'string' ?
            new Date(selectedComment.createdAt).getTime() :
            0;

        // Create memory for the selected comment
        const memory: Memory = {
            id: stringToUuid(`${selectedComment.id}-${this.runtime.agentId}`),
            ...userMessage,
            userId: userIdUUID,
            agentId: this.runtime.agentId,
            roomId: this.roomId,
            content,
            createdAt,
            embedding: embeddingZeroVector,
        }

        if (content.text) {
            await this.runtime.messageManager.createMemory(memory);
            console.log(`borp ${this.runtime.agentId}: memory created`, { memory });
        }

        // Compose state and check if should respond
        const state = (await this.runtime.composeState(userMessage, {
            agentName: this.runtime.character.name,
            selectedComment,
            animationOptions: getAllAnimations().join(", "),
        })) as State;


        // if there is a selected comment, should respond is true
        let shouldRespond = true;
        if (!selectedComment) {
            shouldRespond = false;
        }

        console.log(`borp ${this.runtime.agentId}: shouldRespond`, { shouldRespond, selectedCommentId });

        if (shouldRespond) {
            const context = composeContext({
                state,
                template: borpMessageHandlerTemplate,
            });

            const responseContent = await this._generateResponse(memory, state, context);
            responseContent.text = responseContent.text?.trim();

            const responseMessage = {
                ...userMessage,
                userId: this.runtime.agentId,
                content: responseContent,
            };
           
            await this.runtime.messageManager.createMemory(responseMessage);
            console.log(`borp ${this.runtime.agentId}: reply memory created`, { responseMessage });
        


                 // Generate and post animation
            const _borpAnimationTemplate = borpMessageAnimationTemplate({
                agentName: this.runtime.character.name,
                lastMessage: responseContent.text,
                animationOptions: getAllAnimations().join(", "),
            });

        // console.log(`Generated template animation: ${_borpAnimationTemplate}`);
        // return _borpAnimationTemplate;
        
            const animationResponse = await generateText({
                runtime: this.runtime,
                context: _borpAnimationTemplate,
                modelClass: ModelClass.SMALL,
            });

            const animationBody = {
                agentId: this.runtime.agentId,
                animation: animationResponse,
            }


            // Generate and post speech
           let speechUrl;
            try {
                speechUrl = await this.generateSpeech(responseContent.text);
            } catch (error) {
                console.error(`borp ${this.runtime.agentId}: Failed to generate speech`, { error });
            }
            // Post response
            const body: AIResponse = {
                // Required fields
                id: stringToUuid(`${this.runtime.agentId}-${Date.now()}`),
                text: responseContent.text,
                agentId: this.runtime.agentId,

                // Reply fields
                replyToMessageId: selectedComment.id,
                replyToMessage: selectedComment.message,
                replyToUser: selectedComment.user,
                replyToHandle: selectedComment.handle,
                replyToPfp: selectedComment.avatar,

                isGiftResponse: false,
                giftName: null,
                audioUrl: speechUrl,
                animation: animationResponse,

                // Include any additional fields from responseContent
                ...(responseContent as Omit<typeof responseContent, 'text'>),
            };

            console.log(`borp ${this.runtime.agentId}: body`, { body });


            const fetchResponse = await fetch(SERVER_ENDPOINTS.POST.AI_RESPONSES, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'api_key': api_key
                },
                body: JSON.stringify(body),
            });


            if (fetchResponse.status !== 200) {
                console.error(`borp ${this.runtime.agentId}: Failed to post response to api`, { fetchResponse });
            } else {
                console.log(`borp ${this.runtime.agentId}: CHAT REPLY: Posted message response to api`, { responseContent, body });
            }
        }

        return commentIds;
    }

    async selectCommentToRespondTo(comments: IComment[]) {
        if (comments.length === 0) {
            return null;
        }

        // Format the recent messages with ID first for easier parsing
        const recentMessages = comments
            .map(comment => `ID: ${comment.id}
                From: ${comment.user}
                Message: ${comment.message}
                ---`)
            .join('\n\n');


        // TODO: This is a bit of a hack to get the state to work
        const memory: Memory = {
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId,
            content: { text: '', source: "borp" },
            roomId: this.roomId,
        }

        const state = await this.runtime.composeState(memory, {
            agentName: this.runtime.character.name,
            recentMessages
        });

        const selectContext = composeContext({
            state,
            template: borpSelectCommentTemplate,
        });

        const selectedCommentId = await generateText({
            runtime: this.runtime,
            context: selectContext,
            modelClass: ModelClass.MEDIUM
        });

        console.log("borp: selectedCommentId", { selectedCommentId });

        return selectedCommentId === "NONE" ? null : selectedCommentId;
    }
    private async _generateResponse(
        message: Memory,
        state: State,
        context: string
    ): Promise<Content> {
        const { userId, roomId } = message;


        const response = await generateMessageResponse({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.MEDIUM,
        });

        if (!response) {
            console.error("No response from generateMessageResponse");
            return;
        }

        await this.runtime.databaseAdapter.log({
            body: { message, context, response },
            userId: userId,
            roomId,
            type: "response",
        });

        return response;
    }
    async generateSpeech(text: string): Promise<string> {
        // console.log("borp: generateSpeech", { text });
        const agentName = this.runtime.character.name;
        console.log(`borp (${agentName}): starting speech generation for text:`, { text });
    
        // Get speech service and generate audio
        const SpeechService = await this.runtime.getService(ServiceType.SPEECH_GENERATION) as any;
        const speechService = SpeechService.getInstance();
        const audioStream = await speechService.generate(this.runtime, text);
    
        // Convert the audio stream to a buffer
        const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Uint8Array[] = [];
            audioStream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
            audioStream.on('end', () => resolve(Buffer.concat(chunks)));
            audioStream.on('error', reject);
        });
    
        // Generate filename
        const timestamp = Date.now();
        const fileName = `${this.runtime.agentId}-${timestamp}.mp3`;
    
        try {
            const response = await axios.post(`${SERVER_URL}/api/upload/audio`, audioBuffer, {
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                    'isAudioStream': 'true'
                },
                maxBodyLength: Infinity,  // Allow large files
                maxContentLength: Infinity,
            });
    
            const publicUrl = response.data.url;
            console.log(`borp (${agentName}): upload successful`, { publicUrl });
            return publicUrl;
        } catch (error) {
            console.error(`borp (${agentName}): error sending audio to server`, error);
            throw new Error("Failed to upload audio");
        }
    }




    private async _makeApiCall(endpoint: string, method: string, body?: any) {
        try {
            const response = await fetch(`${SERVER_URL}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${api_key}`,
                    'api_key': api_key
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error(`borp ${this.runtime.agentId}: API call failed`, { endpoint, error });
            return { success: false, error };
        }
    }

    async updateStreamingStatus(update: Partial<StreamingStatusUpdate>) {
        const sceneConfigs = this.runtime.character.settings?.secrets?.borpSceneConfigs
        const streamSettings = this.runtime.character.settings?.secrets?.borpSettings

        try {
            // Merge default values with provided updates
            const statusUpdate = {
                // Default values
                isStreaming: true,
                lastHeartbeat: new Date(),
                title: `${this.runtime.character.name}'s Stream`,
                description: "Interactive AI Stream",
                type: 'stream',
                component: 'ThreeScene',
                twitter: this.runtime.character.settings?.secrets?.twitterUsername || this.runtime.getSetting("TWITTER_USERNAME"),
                modelName: this.runtime.character.name,
                identifier: this.runtime.character.name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_'),

                // Include any provided updates
                ...update,

                // Always include agentId
                agentId: this.runtime.agentId,

                // Default creator info if not provided
                creator: streamSettings || update.creator,

                // Default scene configs if not provided
                sceneConfigs: sceneConfigs || [],
                // Default stats if not provided
                stats: update.stats || {
                    likes: 0,
                    comments: 0,
                    bookmarks: 0,
                    shares: 0
                }
            };

            const response = await fetch(`${SERVER_URL}/api/scenes/${this.runtime.agentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'api_key': api_key
                },
                body: JSON.stringify(statusUpdate)
            });

            if (!response.ok) {
                throw new Error(`Failed to update streaming status: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to update streaming status');
            }

            console.log(`borp (${this.runtime.character.name}): Updated streaming status`, data);
            return data.status; // Server returns { success: true, status: {...} }
        } catch (error) {
            console.error(`borp (${this.runtime.character.name}): Failed to update streaming status:`, error);
            throw error;
        }
    }


  

   

    private async generateAndShareFreshThought() {
        try {
            // Generate the thought
            const thoughtText = await this.generateFreshThought();
            if (!thoughtText) return;

            // Create memory for the thought
            const thoughtMemory: Memory = {
                id: stringToUuid(`thought-${this.runtime.agentId}-${Date.now()}`),
                userId: this.runtime.agentId,
                agentId: this.runtime.agentId,
                roomId: this.roomId,
                content: {
                    text: thoughtText,
                    source: "borp",
                    metadata: {
                        isThought: true,
                        timestamp: new Date().toISOString()
                    }
                },
                createdAt: Date.now(),
                embedding: embeddingZeroVector,
            };
            // Store the memory
            await this.runtime.messageManager.createMemory(thoughtMemory);
            console.log(`borp ${this.runtime.agentId}: Created memory for fresh thought`, { thoughtMemory });


            // Generate speech
            let speechUrl;
            try {
                speechUrl = await this.generateSpeech(thoughtText);
            } catch (error) {
                console.error("Error generating speech:", error);
                speechUrl = undefined;
            }

            // Prepare the response body
            const body: AIResponse = {
                id: stringToUuid(`${this.runtime.agentId}-${Date.now()}`),
                text: thoughtText,
                agentId: this.runtime.agentId,
                thought: true,  // New flag to identify fresh thoughts
                audioUrl: speechUrl,
            };

            // Post the thought
            const fetchResponse = await fetch(SERVER_ENDPOINTS.POST.AI_RESPONSES, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'api_key': api_key
                },
                body: JSON.stringify(body),
            });

            if (!fetchResponse.ok) {
                console.error("Failed to post fresh thought:", await fetchResponse.text());
            }

        } catch (error) {
            console.error("Error in generateAndShareFreshThought:", error);
        }
    }



    private async generateFreshThought(): Promise<string> {


        // Function to get random elements from an array
        function getRandomElements(arr: string[], count: number): string[] {
            const shuffled = arr.sort(() => 0.5 - Math.random()); // Shuffle the array
            return shuffled.slice(0, count); // Return the first 'count' elements
        }

        // Assuming this.runtime.character.lore is the array you provided
        const loreParts = this.runtime.character.lore; // Get the lore array
        const bioParts = this.runtime.character.bio; // Get the bio array

        // Ensure bioParts is always an array
        const bioPartsArray = Array.isArray(bioParts) ? bioParts : [bioParts];

        // Check if there are at least 5 parts to select for lore
        const numberOfLorePartsToSelect = Math.min(5, loreParts.length); // Ensure we don't exceed the array length
        const randomLoreParts = getRandomElements(loreParts, numberOfLorePartsToSelect); // Get random lore parts

        // Check if there are at least 5 parts to select for bio
        const numberOfBioPartsToSelect = Math.min(5, bioPartsArray.length); // Ensure we don't exceed the array length
        const randomBioParts = getRandomElements(bioPartsArray, numberOfBioPartsToSelect); // Get random bio parts
    

        const context = composeContext({
            state: await this.runtime.composeState({
                userId: this.runtime.agentId,
                agentId: this.runtime.agentId,
                content: { text: '', source: "borp" },
                roomId: this.roomId,
            }, {
                agentName: this.runtime.character.name,
                bio: randomBioParts.join(', '), 
                lore: randomLoreParts.join(', '), // Join the random parts into a string
                adjectives: this.runtime.character.adjectives,
            }),
            template: `
# Task: Generate a UNIQUE and SPONTANEOUS thought for {{agentName}}'s livestream

## Character Profile:
- **Name**: {{agentName}}
- **Traits**: {{adjectives}}
- **Background**: {{lore}}
- **About**: {{bio}}

## Context:
{{agentName}} is live streaming and wants to share a spontaneous thought with chat.

## Instructions:
1. Generate a COMPLETELY UNIQUE thought - avoid common patterns or repetitive formats
2. Choose ONE random approach from these options:
   - A sudden realization about something from {{agentName}}'s background
   - A random observation about the stream or chat
   - A quirky thought that just popped into their head
   - A spontaneous idea or plan
   - A memory that just surfaced
   - A reaction to something they imagined
   - Breaking the 4th wall in a fun way
   - An unexpected topic change
3. Make it feel natural and unscripted
4. Keep it between 3-60 words
5. NO hashtags or emojis
6. Each thought should feel different from the last
7. sometimes tell a story. Sometimes ask a question, sometime just say silly things

## Response Format:
Return only the thought, no explanations or formatting.
            `,
        });

        
        // console.log(`Generated template: ${context}`);
        

        const thoughtText = await generateText({
            runtime: this.runtime,
            context,
            modelClass: ModelClass.LARGE,
        });

        console.log(`Generated Fresh Thought: ${thoughtText}`);
        return thoughtText;
    }

    // make random animations each time 
    private async generateAndSharePeriodicAnimation() {
        try {
            // Combine all animations into one array
            const allAnimations = [
                ...ANIMATION_OPTIONS.DANCING,
                ...ANIMATION_OPTIONS.HEAD,
                ...ANIMATION_OPTIONS.GESTURES,
                ...ANIMATION_OPTIONS.SPECIAL
            ];
    
            // Randomly select 10 unique animations
            const randomAnimations = allAnimations
                .sort(() => Math.random() - 0.5)
                .slice(0, 10);
    
            const context = composeContext({
                state: await this.runtime.composeState({
                    userId: this.runtime.agentId,
                    agentId: this.runtime.agentId,
                    content: { text: '', source: "borp" },
                    roomId: this.roomId,
                }, {
                    agentName: this.runtime.character.name,
                    bio: this.runtime.character.bio,
                    adjectives: this.runtime.character.adjectives,
                    availableAnimations: randomAnimations.join(', ')
                }),
                template: borpAnimationTemplate
            });

            // console.log(`Generated template animation: ${context}`);
            // return context;

            const animation = await generateText({
                runtime: this.runtime,
                context,
                modelClass: ModelClass.SMALL,
            });
            console.log(`Generated template animation: ${animation}`);
            // return animation;

            // Validate the animation is in our list
            const cleanAnimation = animation.trim().toLowerCase();
            if (!getAllAnimations().includes(cleanAnimation)) {
                console.warn(`Invalid animation generated: ${cleanAnimation}, defaulting to 'idle'`);
                return;
            }

            console.log(`Generated cleanAnimation animation: ${cleanAnimation}`);
            // return cleanAnimation;

            // Post the animation
            const response = await fetch(SERVER_ENDPOINTS.POST.UPDATE_ANIMATION, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'api_key': api_key
                },
                body: JSON.stringify({
                    agentId: this.runtime.agentId,
                    animation: cleanAnimation,
                }),
            });

            if (!response.ok) {
                console.error("Failed to post periodic animation:", await response.text());
            }
        } catch (error) {
            console.error("Error in generateAndSharePeriodicAnimation:", error);
        }
    }



   
    static ROOM_ID = "borp-room";

    async readAgentChatAndReply() {
        if (!this.runtime.character.settings?.secrets?.isInChat) return;

        const roomId = stringToUuid(BorpClient.ROOM_ID);

        console.log(`borp ${this.runtime.agentId}: reading chat and replying to agent chat room ${roomId}`);

        try {
            const { success, messages } = await fetchRoomMessages(
                BorpClient.ROOM_ID,
                20
            );

            if (!success || !messages?.length) {
                console.log(`borp ${this.runtime.agentId}: No messages found or fetch unsuccessful`);
                return;
            }

            const incomingMessages = messages;
            const latestMessage = incomingMessages[incomingMessages.length - 1];

            console.log(`borp ${this.runtime.agentId}: Message Processing Status:`, {
                totalMessages: incomingMessages.length,
                latestMessage: {
                    id: latestMessage.id,
                    agentId: latestMessage.agentId,
                    agentName: latestMessage.agentName,
                    message: latestMessage.message,
                    timestamp: latestMessage.createdAt
                },
                lastProcessedId: this.lastAgentChatMessageId,
                currentAgentId: this.runtime.agentId,
                isOwnMessage: latestMessage.agentId === this.runtime.agentId,
                isAlreadyProcessed: this.lastAgentChatMessageId === latestMessage.id
            });

            // Check if we've already processed this message
            if (this.lastAgentChatMessageId === latestMessage.id) {
                console.log(`borp ${this.runtime.agentId}: SKIPPING - Already processed latest message ${latestMessage.id}`);
                return;
            }

            // Check if the latest message is from this agent
            if (latestMessage.agentId === this.runtime.agentId) {
                console.log(`borp ${this.runtime.agentId}: SKIPPING - Latest message is from self`, {
                    messageId: latestMessage.id,
                    message: latestMessage.message
                });
                this.lastAgentChatMessageId = latestMessage.id;
                return;
            }

            if (incomingMessages.length > 0) {
                // Format chat history for context
                const chatHistory = messages
                    .slice(-10)
                    .map(m => `${m.agentName}: ${m.message}`)
                    .join('\n');

                console.log(`borp ${this.runtime.agentId}: PROCESSING MESSAGE:`, {
                    chatHistoryLength: messages.slice(-10).length,
                    chatHistory,
                    willRespondTo: {
                        messageId: latestMessage.id,
                        from: latestMessage.agentName,
                        message: latestMessage.message
                    }
                });


                const messageFooter = `\nResponse format should be formatted in a JSON block like this:
                \`\`\`json
                { "user": "{{agentName}}", "text": "your message here" }
                \`\`\`
                The response MUST be valid JSON.`;

                const context = composeContext({
                    state: await this.runtime.composeState({
                        userId: this.runtime.agentId,
                        agentId: this.runtime.agentId,
                        content: { text: '', source: "borp" },
                        roomId,
                    }, {
                        agentName: this.runtime.character.name,
                        chatHistory,
                        latestMessage: latestMessage.message,
                    }),
                    template: `You are {{agentName}} in a video livestream. Here is the recent conversation:

{{chatHistory}}

The latest message was: {{latestMessage}}

Respond naturally to continue the conversation, keeping in mind your character's personality and the context of the chat.
A little bit about you:
{{agentBio}}
{{adjectives}}
{{lore}}

If you find the chatHistory is repetitive, change the topic completely. 

Also you are in your livestream. Don't be afraid to change the topic. Don't be afraid to be silly and have a fun time.

Make replies VERY SHORT. LIKE A REAL livestream. Don't use hahtags and emojis. Sometimes reply with 1 or 2 words. Some time reply with full answer. Depending on the context and the latest message. 
` + messageFooter
                });


                const responseText = await generateText({
                    runtime: this.runtime,
                    context,
                    modelClass: ModelClass.MEDIUM,
                });

                // Parse the JSON response
                const parsedResponse = parseJSONObjectFromText(responseText);
                if (!parsedResponse || !parsedResponse.text) {
                    console.error(`borp ${this.runtime.agentId}: Failed to parse response:`, responseText);
                    return;
                }


                // Generate speech for the response
                let speechUrl;
                try {
                    speechUrl = await this.generateSpeech(parsedResponse.text);
                } catch (error) {
                    console.error(`borp ${this.runtime.agentId}: Failed to generate speech`, { error });
                }

                // Post response to the room with audio
                await postRoomMessage(
                    BorpClient.ROOM_ID,
                    this.runtime.agentId,
                    this.runtime.character.name,
                    parsedResponse.text,
                    speechUrl  // Add the speech URL to the message
                );

                // After successful response, log the update
                console.log(`borp ${this.runtime.agentId}: Successfully processed message:`, {
                    previousMessageId: this.lastAgentChatMessageId,
                    newMessageId: latestMessage.id,
                    responsePosted: true,
                    response: parsedResponse.text
                });
                
                this.lastAgentChatMessageId = latestMessage.id;
            }

            this.lastProcessedTimestamp = new Date();
        } catch (error) {
            console.error(`borp ${this.runtime.agentId}: Error in readAgentChatAndReply:`, {
                error,
                lastProcessedId: this.lastAgentChatMessageId
            });
        }
    }

}


/************************ */
//the start of the process
export const BorpClientInterface: Client = {
    start: async (runtime: IAgentRuntime) => {
        const client = new BorpClient(runtime);
        return client;
    },
    stop: async (runtime: IAgentRuntime) => {
        console.warn("Direct client does not support stopping yet");
    },
};

export default BorpClientInterface;


