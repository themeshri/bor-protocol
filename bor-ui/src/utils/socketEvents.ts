export const SOCKET_EVENTS = {
    CONNECTION: 'connect',
    INITIAL_STATE: 'initial_state',
    PEER_COUNT: 'peer_count',
    REQUEST_PEER_COUNT: 'request_peer_count',
    AI_RESPONSE: 'ai_response',
    UPDATE_ANIMATION: 'update_animation',
    // Dynamic events based on currentAgentId
    LIKE_RECEIVED: (agentId: string) => `${agentId}_like_received`,
    COMMENT_RECEIVED: (agentId: string) => `${agentId}_comment_received`,
    AGENT_AI_RESPONSE: (agentId: string) => `${agentId}_ai_response`,
    // Emitters
    SEND_LIKE: 'send_like',
    SEND_COMMENT: 'send_comment',
    // New event
    NEW_MESSAGE: 'new_message',
} as const; 