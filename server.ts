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
    if (!key) throw new Error("GEMINI_API_KEY environment variable is required.");
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json({ limit: "50mb" }));

  // ─── 1. GERAR POSTS ────────────────────────────────────────────────────────
  app.post("/api/generate-posts", async (req, res) => {
    try {
      const { idea, tone, language = "pt-BR", extraInstructions = "" } = req.body;
      if (!idea) return res.status(400).json({ error: "Ideia é obrigatória." });

      const client = getGeminiClient();

      const toneMap: Record<string, string> = {
        professional: "profissional, estruturado e corporativo",
        witty: "perspicaz, divertido e conversacional",
        urgent: "urgente, direto e com CTAs fortes",
        inspirational: "inspirador, emotivo e motivacional",
        educational: "educativo, claro e informativo"
      };
      const toneDesc = toneMap[tone] || toneMap.professional;

      const prompt = `Você é um estrategista sênior de mídias sociais e redator de alto desempenho.
Analise a ideia abaixo e crie posts excepcionais para LinkedIn, Twitter/X e Instagram simultaneamente.
Tom desejado: ${toneDesc}
${extraInstructions ? `Instruções extras: ${extraInstructions}` : ""}

IDIOMA: Todo o conteúdo dos posts (linkedin, twitter, instagram) DEVE ser em ${language === "pt-BR" ? "Português do Brasil" : language}.
Os prompts de imagem (linkedinImagePrompt, twitterImagePrompt, instagramImagePrompt) DEVEM ser em inglês.

Ideia: "${idea}"

Diretrizes por plataforma:

1. LinkedIn:
   - Formato longo e profissional
   - Hook inicial envolvente sobre carreira/negócios
   - Parágrafos, espaçamentos e bullet points limpos
   - Conclusão com insight profissional
   - 3 a 5 hashtags relevantes da indústria
   - linkedinImagePrompt: visual profissional e minimalista

2. Twitter/X:
   - MÁXIMO 280 caracteres (obrigatório)
   - Hook poderoso e emocional
   - Alto potencial de engajamento
   - twitterImagePrompt: visual vibrante e de alto contraste

3. Instagram:
   - Caption visual e narrativa
   - Emojis orgânicos intercalados
   - Parágrafos bem espaçados
   - Bloco final com 8 a 15 hashtags relevantes
   - instagramImagePrompt: qualidade fotográfica editorial

Responda SOMENTE com o JSON, sem comentários ou markdown.
Campos obrigatórios: linkedin, linkedinImagePrompt, twitter, twitterImagePrompt, instagram, instagramImagePrompt, suggestedHashtags (array com 10 hashtags gerais da campanha).`;

      const response = await client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              linkedin: { type: Type.STRING },
              linkedinImagePrompt: { type: Type.STRING },
              twitter: { type: Type.STRING },
              twitterImagePrompt: { type: Type.STRING },
              instagram: { type: Type.STRING },
              instagramImagePrompt: { type: Type.STRING },
              suggestedHashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["linkedin", "linkedinImagePrompt", "twitter", "twitterImagePrompt", "instagram", "instagramImagePrompt", "suggestedHashtags"]
          }
        }
      });

      const bodyText = response.text?.trim() || "{}";
      res.json(JSON.parse(bodyText));

    } catch (err: any) {
      console.error("Erro ao gerar posts:", err);
      res.status(500).json({ error: err.message || "Falha ao gerar conteúdo." });
    }
  });

  // ─── 2. GERAR IMAGEM (Pollinations.ai — grátis, sem key) ───────────────────
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio = "1:1", style = "realistic" } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt é obrigatório." });

      // Dimensões baseadas no aspect ratio
      const dimensionMap: Record<string, { width: number; height: number }> = {
        "1:1":  { width: 1024, height: 1024 },
        "16:9": { width: 1280, height: 720  },
        "9:16": { width: 720,  height: 1280 },
        "4:3":  { width: 1024, height: 768  },
        "3:4":  { width: 768,  height: 1024 },
        "3:2":  { width: 1200, height: 800  },
        "2:3":  { width: 800,  height: 1200 },
        "21:9": { width: 1280, height: 549  }
      };

      const { width, height } = dimensionMap[aspectRatio] || dimensionMap["1:1"];

      // Estilos visuais disponíveis
      const styleMap: Record<string, string> = {
        realistic: "photorealistic, high quality, professional photography",
        illustration: "digital illustration, flat design, modern vector art",
        cinematic: "cinematic lighting, dramatic atmosphere, film photography",
        minimal: "minimalist, clean white background, simple elegant design",
        "3d": "3D render, octane render, high detail, studio lighting"
      };

      const stylePrompt = styleMap[style] || styleMap.realistic;
      const fullPrompt = encodeURIComponent(`${prompt}, ${stylePrompt}`);
      const seed = Math.floor(Math.random() * 999999);

      // URL da Pollinations.ai
      const imageUrl = `https://image.pollinations.ai/prompt/${fullPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;

      // Verificar se a imagem foi gerada com sucesso
      const checkResponse = await fetch(imageUrl, { method: "HEAD" });

      if (checkResponse.ok) {
        res.json({
          imageUrl,
          width,
          height,
          seed,
          isFallback: false
        });
      } else {
        throw new Error("Pollinations não respondeu correctamente.");
      }

    } catch (err: any) {
      console.error("Erro ao gerar imagem:", err);
      // Fallback seguro
      const seed = Math.floor(Math.random() * 9999);
      res.json({
        imageUrl: `https://picsum.photos/seed/${seed}/1024/1024`,
        isFallback: true,
        fallbackMessage: "Usando imagem de demonstração. Tente novamente em instantes."
      });
    }
  });

  // ─── 3. REFORMULAR POST (novo) ─────────────────────────────────────────────
  app.post("/api/rewrite-post", async (req, res) => {
    try {
      const { text, platform, instruction } = req.body;
      if (!text || !platform) return res.status(400).json({ error: "Texto e plataforma são obrigatórios." });

      const client = getGeminiClient();

      const prompt = `Você é um especialista em redação para redes sociais.
Reescreva o seguinte post de ${platform} conforme a instrução abaixo.
Mantenha o idioma original do texto.
${instruction ? `Instrução: ${instruction}` : "Melhore o engajamento e clareza."}
${platform === "twitter" ? "IMPORTANTE: Mantenha sob 280 caracteres." : ""}

Post original:
"${text}"

Responda SOMENTE com o texto reescrito, sem explicações.`;

      const response = await client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });

      res.json({ rewritten: response.text?.trim() || text });

    } catch (err: any) {
      console.error("Erro ao reformular:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── 4. GERAR HASHTAGS (novo) ──────────────────────────────────────────────
  app.post("/api/generate-hashtags", async (req, res) => {
    try {
      const { idea, platform, count = 15 } = req.body;
      if (!idea) return res.status(400).json({ error: "Ideia é obrigatória." });

      const client = getGeminiClient();

      const prompt = `Gere ${count} hashtags relevantes e de alto desempenho para ${platform || "redes sociais"} sobre: "${idea}".
Misture hashtags populares e de nicho.
Responda SOMENTE com um array JSON de strings. Exemplo: ["#marketing", "#ia"]`;

      const response = await client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const raw = response.text?.trim() || "[]";
      res.json({ hashtags: JSON.parse(raw) });

    } catch (err: any) {
      console.error("Erro ao gerar hashtags:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── 5. ANALISAR POST (novo) ───────────────────────────────────────────────
  app.post("/api/analyze-post", async (req, res) => {
    try {
      const { text, platform } = req.body;
      if (!text) return res.status(400).json({ error: "Texto é obrigatório." });

      const client = getGeminiClient();

      const prompt = `Analise este post de ${platform || "redes sociais"} e dê uma pontuação de 0-100 para cada critério.

Post: "${text}"

Responda SOMENTE com JSON com estes campos:
- score (número 0-100 geral)
- engagement (número 0-100)
- clarity (número 0-100)
- hookStrength (número 0-100)
- ctaStrength (número 0-100)
- suggestions (array de 3 sugestões de melhoria em português)`;

      const response = await client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              engagement: { type: Type.NUMBER },
              clarity: { type: Type.NUMBER },
              hookStrength: { type: Type.NUMBER },
              ctaStrength: { type: Type.NUMBER },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const raw = response.text?.trim() || "{}";
      res.json(JSON.parse(raw));

    } catch (err: any) {
      console.error("Erro ao analisar:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ─── VITE / STATIC ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Servidor a correr em http://localhost:${PORT}`);
  });
}

startServer();
