import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function mapSkillsToProblems(skills: string[], problemDescription: string) {
  const prompt = `As an expert volunteer coordinator for NGOs in India, help me map these volunteer skills to the following problem description.
  
  Skills available: ${skills.join(", ")}
  Problem: ${problemDescription}
  
  Return a JSON object suggesting how these skills can be utilized.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                skill: { type: Type.STRING },
                howItHelps: { type: Type.STRING },
                impactLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
              },
              required: ["skill", "howItHelps", "impactLevel"]
            }
          },
          summary: { type: Type.STRING }
        },
        required: ["suggestions", "summary"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
