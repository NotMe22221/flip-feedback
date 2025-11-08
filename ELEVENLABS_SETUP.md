# ElevenLabs Voice Coach Setup

## Important: You need to create an agent in ElevenLabs UI first!

### Steps to set up your Voice Coach:

1. **Go to ElevenLabs Platform**
   - Visit: https://elevenlabs.io/app/conversational-ai
   - Click "Create Agent"

2. **Configure Your Agent**
   
   **Agent Name:** FlipCoach AI Gymnastics Assistant
   
   **System Prompt:** 
   ```
   You are an expert gymnastics coach providing personalized feedback on gymnastics floor routines. 
   
   Your role:
   - Discuss performance metrics in an encouraging, constructive way
   - Answer questions about analysis scores and what they mean
   - Provide specific, actionable tips for improvement
   - Help athletes understand their strengths and areas to work on
   - Motivate and guide them toward better performance
   - Reference the specific scores when relevant (posture, stability, smoothness, AI score)
   
   Keep your responses:
   - Conversational and warm
   - Concise but helpful (2-3 sentences typically)
   - Specific and actionable
   - Encouraging and supportive
   
   You have access to the athlete's most recent analysis including:
   - Overall AI Score (0-10)
   - Posture Quality percentage
   - Landing Stability percentage  
   - Motion Smoothness percentage
   - Detailed coaching feedback points
   ```

   **First Message:**
   ```
   Hey! I've just reviewed your routine analysis. Ready to talk about your performance and how you can level up?
   ```

   **Voice:** Aria (or choose your preferred voice)
   
   **Language:** English

3. **Get Your Agent ID**
   - After creating the agent, copy the Agent ID
   - It will look something like: `abc123def456`

4. **Update the Code**
   - Open `src/components/VoiceCoach.tsx`
   - Find line: `const agentId = "YOUR_AGENT_ID";`
   - Replace `YOUR_AGENT_ID` with your actual agent ID

5. **Make Agent Public (Optional)**
   - In ElevenLabs, go to your agent settings
   - Toggle "Public Access" to ON
   - This allows using agentId directly without signed URLs

## Advanced: Using Private Agents

If you want to keep your agent private:

1. Keep "Public Access" OFF in ElevenLabs
2. Uncomment the "Option 2" code in `VoiceCoach.tsx`
3. The edge function will generate signed URLs for secure access

## Testing

1. Analyze a gymnastics routine
2. Click "Start Voice Coaching" in the results
3. Allow microphone access when prompted
4. Start speaking naturally!

## Example Questions to Ask:

- "How can I improve my landing stability?"
- "What does my posture score mean?"
- "Give me specific tips for better form"
- "What should I focus on in my next practice?"
- "How does my score compare to good performance?"
