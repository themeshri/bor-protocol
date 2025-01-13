import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv'; 
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import StreamingStatusSchema from '../models/StreamingStatus.js';
import AudioResponse from '../models/AudioResponse.js';
import UserProfile  from '../models/UserProfile.js';
import { Filter } from 'bad-words';
import * as badwordsList from 'badwords-list';
import {uploadAudioToBunnyCDN } from './upload/uploadCdn.js';

// Convert ESM module path to dirname
const __filename = fileURLToPath(import.meta.url);

// Initialize environment variables
dotenv.config();

// Import models (with .js extension for ES modules)
import Comment from '../models/Comment.js';
import AIResponse from '../models/AIResponse.js';


const StreamingStatus = mongoose.model('StreamingStatus', StreamingStatusSchema);

const app = express();
const httpServer = createServer(app);



// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],  // Allow all headers
  credentials: true
}));
app.use(express.json());

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  }
});

// Initialize counters
let commentCount = 0;
// Enable debugging
/******************** */
// MongoDB connection
console.log('MongoDB URI 1:', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dbt", {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(async () => {
  console.log('Connected to MongoDB successfully');
  try {
    commentCount = await Comment.countDocuments();
    console.log('Initial counts loaded - Comments:', commentCount);
  } catch (error) {
    console.error('Error initializing counts:', error);
  }
})
.catch(err => {
  console.error('Detailed MongoDB connection error:', err);
  process.exit(1); // Exit if we can't connect to database
});

// Add this to handle connection errors after initial connection
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error after initial connection:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

/******************** */


// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

/******************************************* */



// Add these functions before the routes





/*organize**************** */
//socket and stream infos
// Add this near the top where other state variables are defined
const agentViewers = new Map();

// Add near top with other state variables
const socketToStream = new Map();

// Helper function to emit stream counts
function emitStreamCounts() {
  const streamCounts = Object.fromEntries(
    Array.from(agentViewers.entries()).map(([agentId, viewers]) => [
      agentId,
      viewers.size
    ])
  );

  console.log('Emitting stream counts:', streamCounts);
  io.emit('stream_counts', streamCounts);
}



// Add new routes before your existing routes

// Add this near the top with other imports

// Add these helper functions before the route



/*organize**************** */
//functionnalities
const filter = new Filter();

// Remove overly strict words from the filter
filter.removeWords(
  'poop',
  'gay',
  'hell',
  'damn',
  'god',
  'jesus',
  'crap',
  'darn',
  'idiot',
  'stupid',
  'dumb',
  'weird',
  'sucks',
  'wtf',
  'omg',
  'butt',
  'fart',
  'sexy',
  'sex',
  'hate',
  'drunk',
  'drugs',
  'drug',
  'faggot'
);

function isValidHandle(handle) {
  // Check if handle contains profanity
  // if (filter.isProfane(handle)) {
  //   return false;
  // }

  // Additional handle validation rules
  const validHandleRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return validHandleRegex.test(handle);
}

// Create a custom filter function
function filterProfanity(text) {
  // Get the bad words array from the list
  const badWords = badwordsList.array;
  
  // Convert text to lowercase for checking
  let filteredText = text;
  
  // Replace bad words with asterisks
  badWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  
  return filteredText;
}
/******************** */















/*organize******************* */
//something related to agent works

// Add periodic ping to keep counts accurate
setInterval(() => {
  for (const [agentId, viewers] of agentViewers.entries()) {
    io.emit(`${agentId}_viewer_count`, { count: viewers.size });
  }
}, 5000); // Update every 5 seconds

// Add this function near the top where other state variables are defined
function getConnectedPeers() {
  return io.engine.clientsCount;
}

