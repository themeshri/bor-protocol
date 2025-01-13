import { ANIMATION_OPTIONS } from "./constants.ts";

export const borpMessageAnimationTemplate = ({ agentName, lastMessage, animationOptions }) =>
    // {{goals}}
    `
# Task: Generate an animation for {${agentName}} based on the last message: {${lastMessage}} .

Examples of {${agentName}}'s animation options:
Must be one of: 
{${animationOptions}}


# Instructions: Write the animation for {${agentName}}. It must be one of the options above.
If you choose to not animate, respond with idle. Never repond with null
`

export const borpAnimationTemplate =`
# Task: Generate a RANDOM animation for {{agentName}} during their stream

## Available Animations
{{availableAnimations}}

# Instructions
1. Look at the list of available animations above
2. Pick ONE animation at random - it's important to be truly random and not pick the same one repeatedly
3. Return ONLY the exact name of the chosen animation, nothing else
4. The animation must be exactly as written in the list above
5. DO NOT explain your choice, just return the animation name

# Response Format
Return only the animation name, nothing else. No explanation, no JSON, no quotes.
`


export const borpMessageCompletionFooter = `\nResponse format should be formatted in a JSON block like this:
\`\`\`json
{ "user": "{{agentName}}", "text": string, "action": "string", "animation": "one_of_available_animations" }
\`\`\``;


export const borpMessageHandlerTemplate =
    // {{goals}}
    `# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

Examples of {{agentName}}'s dialog and actions:
{{characterMessageExamples}}

{{providers}}

{{attachments}}
s
{{actions}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}
{{recentMessages}}


# Instructions: Write the next message for {{agentName}} to the selected message below. Include an action, if appropriate. {{actionNames}}
{{selectedComment}}

Also, provide an animation for {{agentName}} to use.
The animation must be one of the following:
{{animationOptions}}

# Style
 - Keep messages short and sweet. 
 - Stay in character as {{agentName}}

` + borpMessageCompletionFooter;


export const borpSelectCommentTemplate =
    `# Task: Select the most appropriate comment for {{agentName}} to respond to.
About {{agentName}}:
{{bio}}

# INSTRUCTIONS: Analyze the following comments and select the most relevant one for {{agentName}} to respond to.
Consider these priorities:
1. Direct mentions or questions to {{agentName}}
2. Topics that align with {{agentName}}'s interests and expertise
3. Recent messages that haven't been responded to
4. Messages that would benefit from {{agentName}}'s unique perspective

# Selection Criteria:
- Prioritize messages directly addressing {{agentName}}
- Consider message recency and relevance
- Avoid interrupting existing conversations unless directly involved
- Select messages where {{agentName}}'s response would add value
- Ignore spam or irrelevant messages

{{recentMessages}}

# INSTRUCTIONS: Return only the ID of the single most appropriate comment to respond to. If no comments are suitable, return "NONE".
`;


export const giftResponseFooter = `\nFormat your response as a JSON object:
\`\`\`json
{
    "user": "{{agentName}}",
    "text": "your response message",
    "animation": "one_of_available_animations"
}
\`\`\``;
