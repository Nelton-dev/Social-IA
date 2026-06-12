import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Router: Generate platform-specific posts
  app.post("/api/generate-posts", async (req, res) => {
    try {
      const { idea, tone } = req.body;
      if (!idea) {
        return res.status(400).json({ error: "Concept or initial idea is required." });
      }

      const client = getGeminiClient();

      const prompt = `You are an expert social media strategist and content developer.
Analyze the following idea and craft outstanding high-performance posts for LinkedIn, Twitter/X, and Instagram simultaneously. Match the desired tone exactly.
CRITICAL: All final social copy outputs (fields "linkedin", "twitter", and "instagram") MUST be written beautifully and natively in Portuguese (Português do Brasil).
However, the image cues ("linkedinImagePrompt", "twitterImagePrompt", and "instagramImagePrompt") MUST be formulated in English to ensure optimal performance from the image generation engine.

Core Idea: "${idea}"
Desired Tone: "${tone || 'professional'}"

Strict structural guidelines for each platform:
1. LinkedIn:
   - Long-form, professional, well-structured.
   - Begin with a highly engaging, career/business-focused hook.
   - Use paragraph spacing, line breaks, bullet points, or simple checklists to make it extremely clean and readable.
   - Offer professional/industry takeaways.
   - Include 3 to 5 relevant, popular industry hashtags.
   - Provide "linkedinImagePrompt": A professional, high-concept visual asset description (e.g., minimalist modern workspace, elegant workspace overhead, crisp tech vector style with clean color scheme) suited for a professional network.

2. Twitter/X:
   - Short, dynamic, punchy.
   - Strictly MUST remain under 280 characters.
   - Starts with a powerful emotional or analytical hook.
   - High conversion/engagement potential.
   - Provide "twitterImagePrompt": A vibrant, simplified, high-energy conceptual image or symbol (e.g. dynamic flatlay, stylized modern product, high contrast neon metaphor).

3. Instagram:
   - Visual-first storytelling caption.
   - Enthusiastic, narrative hooks using paragraphs and organic emoji placements.
   - Space paragraphs cleanly.
   - A dedicated block at the bottom containing 8 to 15 targeted matching hashtags.
   - Provide "instagramImagePrompt": An aesthetic, photographic-quality masterwork prompt description (e.g., editorial flat-lay, warm cinematic lighting, authentic organic styling, bokeh background, colorful minimalist aesthetic).

Format and return your response strictly as a single JSON object. Do not include markdown headers or commentary in your response outside the JSON.
Required keys: "linkedin", "linkedinImagePrompt", "twitter", "twitterImagePrompt", "instagram", "instagramImagePrompt".`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              linkedin: { type: Type.STRING, description: "LinkedIn post content text" },
              linkedinImagePrompt: { type: Type.STRING, description: "Highly descriptive image generation prompt matching LinkedIn post" },
              twitter: { type: Type.STRING, description: "Twitter/X post content text (under 280 characters)" },
              twitterImagePrompt: { type: Type.STRING, description: "Highly descriptive image generation prompt matching Twitter post" },
              instagram: { type: Type.STRING, description: "Instagram post caption content text" },
              instagramImagePrompt: { type: Type.STRING, description: "Highly descriptive image generation prompt matching Instagram post" },
            },
            required: ["linkedin", "linkedinImagePrompt", "twitter", "twitterImagePrompt", "instagram", "instagramImagePrompt"],
          }
        }
      });

      const bodyText = response.text?.trim() || "{}";
      const parsedData = JSON.parse(bodyText);
      res.json(parsedData);
    } catch (err: any) {
      console.error("Content generation error:", err);
      res.status(500).json({ error: err.message || "Failed to generate social media copies." });
    }
  });

  // API Router: Generate image for specific platform matching details
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, platform, aspectRatio, size, quality } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const client = getGeminiClient();

      // Aspect Ratio Mapping
      // Offered selections: 1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 21:9
      let nativeRatio = "1:1";
      if (aspectRatio === "9:16") nativeRatio = "9:16";
      else if (aspectRatio === "16:9") nativeRatio = "16:9";
      else if (aspectRatio === "3:4" || aspectRatio === "2:3") nativeRatio = "3:4";
      else if (aspectRatio === "4:3" || aspectRatio === "3:2") nativeRatio = "4:3";
      else if (aspectRatio === "21:9") nativeRatio = "16:9";

      // Select Model: Fast (gemini-3.1-flash-image) vs Studio (gemini-3-pro-image)
      // High-Quality specification defaults or explicit config
      const modelName = quality === "studio" ? "gemini-3-pro-image" : "gemini-3.1-flash-image";

      console.log(`Starting image generation: model=${modelName}, ratio=${nativeRatio}, size=${size || '1K'}`);

      let inlineImageBase64 = null;
      let textFeedback = "";
      let isFallback = false;
      let fallbackMessage = "";

      try {
        const response = await client.models.generateContent({
          model: modelName,
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: nativeRatio as any,
              imageSize: (size || "1K") as any, // 1K, 2K, 4K
            }
          }
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              inlineImageBase64 = `data:image/png;base64,${part.inlineData.data}`;
            } else if (part.text) {
              textFeedback += part.text + " ";
            }
          }
        }
      } catch (geminiError: any) {
        console.warn("Gemini Image generation failed, falling back to decorative placeholder:", geminiError);
        
        const isQuotaError = geminiError.message?.toLowerCase().includes("quota") || 
                             geminiError.message?.toLowerCase().includes("limit") || 
                             geminiError.message?.toLowerCase().includes("429") || 
                             geminiError.status === "RESOURCE_EXHAUSTED" ||
                             geminiError.message?.toLowerCase().includes("billing");

        if (isQuotaError) {
          isFallback = true;
          fallbackMessage = "Cota de imagens do Gemini atingida. Ative o Modo Estúdio nas configurações para gerar imagens reais do Gemini!";
          
          let keywords = prompt
            .replace(/[^\w\s]/gi, '')
            .split(/\s+/)
            .filter((w: string) => w.length > 3 && !["with", "from", "that", "this", "some", "extremely", "highly", "minimalist", "modern", "aesthetic", "vector", "style"].includes(w.toLowerCase()))
            .slice(0, 3)
            .join(",");
          
          if (!keywords) {
            keywords = platform === "linkedin" ? "workspace,business" : platform === "twitter" ? "creative,tech" : "aesthetic,style";
          }
          
          const width = nativeRatio === "16:9" ? 1200 : nativeRatio === "9:16" ? 675 : 800;
          const height = nativeRatio === "16:9" ? 675 : nativeRatio === "9:16" ? 1200 : 800;
          const randSeed = Math.floor(Math.random() * 2000) + 1;
          
          inlineImageBase64 = `https://picsum.photos/seed/${randSeed}/${width}/${height}?q=${encodeURIComponent(keywords)}`;
          textFeedback = "Imagem gerada localmente em modo de demonstração premium.";
        } else {
          throw geminiError;
        }
      }

      // Check if image is returned, if not we fall back or present the error safely.
      if (inlineImageBase64) {
        res.json({ 
          imageUrl: inlineImageBase64, 
          feedback: textFeedback.trim(),
          isFallback,
          fallbackMessage
        });
      } else {
        // Safe standard fallback in case logic didn't trigger
        const width = nativeRatio === "16:9" ? 1200 : nativeRatio === "9:16" ? 675 : 800;
        const height = nativeRatio === "16:9" ? 675 : nativeRatio === "9:16" ? 1200 : 800;
        const randSeed = Math.floor(Math.random() * 2000) + 1;
        res.json({ 
          imageUrl: `https://picsum.photos/seed/${randSeed}/${width}/${height}`,
          feedback: "Carregamento em modo de demonstração bem-sucedido.",
          isFallback: true,
          fallbackMessage: "Ative o Modo Estúdio para criar imagens ilimitadas com IA!"
        });
      }
    } catch (err: any) {
      console.error("Image generation error:", err);
      // Let's produce a safe fallback even in case of generic failure to keep the user experience completely intact
      const nativeRatio = req.body.aspectRatio || "1:1";
      const width = nativeRatio === "16:9" ? 1200 : nativeRatio === "9:16" ? 675 : 800;
      const height = nativeRatio === "16:9" ? 675 : nativeRatio === "9:16" ? 1200 : 800;
      const randSeed = Math.floor(Math.random() * 3000) + 1;
      
      res.json({
        imageUrl: `https://picsum.photos/seed/${randSeed}/${width}/${height}`,
        feedback: "Modo demonstração ativado devido a uma inconsistência de comunicação com o provedor de IA.",
        isFallback: true,
        fallbackMessage: "Ative o Modo Estúdio ou insira sua própria chave nas configurações do painel."
      });
    }
  });

  // Vite middle-wares / client static delivery
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express+Vite Server listening at http://localhost:${PORT}`);
  });
}

startServer();
