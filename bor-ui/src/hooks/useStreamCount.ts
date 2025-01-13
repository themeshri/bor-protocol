import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

export const useStreamCount = (agentId: string) => {
    const { socket } = useSocket();
    const [viewerCount, setViewerCount] = useState(0);

    useEffect(() => {
        // Join the agent's stream when component mounts

        // Listen for stream counts updates
        socket.on('stream_counts', (counts: Record<string, number>) => {
            // Set viewer count for this specific agent
            // console.log("stream_counts", counts)
            setViewerCount(counts[agentId] || 0);
        });

        // Optional: Add error handling
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        // Clean up when component unmounts or agentId changes
        return () => {
            socket.emit('leave_agent_stream', agentId);
            socket.off('stream_counts');
            socket.off('error');
        };
    }, [agentId, socket]);

    return viewerCount;
};
