
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AnalysisResponse } from '../types';


const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  console.warn("VITE_API_KEY environment variable is not set. Gemini API calls will fail.");
}


if (!API_KEY) {
  console.warn("API_KEY environment variable is not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Fallback to prevent crash
const modelName = 'gemini-2.5-flash-preview-04-17';

const generateAnalysisPrompt = (feedbackText: string): string => {
  return `
You are an expert AI assistant specialized in analyzing employee feedback.
Your task is to process the provided employee feedback text (which may have been transcribed from audio) and return a JSON object with the following exact structure and data types:

{
  "sentiment": "string (Enum: Positive, Negative, Neutral, or Mixed)",
  "intensity": "number (Float between 0.0 for no emotion and 1.0 for very strong emotion)",
  "summary": "string (A concise one or two sentence summary of the main points in the feedback)",
  "moderation": {
    "action": "string (Enum: Allow, Block, or Request Rephrasing)",
    "reason": "string (A brief explanation for the moderation action. If 'Allow', state why it's acceptable.)"
  },
  "actionable_insight": "string (A specific, actionable suggestion or follow-up for HR based on the feedback. Be constructive.)"
}

Ensure the 'intensity' is a numerical value.
Ensure the 'summary' is brief and captures the essence.
For 'moderation.action', strictly use one of the three enum values.
For 'moderation.reason', be concise.
For 'actionable_insight', provide a concrete step HR can consider.

Analyze the following employee feedback text:
\`\`\`
${feedbackText}
\`\`\`

Respond ONLY with the JSON object described above. Do not include any markdown formatting like \`\`\`json or any other text or explanations outside the JSON structure itself.
The entire response should be a single, valid JSON object.
`;
};

export const analyzeFeedback = async (feedbackText: string): Promise<AnalysisResponse> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured. Please set the API_KEY environment variable.");
  }
  
  const prompt = generateAnalysisPrompt(feedbackText);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr);
      if (
        typeof parsedData.sentiment !== 'string' ||
        typeof parsedData.intensity !== 'number' ||
        typeof parsedData.summary !== 'string' ||
        typeof parsedData.moderation !== 'object' ||
        typeof parsedData.moderation.action !== 'string' ||
        typeof parsedData.moderation.reason !== 'string' ||
        typeof parsedData.actionable_insight !== 'string'
      ) {
        console.error("Parsed JSON does not match expected structure:", parsedData);
        throw new Error("Received malformed analysis data from API.");
      }
      return parsedData as AnalysisResponse;
    } catch (parseError) {
      console.error("Failed to parse JSON response from Gemini:", parseError);
      console.error("Original string from Gemini:", response.text);
      throw new Error(`Failed to parse analysis data. Raw response: ${response.text.substring(0,100)}...`);
    }

  } catch (error) {
    console.error("Error calling Gemini API for analysis:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
         throw new Error("Invalid API Key for analysis. Please check your API_KEY environment variable.");
    }
    throw new Error("Failed to get analysis from Gemini API.");
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]); // Get base64 part
      } else {
        reject(new Error("Failed to read blob as base64 string."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured. Please set the API_KEY environment variable.");
  }

  try {
    const base64Audio = await blobToBase64(audioBlob);
    
    const audioPart = {
      inlineData: {
        mimeType: audioBlob.type || 'audio/webm', // Use blob's type or fallback
        data: base64Audio,
      },
    };
    const textPart = { text: "Transcribe the following audio recording accurately. Return only the transcribed text, with no additional commentary or formatting." };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName, // Using the same multimodal model
        contents: { parts: [audioPart, textPart] },
        // config: { temperature: 0.1 } // Optional: Lower temp for more literal transcription
    });

    return response.text.trim();

  } catch (error) {
    console.error("Error calling Gemini API for transcription:", error);
     if (error instanceof Error && error.message.includes("API key not valid")) {
         throw new Error("Invalid API Key for transcription. Please check your API_KEY environment variable.");
    }
    throw new Error("Failed to transcribe audio using Gemini API.");
  }
};