// Add a cleanup job to mark agents as offline if no heartbeat received
setInterval(async () => {
  try {
    const heartbeatThreshold = Date.now() - (30 * 1000); // 30 seconds timeout

    const inactiveAgents = await StreamingStatus.find({
      isStreaming: true,
      lastHeartbeat: { $lt: heartbeatThreshold }
    });

    for (const agent of inactiveAgents) {
      agent.isStreaming = false;
      await agent.save();

      // Notify clients about status change
      io.emit('streaming_status_update', agent);
      io.emit(`${agent.agentId}_heartbeat`, {
        timestamp: agent.lastHeartbeat,
        isStreaming: false
      });
    }
  } catch (error) {
    console.error('Error in heartbeat cleanup job:', error);
  }
}, 15000); // Run every 15 seconds

/******************** */






export default app;







/*organize*************** */
//sockets
//emit


// Update the socket connection handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.emit('initial_state', {
    peerCount: getConnectedPeers(),
    commentCount
  });

  io.emit('peer_count', { count: getConnectedPeers() });

  socket.on('request_peer_count', () => {
    socket.emit('peer_count', { count: getConnectedPeers() });
  });



  socket.on('update_streaming_status', async (data) => {
    try {
      const { agentId, isStreaming, title } = data;
      const status = await StreamingStatus.findOneAndUpdate(
        { agentId },
        {
          isStreaming,
          title,
          startedAt: isStreaming ? new Date() : null,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
      io.emit('streaming_status_update', status);
    } catch (error) {
      console.error('Error handling streaming status:', error);
    }
  });

  socket.on('audio_response', async (data) => {
    try {
      console.log('Received audio response socket event:', data);
      const { messageId, agentId, audioUrl } = data;

      const audioResponse = new AudioResponse({
        messageId,
        agentId,
        audioUrl
      });

      await audioResponse.save();

      // Emit to all clients
      io.emit(`${agentId}_audio_response`, {
        messageId,
        agentId,
        audioUrl
      });

    } catch (error) {
      console.error('Error handling audio response socket event:', error);
    }
  });

  // COMMENTS
  // Write me a function to censor this

  socket.on('new_comment', async (data) => {
    // Add a debug log to track calls
    console.log('new_comment event received:', { socketId: socket.id, data });
    
    const { comment, agentId } = data;
    try {
      // Prevent duplicate processing
      const messageId = comment.id || Date.now().toString();
      const duplicateCheck = await Comment.findOne({ id: messageId });
      if (duplicateCheck) {
        console.log('Duplicate comment detected, skipping:', messageId);
        return;
      }

      commentCount++;
      
      // Filter the comment text
      const filteredMessage = filterProfanity(comment.message);
      console.log('filteredMessage', filteredMessage, comment.message);

      const newComment = new Comment({
        ...comment,
        id: messageId, // Ensure we use the same ID we checked for duplicates
        message: filteredMessage,
        agentId,
        avatar: comment.avatar,
        handle: comment.handle
      });
      
      await newComment.save();

      // Emit to all clients
      io.emit('comment_received', { newComment, commentCount });
      if (agentId) {
        io.emit(`${agentId}_comment_received`, { newComment, commentCount });
      }
    } catch (error) {
      console.error('Error handling new_comment:', error);
    }
  });

 

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Add these new socket event handlers
  socket.on('join_agent_stream', (agentId) => {
    const previousStream = socketToStream.get(socket.id);
    if (previousStream) {
      agentViewers.get(previousStream)?.delete(socket.id);
    }

    socketToStream.set(socket.id, agentId);
    if (!agentViewers.has(agentId)) {
      agentViewers.set(agentId, new Set());
    }
    agentViewers.get(agentId)?.add(socket.id);

    emitStreamCounts(); // Emit updated counts to all clients
  });

  socket.on('leave_agent_stream', (agentId) => {
    // Remove this socket from the agent's viewers
    agentViewers.get(agentId)?.delete(socket.id);

    // Emit updated viewer count
    const viewerCount = agentViewers.get(agentId)?.size || 0;
    io.emit(`${agentId}_viewer_count`, { count: viewerCount });

    // Clean up empty sets
    if (viewerCount === 0) {
      agentViewers.delete(agentId);
    }
  });

  // Update the disconnect handler
  socket.on('disconnect', () => {
    const agentId = socketToStream.get(socket.id);
    if (agentId) {
      agentViewers.get(agentId)?.delete(socket.id);
      socketToStream.delete(socket.id);
      emitStreamCounts(); // Emit updated counts to all clients
    }
    console.log('Client disconnected:', socket.id);
  });
});

