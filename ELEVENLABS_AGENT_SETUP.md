# ElevenLabs Agent Setup Instructions

## Important: Agent Configuration

The AI Voice Coach uses a **signed URL** approach to connect to ElevenLabs. This means the agent configuration MUST be set up in the ElevenLabs UI, not in the code.

## Current Agent ID
`agent_0201k9jbjjp1e53azsch7mwwreqx`

## Required Agent Configuration in ElevenLabs UI

Go to https://elevenlabs.io/app/conversational-ai and configure your agent with the following settings:

### System Prompt
```
You are an expert gymnastics coach providing personalized feedback. 
You analyze gymnastics routines and provide constructive, encouraging coaching.

Your role:
- Discuss the performance metrics in an encouraging, constructive way
- Answer questions about the analysis and scores
- Provide specific tips for improvement based on the feedback
- Help the gymnast understand what the scores mean
- Motivate and guide them toward better performance

Be conversational, supportive, and knowledgeable. Keep responses concise but helpful.
When the user starts the conversation, greet them warmly and ask if they'd like to discuss their recent routine analysis.
```

### First Message
```
Hey there! I'm your AI gymnastics coach. I'm here to help you improve your performance! Have you just completed a routine analysis that you'd like to discuss?
```

### Voice Settings
- **Voice**: Aria (or any professional-sounding voice)
- **Language**: English

### Advanced Settings
- **Enable**: Interruptions
- **Response delay**: Fast
- **Stability**: Balanced

## How It Works

1. User clicks "Start Voice Coaching"
2. App requests microphone permission
3. Backend generates signed URL using `ELEVENLABS_API_KEY`
4. Frontend connects to ElevenLabs WebSocket using signed URL
5. User can speak naturally with the AI coach

## Troubleshooting

### Connection Issues
- Verify `ELEVENLABS_API_KEY` is set in Supabase secrets
- Check that the agent ID is correct
- Ensure the agent is published in ElevenLabs UI

### Audio Issues
- Verify microphone permissions are granted
- Check browser compatibility (Chrome/Edge recommended)
- Ensure HTTPS connection for microphone access

### Agent Not Responding Properly
- Update the system prompt in ElevenLabs UI
- Check agent language settings match your needs
- Verify voice settings are configured
