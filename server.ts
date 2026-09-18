import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY environment variable is missing. Please configure it in your settings/secrets."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasKey: Boolean(process.env.GEMINI_API_KEY),
      model: "gemini-3.8-flash",
    });
  });

  // Chat completion endpoint supporting streaming SSE and JSON fallback
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, stream = true } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "Invalid messages payload. Array required." });
        return;
      }

      // Convert messages to Gemini format
      // Note: Gemini roles are 'user' and 'model'
      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const ai = getGeminiClient();

      const systemInstruction =
        "You are AUS AI, an intelligent, friendly, and helpful AI assistant. " +
        "You communicate with clarity, warmth, and thoughtful insight. " +
        "You assist users with answering questions, problem-solving, brainstorming, coding, writing, and explanations. " +
        "Format your responses nicely using clean Markdown (such as headings, bullet points, and code blocks) when appropriate. " +
        "Always be welcoming, supportive, and respectful.";

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders?.();

        const responseStream = await ai.models.generateContentStream({
          model: "gemini-3.8-flash",
          contents: formattedContents,
          config: {
            systemInstruction,
          },
        });

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        res.write("data: [DONE]\n\n");
        res.end();
      } else {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: formattedContents,
          config: {
            systemInstruction,
          },
        });

        res.json({ reply: response.text ?? "" });
      }
    } catch (error: any) {
      console.error("Error in /api/chat:", error);
      const errorMessage =
        error?.message || "An unexpected error occurred while communicating with Gemini.";

      // If headers were already sent (e.g. SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AUS AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