/******************** */










/*organize************** */
//api works : 
app.get('/api/streams/:agentId/unread-comments', async (req, res) => {
  try {
    //solved by removing agentid in the query
    console.log("Fetching unread comments", req.query);
    const { agentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // First, let's check if there are any comments at all for this agent
    const totalComments = await Comment.find({ }).countDocuments();
    console.log("Total comments for agent:", {
      agentId,
      totalComments
    });

    // If we have comments, let's see their date range
    /*if (totalComments > 0) {
      const oldestComment = await Comment.findOne({ agentId }).sort({ createdAt: 1 });
      const newestComment = await Comment.findOne({ agentId }).sort({ createdAt: -1 });
      console.log("Comment date range:", {
        oldest: oldestComment?.createdAt,
        newest: newestComment?.createdAt
      });
    }*/
//to do
    // Increase time window to 15 minutes for testing
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const query = {
      readByAgent: false,  // Add this condition to get unread comments
      createdAt: { $gte: fifteenMinutesAgo }
    };

    console.log("Query:", {
      agentId,
      timeWindow: fifteenMinutesAgo.toISOString(),
      currentTime: new Date().toISOString()
    });

    // Get the last comment by sorting in descending order and limiting to 1
    const comments = await Comment.find(query)  // Use the modified query
      .sort({ createdAt: -1 })  // Sort by creation time, newest first
      .limit(1);                // Only get 1 result

    console.log("Found comments:", {
      count: comments.length,
      comments: comments.map(c => ({
        message: c.message,
        createdAt: c.createdAt,
        agentId: c.agentId
      }))
    });

    res.json({ 
      comments,
      metadata: {
        count: comments.length,
        totalCommentsForAgent: totalComments,
        since: fifteenMinutesAgo.toISOString(),
        hasMore: comments.length >= limit,
        query: query
      }
    });
  } catch (error) {
    console.error('Error fetching unread comments:', error);
    res.status(500).json({ error: 'Failed to fetch unread comments' });
  }
});

// Needs some testing from borp-client to see if it works
app.post('/api/upload/audio', async (req, res) => {
  try {
    // check if req is the audio stream
    console.log('TESTING IF THIS IS BEING CALLED');
    if (req.headers['isAudioStream'] !== 'true' && req.headers['content-type'] !== 'audio/mpeg') {
      return res.status(400).json({ error: 'Not an audio stream' });
    }
    const audioBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', (err) => reject(err));
    });
    const url = await uploadAudioToBunnyCDN(audioBuffer);
    res.json({ message: 'Upload successful', url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Stats endpoints
app.get('/api/streams/:agentId/stats', async (req, res) => {
  const agentId = req.params.agentId;
  try {
    const comments = await Comment.countDocuments({ agentId });
    console.log({  comments, agentId });
    res.json({  comments });
  } catch (error) {
    console.error('Error in /api/streams/:agentId/stats:', error);
    res.status(500).json({ error: 'Failed to get stream stats' });
  }
});


//this used for the chathistory to be displayed in the left corner when opening the app firsttime
// Add this new endpoint before the export default app
app.get('/api/agents/:agentId/chat-history', async (req, res) => {
  try {
    const { agentId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before ? new Date(req.query.before) : new Date();

    // Fetch comments and AI responses in parallel
    const [comments, aiResponses] = await Promise.all([
      Comment.find({
        agentId,
        createdAt: { $lt: before }
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),

      AIResponse.find({
        agentId,
        createdAt: { $lt: before }
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
    ]);
    

     // Transform and combine the results
  const chatHistory = [
      ...comments.map(c => ({
        id: c._id.toString(),
        type: 'comment',
        message: c.message,
        createdAt: c.createdAt,
        sender: c.user,
        handle: c.handle,
        avatar: c.avatar
      })),
      ...aiResponses.map(r => ({
        id: r._id.toString(),
        type: 'ai_response',
        message: r.text,
        createdAt: r.createdAt,
        thought: r.thought
      }))
    ];

    // Sort by creation date, newest first
    chatHistory.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Trim to requested limit
    const trimmedHistory = chatHistory.slice(0, limit);

    res.json({
      chatHistory: trimmedHistory,
      pagination: {
        hasMore: chatHistory.length >= limit,
        oldestMessageDate: trimmedHistory[trimmedHistory.length - 1]?.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});




//i think can be switched by /ff to be handled carefully
app.post('/api/user-profile', async (req, res) => {
  try {
    const { publicKey, handle, pfp } = req.body;

    // Validate handle
    if (!handle || !isValidHandle(handle)) {
      return res.status(400).json({
        error: 'Invalid handle. Handle must be 3-20 characters long, contain only letters, numbers, underscores, and hyphens, and not contain inappropriate content.'
      });
    }

    // Check if the handle is already taken by another user
    const existingProfile = await UserProfile.findOne({ handle });
    if (existingProfile && existingProfile.publicKey !== publicKey) {
      return res.status(409).json({ error: 'Handle already taken' });
    }

    // Create or update the user profile
    const profile = await UserProfile.findOneAndUpdate(
      { publicKey },
      { handle, pfp },
      { new: true, upsert: true }
    );

    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating or updating user profile:', error);
    res.status(500).json({ error: 'Failed to create or update user profile' });
  }
});







/*organize************* */
//eliza package use
// Animation and Expression endpoints
app.post('/api/update-animation', async (req, res) => {
  // Check API key
  // const apiKey = req.headers['api_key'];
  // if (apiKey !== API_KEY) {
  //   console.log('Invalid API key', apiKey, 'expected:', API_KEY, { headers: req?.headers });
  //   return res.status(401).json({ error: 'Invalid API key' });
  // }

  try {
    console.log('update-animation', req.body);
    const animation = req.body.animation;
    const agentId = req.body.agentId;
    console.log(`Requested animation: ${animation} for agentId: ${agentId}`);

    io.emit('update_animation', animation);

    if (agentId) {
      io.emit(`${agentId}_update_animation`, animation);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating animation:', error);
    res.status(500).json({ error: error.message });
  }
});

// a voir maybe we deleted
app.post('/api/ai-responses', async (req, res) => {
  // Check API key
  // const apiKey = req.headers['api_key'];
  // if (apiKey !== API_KEY) {
  //   console.log('Invalid API key', apiKey, 'expected:', API_KEY, { headers: req?.headers });
  //   return res.status(401).json({ error: 'Invalid API key' });
  // }

  const { agentId, ...requestBody } = req.body;
  try {

    console.log('ai-responses', req.body);

   
    // Get user profile if replyToUser is provided
    let handle;
    let pfp;

    if (requestBody.replyToUser) {
      try {
        const userProfile = await UserProfile.findOne({ publicKey: requestBody.replyToUser });
        handle = userProfile?.handle;
        pfp = userProfile?.pfp;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Continue execution without the profile info rather than failing the whole request
      }
    }

    // // Emit animation update if provided
    // if (requestBody.animation) {
    //   console.log('AI_RESPONSE: EMIT update_animation', { agentId, requestBody });
    //   if (agentId) {
    //     io.emit(`${agentId}_update_animation`, requestBody.animation);
    //   } else {
    //     io.emit('update_animation', requestBody.animation);
    //   }
    // }

    // // Emit audio response if provided
    // if (requestBody.audioUrl) {
    //   console.log('AI_RESPONSE: EMIT audio_response', { agentId, audioUrl: requestBody.audioUrl });
    //   io.emit(`${agentId}_audio_response`, {
    //     messageId: requestBody.id,
    //     audioUrl: requestBody.audioUrl
    //   });
    // }

    // Emit response with appropriate channel
    if (!agentId) {
      io.emit('ai_response', {
        id: requestBody.id,
        agentId: agentId || undefined,
        // aiResponse: savedResponse,
        text: requestBody.text,
        animation: requestBody.animation,
        handle,
        pfp,
        replyToUser: requestBody.replyToUser,
        replyToMessageId: requestBody.replyToMessageId,
        replyToMessage: requestBody.replyToMessage,
        replyToHandle: requestBody.replyToHandle,
        replyToPfp: requestBody.replyToPfp,
        isGiftResponse: requestBody.isGiftResponse,
        giftId: requestBody.giftId,
        audioUrl: requestBody.audioUrl,
        thought: requestBody.thought,
      });
    } else {
      console.log('EMIT ai_response', { agentId, requestBody });
      io.emit(`${agentId}_ai_response`, {
        id: requestBody.id,
        agentId,
        // aiResponse: savedResponse,
        text: requestBody.text,
        animation: requestBody.animation,
        handle,
        pfp,
        replyToUser: requestBody.replyToUser,
        replyToMessageId: requestBody.replyToMessageId,
        replyToMessage: requestBody.replyToMessage,
        replyToHandle: requestBody.replyToHandle,
        replyToPfp: requestBody.replyToPfp,
        isGiftResponse: requestBody.isGiftResponse,
        giftId: requestBody.giftId,
        audioUrl: requestBody.audioUrl,
        thought: requestBody.thought,
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: error.message });
  }
});

//mark comment as read method + url

async function markCommentsAsRead(commentIds) {
  try {
    const result = await Comment.updateMany(
      { id: { $in: commentIds } },
      { $set: { readByAgent: true } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'No comments found' };
    }

    return {
      success: true,
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    console.error('Error marking comments as read:', error);
    return { success: false, error: 'Failed to mark comments as read' };
  }
}
app.post('/api/comments/mark-read', async (req, res) => {
  try {
    const { commentIds } = req.body;

    if (!Array.isArray(commentIds)) {
      return res.status(400).json({ error: 'commentIds must be an array' });
    }

    const result = await markCommentsAsRead(commentIds);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking comments as read:', error);
    res.status(500).json({ error: 'Failed to mark comments as read' });
  }
});











/*organize************** */
//scenes info as i see




//this one called but always empty for my test
app.get('/api/scenes', async (req, res) => {
  try {
    // Get all active streams from the database (changed isStreaming to true)
    const activeStreams = await StreamingStatus.find({
      isStreaming: true,
      lastHeartbeat: { $gte: new Date(Date.now() - 10 * 1000) } // Only show streams with heartbeat in last 30s
    }).lean();

    // Transform streams into the required format
    const formattedScenes = activeStreams.map((stream, index) => ({
      id: index,
      title: stream.title || 'Untitled Stream',
      agentId: stream.agentId,
      twitter: stream.twitter,
      modelName: stream.modelName,
      identifier: stream.identifier || stream.agentId,
      description: stream.description,
      color: stream.color,
      type: stream.type || 'stream',
      component: stream.component || "ThreeScene",
      walletAddress: stream.walletAddress,
      creator: stream.creator || {
        avatar: "https://i.pravatar.cc/100",
        title: "Virtual Streamer",
        username: "Anonymous"
      },
      sceneConfigs: stream.sceneConfigs?.map(config => {
        console.log({config});
        // Get the actual config data, handling potential nesting
        const configData = config.__parentArray?.[0] || config;
        
        return {
          id: configData.id || 0,
          name: configData.name || "Default Scene",
          description: configData.description || "Interactive Scene",
          clothes: configData.clothes || "casual",
          model: configData.model,
          environmentURL: configData.environmentURL,
          defaultAnimation: configData.defaultAnimation || "idle",
          cameraPosition: configData.cameraPosition || [0, 1.15, -2.5],
          cameraRotation: configData.cameraRotation || 0,
          modelPosition: configData.modelPosition || [0, 0, -4],
          modelRotation: configData.modelRotation || [0, 0, 0],
          modelScale: configData.modelScale || [1, 1, 1],
          environmentScale: configData.environmentScale || [1, 1, 1],
          environmentPosition: configData.environmentPosition || [0, -1, -5],
          environmentRotation: configData.environmentRotation || [0, 1.5707963267948966, 0],
          cameraPitch: configData.cameraPitch || 0
        };
      }),
      stats: stream.stats || {
        comments: 0,
        bookmarks: 0,
        shares: 0
      }
    }));

    res.json(formattedScenes);
  } catch (error) {
    console.error('Error fetching scenes:', error);
    res.status(500).json({ error: 'Failed to fetch scenes' });
  }
});

//this one doesnt called 
app.post('/api/scenes', async (req, res) => {
  try {
    const {
      agentId,
      title,
      sceneConfigs,
      characterName,
      ...otherData
    } = req.body;

    // Validate required fields
    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    // Validate sceneConfigs if provided
    if (sceneConfigs) {
      const hasInvalidConfig = sceneConfigs.some((config) => 
        !config.model || !config.environmentURL
      );
      if (hasInvalidConfig) {
        return res.status(400).json({ 
          error: 'Each sceneConfig must include model and environmentURL' 
        });
      }
    }

    // Create new streaming status with proper defaults
    const newStream = new StreamingStatus({
      agentId,
      title: title || 'Untitled Stream',
      isStreaming: true,
      characterName: characterName || 'Bor',  
      lastHeartbeat: new Date(),
      startedAt: new Date(),
      ...otherData,
      // Only set sceneConfigs if provided, otherwise schema defaults will be used
      ...(sceneConfigs && { sceneConfigs })
    });

    await newStream.save();
    res.status(201).json(newStream);

  } catch (error) {
    console.error('Error creating scene:', error);
    res.status(500).json({ error: 'Failed to create scene' });
  }
});

//this one doesnt called 


// Add the put endpoint ('/api/agents/:agentId')

app.put('/api/scenes/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const updateData = req.body;

    // Validate agentId
    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required agentId parameter'
      });
    }

    // Validate sceneConfigs if provided
    if (updateData.sceneConfigs) {
      const hasInvalidConfig = updateData.sceneConfigs.some((config) => 
        !config.model || !config.environmentURL
      );
      if (hasInvalidConfig) {
        return res.status(400).json({
          success: false,
          error: 'Each sceneConfig must include model and environmentURL'
        });
      }
    }

    const now = new Date();
    const update = {
      ...updateData,
      lastHeartbeat: now,
      updatedAt: now
    };

    const status = await StreamingStatus.findOneAndUpdate(
      { agentId },
      { $set: update },
      {
        new: true,
        upsert: true,
        runValidators: true // Enable schema validation on update
      }
    );

    const viewerCount = agentViewers.get(agentId)?.size || 0;
    const response = {
      ...status.toObject(),
      stats: {
        ...status.stats,
        viewers: viewerCount
      }
    };

    io.emit('streaming_status_update', response);
    io.emit(`${agentId}_heartbeat`, {
      timestamp: status.lastHeartbeat,
      isStreaming: status.isStreaming,
      viewers: viewerCount
    });

    res.json({
      success: true,
      status: response
    });

  } catch (error) {
    console.error('Error updating agent status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update agent status'
    });
  }
});





/*organize************** */
//server looking out
// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received shutdown signal');
  io.emit('server_shutdown', { message: 'Server is shutting down' });
  io.close(() => {
    console.log('All socket connections closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 6969;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}`);
  console.log('Accepting connections from all origins');
});

/******************** */