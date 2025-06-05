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
          content: `Please analyze my mood journey for today and provide insights about my emotional patterns, transitions, and overall themes. Return your analysis as JSON with an 'analysis' field. Here are my mood entries: ${JSON.stringify(moodData)}`
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

export async function summarizeTimeLog(timeEntries: Array<{ timeSlot: string; activity: string }>): Promise<string> {
  try {
    const timeLogText = timeEntries
      .map(entry => `${entry.timeSlot}: ${entry.activity}`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a time management analyst. Analyze the daily time log and provide an insightful summary of how the person spent their day. Identify patterns, productivity peaks, areas for improvement, and overall time allocation. Keep the summary concise but meaningful, focusing on productivity insights and work-life balance observations. Use first person perspective with 'I' statements."
        },
        {
          role: "user",
          content: `Please analyze this time log and provide a productivity summary:\n\n${timeLogText}`
        }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "Unable to generate time log summary";
  } catch (error) {
    console.error("Error summarizing time log:", error);
    throw new Error("Failed to generate time log summary");
  }
}

export async function generateDailySummary(dailyData: {
  brainDump?: string;
  notes?: string;
  gratitude?: string;
  moods?: Array<{ mood: string; emoji: string; note?: string; timestamp: string }>;
  reflection?: string;
  tasks?: Array<{ text: string; completed: boolean }>;
  timeLog?: Array<{ timeSlot: string; activity: string }>;
}): Promise<{
  summary: string;
  highlights: string;
  moodTheme: string;
  productivityScore: number;
}> {
  try {
    const completedTasks = dailyData.tasks?.filter(task => task.completed) || [];
    const totalTasks = dailyData.tasks?.length || 0;
    const moodSummary = dailyData.moods?.map(m => `${m.mood} ${m.emoji} ${m.note || ''}`).join(', ') || 'No mood entries';
    
    const prompt = `Analyze my complete day and create a comprehensive first-person summary:

MY BRAIN DUMP/THOUGHTS: ${dailyData.brainDump || 'None recorded'}

MY DAILY NOTES: ${dailyData.notes || 'None recorded'}

MY GRATITUDE JOURNAL: ${dailyData.gratitude || 'None recorded'}

MY MOOD JOURNEY: ${moodSummary}

MY END OF DAY REFLECTION: ${dailyData.reflection || 'None recorded'}

MY TASKS: ${totalTasks > 0 ? `${completedTasks.length}/${totalTasks} completed` : 'No tasks recorded'}

MY TIME LOG: ${dailyData.timeLog?.map(t => `${t.timeSlot}: ${t.activity}`).join(', ') || 'No time log'}

Create a JSON response with:
- summary: A thoughtful 2-3 paragraph summary written in first person ("I") about how my day went
- highlights: Key positive moments and achievements written in first person as a single string with bullet points (use • for each point, separated by newlines)
- moodTheme: Overall mood theme for the day (one phrase)
- productivityScore: Score 1-10 based on task completion and time usage`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert life coach and wellness analyst writing first-person reflections. Write as if you are the person reflecting on their own day, using 'I' statements throughout. Analyze daily activities with empathy and insight, focusing on growth and positive reinforcement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      summary: result.summary || "No summary available",
      highlights: result.highlights || "No highlights identified",
      moodTheme: result.moodTheme || "Neutral",
      productivityScore: Math.max(1, Math.min(10, parseInt(result.productivityScore) || 5))
    };
  } catch (error) {
    console.error("Failed to generate daily summary:", error);
    throw new Error("Failed to generate daily summary");
  }
}
