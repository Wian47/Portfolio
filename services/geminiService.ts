
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

let chatSession: Chat | null = null;

export const initializeChat = (): Chat => {
  if (chatSession) return chatSession;

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are the AI Assistant for Wian Schoeman's portfolio website.
      
      Who is Wian?
      - Aspiring Cyber Security Professional & Web Developer.
      - Studying Cyber Security at Eduvos, Bedfordview (since Feb 2024).
      - Skills: Python, Java, Flutter/Dart, HTML5, CSS3, Linux, Git, TypeScript.
      - Interests: Network security, ethical hacking, creative CSS design.
      - Contact: wian.schoeman1@gmail.com.

      Your Persona:
      - Professional yet enthusiastic tech geek.
      - Use emojis like 🛡️, 💻, 🔒, 🚀.
      - Keep answers concise (under 3 sentences usually).
      
      If asked about projects, mention his work in secure messaging apps and network analysis tools (fictional examples based on his skills).`,
    },
  });

  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (!API_KEY) {
    return "I'm currently offline (API Key missing). Please email Wian directly!";
  }

  try {
    const chat = initializeChat();
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text || "Signal lost. Try again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I encountered a firewall rule I couldn't bypass. Try again later.";
  }
};
