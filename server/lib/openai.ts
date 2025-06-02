import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function transcribeAudio(audioBlob: Buffer): Promise<string> {
  try {
    // Note: In a real implementation, you would save the audio blob to a temporary file
    // For this demo, we'll simulate the transcription process
    // The frontend will use Web Speech API for real-time transcription
    
    // const transcription = await openai.audio.transcriptions.create({
    //   file: audioBlob,
    //   model: "whisper-1",
    // });
    
    // return transcription.text;
    
    // For now, we'll just return the text that was already transcribed by Web Speech API
    throw new Error("Audio transcription not implemented - use Web Speech API on frontend");
  } catch (error) {
    throw new Error("Failed to transcribe audio: " + error.message);
  }
}

export async function summarizeThoughts(transcript: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes personal thoughts and reflections. Create a concise, insightful summary that captures the main themes, emotions, and key points from the user's brain dump. Focus on being supportive and identifying patterns or insights that might be helpful for personal reflection. Keep the summary to 2-3 sentences."
        },
        {
          role: "user",
          content: `Please summarize these thoughts: ${transcript}`
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Unable to generate summary";
  } catch (error) {
    throw new Error("Failed to summarize thoughts: " + error.message);
  }
}

export async function generateMotivationalMessage(): Promise<{ text: string; author: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a motivational quote generator. Create an original, inspiring message for someone starting their day. The message should be uplifting, actionable, and focused on personal growth or achievement. Include a fictional but believable author name. Return the response as JSON with 'text' and 'author' fields."
        },
        {
          role: "user",
          content: "Generate a motivational message for today"
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{"text": "Today is full of possibilities. Make them count.", "author": "Unknown"}');
    
    return {
      text: result.text || "Today is full of possibilities. Make them count.",
      author: result.author || "Unknown"
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate motivational message");
  }
}

export async function analyzeMoodJourney(moodEntries: Array<{ mood: string; emoji: string; note?: string; timestamp: string }>): Promise<string> {
  if (moodEntries.length === 0) {
    return "No mood entries to analyze today.";
  }

  try {
    const moodData = moodEntries.map(entry => ({
      time: new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      mood: entry.mood,
      emoji: entry.emoji,
      note: entry.note || null
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an empathetic mood analyst that provides thoughtful insights about emotional patterns throughout the day. Analyze the mood journey using first-person perspective (I, my) as if the user is reflecting on their own emotional experience. Be supportive, insightful, and focus on patterns, transitions, and overall emotional themes. Keep the analysis concise but meaningful."
        },
        {
          role: "user",
          content: `Please analyze my mood journey for today and provide insights about my emotional patterns, transitions, and overall themes. Here are my mood entries: ${JSON.stringify(moodData)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.analysis || "Unable to analyze mood journey";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze mood journey");
  }
}

export async function summarizeNotesWithActionItems(content: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an intelligent assistant that analyzes daily notes and provides helpful summaries with actionable insights. 

Your task is to:
1. Summarize the key themes and topics from the notes
2. Identify any action items, tasks, or follow-ups mentioned
3. Highlight important deadlines, appointments, or commitments
4. Suggest any patterns or insights that might be valuable
5. Present everything in a clear, organized format

Important: Write in first person perspective using "I" statements, as if you are the person who wrote the notes reflecting on their own thoughts and activities.

Format your response with clear sections:
**Summary:**
[Brief overview of main topics and themes using "I" statements]

**Action Items:**
[List specific tasks or follow-ups I need to do, if any]

**Important Notes:**
[Key information, deadlines, or insights I should remember]

Be concise but thorough. If no clear action items exist, focus on summarizing the key themes and any valuable insights using first person language.`
        },
        {
          role: "user",
          content: `Please analyze these daily notes and provide a summary with action items:\n\n${content}`
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Unable to generate summary at this time.";
  } catch (error) {
    console.error("Failed to summarize notes:", error);
    throw new Error("Failed to generate summary. Please try again.");
  }
}
