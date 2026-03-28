import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const aiService = {
  /**
   * Generates a viral caption for a post based on its content or image description.
   */
  async generateCaption(description: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a viral, engaging social media caption for this: ${description}. Include emojis.`,
    });
    return response.text || "";
  },

  /**
   * Generates trending hashtags based on the post content.
   */
  async generateHashtags(content: string): Promise<string[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 10 trending and relevant hashtags for this social media post: ${content}. Return only the hashtags separated by spaces.`,
    });
    const text = response.text || "";
    return text.split(' ').filter(tag => tag.startsWith('#'));
  },

  /**
   * Analyzes an image or video description and suggests improvements.
   */
  async suggestContentImprovements(description: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert content creator. Analyze this post description and suggest 3 ways to make it more viral or visually appealing: ${description}`,
    });
    return response.text || "";
  },

  /**
   * Auto-moderates content for spam, abuse, or fake info.
   */
  async moderateContent(content: string): Promise<{ isSafe: boolean; reason?: string }> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this social media content for spam, abuse, hate speech, or fake news: "${content}". 
      Return a JSON object with "isSafe" (boolean) and "reason" (string if not safe).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["isSafe"]
        }
      }
    });
    try {
      return JSON.parse(response.text || '{"isSafe": true}');
    } catch {
      return { isSafe: true };
    }
  },

  /**
   * Generates auto-subtitles for a video description (mocking voice-to-text).
   */
  async generateSubtitles(description: string): Promise<{ start: number; end: number; text: string }[]> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of subtitles with timestamps for a 15-second video based on this description: ${description}. 
      Return a JSON array of objects with "start" (number), "end" (number), and "text" (string).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.NUMBER },
              end: { type: Type.NUMBER },
              text: { type: Type.STRING }
            },
            required: ["start", "end", "text"]
          }
        }
      }
    });
    try {
      return JSON.parse(response.text || "[]");
    } catch {
      return [];
    }
  }
};
