import React, { useState, useEffect } from "react";
import {
  Sparkles, HelpCircle, Check, Copy, Download, RefreshCw,
  Loader2, AlertCircle, Maximize2, Grid, Layers, FileEdit,
  Image as ImageIcon, CheckCircle2, X, Play, Wand2, Hash,
  BarChart2, ChevronDown, ChevronUp, Globe, Lightbulb
} from "lucide-react";
import { Tone, SocialPosts, PlatformConfig, AspectRatioType, ImageSizeType, ModelQualityType } from "./types";
import { ToneSelector, PlatformBranding, ImageControls, ContentTools } from "./components/SocialGeneratorUI";

// ─── TIPOS EXTRAS ────────────────────────────────────────────────────────────
interface PostAnalysis {
  score: number;
  engagement: number;
  clarity: number;
  hookStrength: number;
  ctaStrength: number;
  suggestions: string[];
}

const IMAGE_STYLES = [
  { value: "realistic",     label: "Fotorrealista" },
  { value: "illustration",  label: "Ilustração" },
  { value: "cinematic",     label: "Cinematográfico" },
  { value: "minimal",       label: "Minimalista" },
  { value: "3d",            label: "3D Render" }
];

const LANGUAGES = [
  { value: "pt-BR", label: "Português (BR)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Español" },
  { value: "fr-FR", label: "Français" }
];

const EXTRA_TONES: { value: Tone; label: string }[] = [
  { value: "inspirational", label: "Inspiracional" },
  { value: "educational",   label: "Educativo" }
];

// ─── COMPONENTE ANÁLISE ──────────────────────────────────────────────────────
function AnalysisBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "bg-emerald-500" : value >= 50 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] font-semibold text-slate-500">
        <span>{label}</span><span>{value}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ───────────────────────────────────────────────────────────
export default function App() {
  const [idea, setIdea]                   = useState("");
  const [tone, setTone]                   = useState<Tone>("professional");
  const [language, setLanguage]           = useState("pt-BR");
  const [extraInstructions, setExtra]     = useState("");
  const [showAdvanced, setShowAdvanced]   = useState(false);
  const [isGeneratingPosts, setIsGen]     = useState(false);
  const [posts, setPosts]                 = useState<SocialPosts | null>(null);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [globalError, setGlobalError]     = useState<string | null>(null);
  const [successToast, setSuccessToast]   = useState<string | null>(null);
  const [viewMode, setViewMode]           = useState<"grid" | "linkedin" | "twitter" | "instagram">("grid");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; platform: string; prompt: string } | null>(null);

  // Análise de posts
  const [analyses, setAnalyses] = useState<Record<string, PostAnalysis | null>>({
    linkedin: null, twitter: null, instagram: null
  });
  const [analyzingPlatform, setAnalyzingPlatform] = useState<string | null>(null);

  // Reescrita de posts
  const [rewriteInstruction, setRewriteInstruction] = useState<Record<string, string>>({
    linkedin: "", twitter: "", instagram: ""
  });
  const [rewritingPlatform, setRewritingPlatform] = useState<string | null>(null);

  // Hashtags por plataforma
  const [platformHashtags, setPlatformHashtags] = useState<Record<string, string[]>>({
    linkedin: [], twitter: [], instagram: []
  });
  const [generatingHashtags, setGeneratingHashtags] = useState<string | null>(null);

  const [platformConfigs, setPlatformConfigs] = useState<{
    linkedin: PlatformConfig; twitter: PlatformConfig; instagram: PlatformConfig;
  }>({
    linkedin:  { aspectRatio: "4:3",  size: "1K", quality: "fast", isGeneratingImage: false, imageUrl: null, imagePrompt: "", imageError: null, imageStyle: "realistic" },
    twitter:   { aspectRatio: "16:9", size: "1K", quality: "fast", isGeneratingImage: false, imageUrl: null, imagePrompt: "", imageError: null, imageStyle: "realistic" },
    instagram: { aspectRatio: "1:1",  size: "1K", quality: "fast", isGeneratingImage: false, imageUrl: null, imagePrompt: "", imageError: null, imageStyle: "realistic" }
  });

  const campaignIdeas = [
    { label: "Garrafa Ecológica",        text: "Lançamento de uma garrafa de água de bioplástico que se decompõe naturalmente em 90 dias. Estética moderna, tampa esportiva premium, tons pastéis." },
    { label: "SaaS Automações IA",       text: "Novo recurso de automação inteligente que elimina processos manuais. Economize até 12 horas semanais. Configuração rápida sem código." },
    { label: "Vaga: Director de Design", text: "Vaga para Designer de Produto Líder experiente. Liderança de interfaces colaborativas em tempo real. Regime totalmente remoto." }
  ];

  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successToast]);

  // ── Gerar campanha completa ─────────────────────────────────────────────────
  const startCampaignGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) { setGlobalError("Digite ou selecione uma ideia primeiro."); return; }

    setGlobalError(null);
    setIsGen(true);
    setPosts(null);
    setSuggestedHashtags([]);
    setAnalyses({ linkedin: null, twitter: null, instagram: null });
    setPlatformConfigs(prev => ({
      linkedin:  { ...prev.linkedin,  imageUrl: null, imageError: null, isGeneratingImage: false },
      twitter:   { ...prev.twitter,   imageUrl: null, imageError: null, isGeneratingImage: false },
      instagram: { ...prev.instagram, imageUrl: null, imageError: null, isGeneratingImage: false }
    }));

    try {
      const res = await fetch("/api/generate-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, tone, language, extraInstructions })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data: SocialPosts & { suggestedHashtags?: string[] } = await res.json();
      setPosts(data);
      if (data.suggestedHashtags) setSuggestedHashtags(data.suggestedHashtags);
      setIsGen(false);

      const updated = {
        linkedin:  { ...platformConfigs.linkedin,  imagePrompt: data.linkedinImagePrompt,  isGeneratingImage: true, imageUrl: null, imageError: null },
        twitter:   { ...platformConfigs.twitter,   imagePrompt: data.twitterImagePrompt,   isGeneratingImage: true, imageUrl: null, imageError: null },
        instagram: { ...platformConfigs.instagram, imagePrompt: data.instagramImagePrompt, isGeneratingImage: true, imageUrl: null, imageError: null }
      };
      setPlatformConfigs(updated);
      generateImage("linkedin",  data.linkedinImagePrompt,  updated.linkedin);
      generateImage("twitter",   data.twitterImagePrompt,   updated.twitter);
      generateImage("instagram", data.instagramImagePrompt, updated.instagram);

    } catch (err: any) {
      setGlobalError(err.message || "Erro inesperado ao gerar campanha.");
      setIsGen(false);
    }
  };

  // ── Gerar imagem individual ─────────────────────────────────────────────────
  const generateImage = async (
    platform: "linkedin" | "twitter" | "instagram",
    customPrompt?: string,
    passedConfig?: PlatformConfig
  ) => {
    const cfg    = passedConfig || platformConfigs[platform];
    const prompt = customPrompt !== undefined ? customPrompt : cfg.imagePrompt;
    if (!prompt.trim()) {
      setPlatformConfigs(prev => ({ ...prev, [platform]: { ...prev[platform], imageError: "Prompt vazio.", isGeneratingImage: false } }));
      return;
    }
    setPlatformConfigs(prev => ({ ...prev, [platform]: { ...prev[platform], isGeneratingImage: true, imageError: null } }));
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio: cfg.aspectRatio, style: cfg.imageStyle || "realistic" })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setPlatformConfigs(prev => ({
        ...prev,
        [platform]: { ...prev[platform], imageUrl: data.imageUrl, isGeneratingImage: false, imageError: null, isFallback: data.isFallback, fallbackMessage: data.fallbackMessage }
      }));
    } catch (err: any) {
      setPlatformConfigs(prev => ({ ...prev, [platform]: { ...prev[platform], imageError: err.message, isGeneratingImage: false } }));
    }
  };

  // ── Analisar post ───────────────────────────────────────────────────────────
  const analyzePost = async (platform: "linkedin" | "twitter" | "instagram") => {
    if (!posts?.[platform]) return;
    setAnalyzingPlatform(platform);
    try {
      const res = await fetch("/api/analyze-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: posts[platform], platform })
      });
      const data: PostAnalysis = await res.json();
      setAnalyses(prev => ({ ...prev, [platform]: data }));
    } catch (err) { console.error(err); }
    setAnalyzingPlatform(null);
  };

  // ── Reescrever post ─────────────────────────────────────────────────────────
  const rewritePost = async (platform: "linkedin" | "twitter" | "instagram") => {
    if (!posts?.[platform]) return;
    setRewritingPlatform(platform);
    try {
      const res = await fetch("/api/rewrite-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: posts[platform], platform, instruction: rewriteInstruction[platform] })
      });
      const data = await res.json();
      setPosts(prev => prev ? { ...prev, [platform]: data.rewritten } : null);
      setSuccessToast(`Post do ${platform} reescrito com sucesso!`);
    } catch (err) { console.error(err); }
    setRewritingPlatform(null);
  };

  // ── Gerar hashtags por plataforma ───────────────────────────────────────────
  const generateHashtags = async (platform: "linkedin" | "twitter" | "instagram") => {
    if (!idea.trim()) return;
    setGeneratingHashtags(platform);
    try {
      const res = await fetch("/api/generate-hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, platform, count: 15 })
      });
      const data = await res.json();
      setPlatformHashtags(prev => ({ ...prev, [platform]: data.hashtags || [] }));
    } catch (err) { console.error(err); }
    setGeneratingHashtags(null);
  };

  const updatePostText  = (p: "linkedin" | "twitter" | "instagram", v: string) => setPosts(prev => prev ? { ...prev, [p]: v } : null);
  const updatePrompt    = (p: "linkedin" | "twitter" | "instagram", v: string) => setPlatformConfigs(prev => ({ ...prev, [p]: { ...prev[p], imagePrompt: v } }));
  const updateConfig    = <K extends keyof PlatformConfig>(p: "linkedin" | "twitter" | "instagram", f: K, v: PlatformConfig[K]) =>
    setPlatformConfigs(prev => ({ ...prev, [p]: { ...prev[p], [f]: v } }));

  const getAspectClass = (r: AspectRatioType) => ({
    "1:1": "aspect-square", "4:3": "aspect-[4/3]", "3:4": "aspect-[3/4]",
    "16:9": "aspect-[16/9]", "9:16": "aspect-[9/16]", "3:2": "aspect-[3/2]",
    "2:3": "aspect-[2/3]", "21:9": "aspect-[21/9]"
  }[r] || "aspect-video");

  const downloadImage = (url: string, name: string) => {
    const a = document.createElement("a"); a.href = url; a.download = `${name}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setSuccessToast(`Imagem do ${name} baixada!`);
  };

  const filteredPlatforms = () => viewMode === "grid"
    ? ["linkedin", "twitter", "instagram"] as const
    : [viewMode] as const;

  const platformLabel = (p: string) =>
    ({ linkedin: "LinkedIn", twitter: "Twitter / X", instagram: "Instagram" }[p] || p);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-indigo-600 selection:text-white">

      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm border border-slate-800">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-slate-800">SocialForge AI</h1>
              <p className="text-xs text-slate-500 font-semibold">Gerador de campanhas multiplaforma com IA</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Gemini 2.0 Flash + Pollinations.ai</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── PAINEL ESQUERDO ── */}
        <section className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              <h2 className="text-base font-bold font-display text-slate-800">Configuração da Campanha</h2>
            </div>

            <form onSubmit={startCampaignGeneration} className="space-y-4">

              {/* Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Sugestões Rápidas</label>
                <div className="flex flex-wrap gap-1.5">
                  {campaignIdeas.map((ci, i) => (
                    <button key={i} type="button" disabled={isGeneratingPosts}
                      onClick={() => setIdea(ci.text)}
                      className="text-[11px] bg-slate-50 hover:bg-slate-100 font-semibold text-slate-600 py-1.5 px-2.5 rounded-lg border border-slate-200/60 transition-all">
                      {ci.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ideia */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ideia / Tópico</label>
                  <span className="text-[10px] text-slate-400 font-semibold">{idea.length} chars</span>
                </div>
                <textarea rows={4} required disabled={isGeneratingPosts} value={idea}
                  onChange={e => setIdea(e.target.value)}
                  placeholder="Descreve o produto, serviço ou campanha..."
                  className="w-full text-sm rounded-lg border border-slate-300 p-3 bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none" />
              </div>

              {/* Tom */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tom de Escrita</label>
                <ToneSelector currentTone={tone} onChange={setTone} disabled={isGeneratingPosts} />
                {/* Tons extras */}
                <div className="flex gap-2">
                  {EXTRA_TONES.map(t => (
                    <button key={t.value} type="button" disabled={isGeneratingPosts}
                      onClick={() => setTone(t.value)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${tone === t.value ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opções avançadas */}
              <div>
                <button type="button" onClick={() => setShowAdvanced(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all">
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Opções Avançadas
                </button>
                {showAdvanced && (
                  <div className="mt-3 space-y-3 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                    {/* Idioma */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Globe size={11} /> Idioma dos Posts
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {LANGUAGES.map(l => (
                          <button key={l.value} type="button" onClick={() => setLanguage(l.value)}
                            className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all ${language === l.value ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Instruções extras */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Lightbulb size={11} /> Instruções Extras (opcional)
                      </label>
                      <textarea rows={2} value={extraInstructions} onChange={e => setExtra(e.target.value)}
                        placeholder="Ex: menciona o desconto de 50%, foca em PMEs..."
                        className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none" />
                    </div>
                  </div>
                )}
              </div>

              {/* Botão Gerar */}
              <button type="submit" disabled={isGeneratingPosts || !idea.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all shadow-sm ${
                  isGeneratingPosts || !idea.trim()
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99] cursor-pointer"
                }`}>
                {isGeneratingPosts
                  ? <><Loader2 size={16} className="animate-spin text-indigo-400" /><span>A gerar campanha...</span></>
                  : <><Play size={16} fill="currentColor" /><span>Gerar Campanha Completa</span></>}
              </button>
            </form>

            {globalError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" /><span>{globalError}</span>
              </div>
            )}
          </div>

          {/* Hashtags globais da campanha */}
          {suggestedHashtags.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Hash size={14} className="text-indigo-500" />
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hashtags da Campanha</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedHashtags.map((h, i) => (
                  <span key={i} className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold">{h}</span>
                ))}
              </div>
              <button type="button" onClick={async () => { await navigator.clipboard.writeText(suggestedHashtags.join(" ")); setSuccessToast("Hashtags copiadas!"); }}
                className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                <Copy size={11} /> Copiar todas
              </button>
            </div>
          )}
        </section>

        {/* ── PAINEL DIREITO ── */}
        <section className="lg:col-span-8 flex flex-col space-y-4">

          {/* Controlos de Vista */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1.5">Visualização:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {(["grid", "linkedin", "twitter", "instagram"] as const).map(v => (
                  <button key={v} type="button" onClick={() => setViewMode(v)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                      viewMode === v ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" : "text-slate-500 hover:text-slate-900"
                    }`}>
                    {v === "grid" ? <Grid size={13} /> : platformLabel(v)}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider pr-1.5">
              {posts ? "3 rascunhos prontos" : "Aguardando geração"}
            </div>
          </div>

          {/* Estado vazio */}
          {!posts && !isGeneratingPosts && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center space-y-5 flex-1 min-h-[400px] shadow-sm">
              <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                <Layers size={28} className="text-indigo-500" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-bold text-slate-800">Painel vazio</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Insere a tua ideia e clica em "Gerar Campanha Completa" para criar posts e imagens para todas as plataformas.</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {isGeneratingPosts && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center space-y-4 flex-1 min-h-[400px] shadow-sm">
              <Loader2 size={32} className="animate-spin text-indigo-600" />
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-slate-800">A orquestrar a campanha...</h3>
                <p className="text-xs text-slate-500 leading-relaxed">O Gemini está a criar posts personalizados para cada plataforma com hooks, CTAs e prompts visuais.</p>
              </div>
            </div>
          )}

          {/* Posts gerados */}
          {posts && (
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 xl:grid-cols-3" : "grid-cols-1"}`}>
              {filteredPlatforms().map(plat => {
                const cfg         = platformConfigs[plat];
                const contentText = posts[plat] || "";
                const analysis    = analyses[plat];
                const label       = platformLabel(plat);

                return (
                  <div key={plat} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

                    {/* Header da plataforma */}
                    <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PlatformBranding platform={plat} />
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{label}</h3>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {plat === "linkedin" ? "Profissional · longo" : plat === "twitter" ? "Até 280 caracteres" : "Visual · narrativo"}
                          </p>
                        </div>
                      </div>
                      <ContentTools text={contentText} onCopySuccess={() => setSuccessToast(`Post do ${label} copiado!`)} />
                    </div>

                    {/* Editor de texto */}
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-slate-500">
                          <FileEdit size={12} /> Texto
                        </label>
                        {plat === "twitter" && (
                          <span className={`text-[10px] font-bold ${contentText.length > 280 ? "text-red-500 animate-pulse" : "text-slate-500"}`}>
                            {contentText.length} / 280
                          </span>
                        )}
                      </div>
                      <textarea rows={6} value={contentText} onChange={e => updatePostText(plat, e.target.value)}
                        className="w-full text-xs font-sans text-slate-700 bg-slate-50/40 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-y" />

                      {/* Reescrever */}
                      <div className="mt-2 flex gap-2">
                        <input type="text" placeholder="Instrução para reescrever (opcional)..."
                          value={rewriteInstruction[plat]}
                          onChange={e => setRewriteInstruction(prev => ({ ...prev, [plat]: e.target.value }))}
                          className="flex-1 text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                        <button type="button" disabled={rewritingPlatform === plat} onClick={() => rewritePost(plat)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                          {rewritingPlatform === plat ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                          Reescrever
                        </button>
                      </div>
                    </div>

                    {/* Análise do post */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/30">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-slate-500">
                          <BarChart2 size={12} /> Análise com IA
                        </label>
                        <button type="button" disabled={analyzingPlatform === plat} onClick={() => analyzePost(plat)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all disabled:opacity-50">
                          {analyzingPlatform === plat ? <Loader2 size={10} className="animate-spin" /> : <BarChart2 size={10} />}
                          Analisar
                        </button>
                      </div>
                      {analysis && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-700">Score geral:</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${analysis.score >= 75 ? "bg-emerald-100 text-emerald-700" : analysis.score >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                              {analysis.score}/100
                            </span>
                          </div>
                          <AnalysisBar label="Engajamento"  value={analysis.engagement} />
                          <AnalysisBar label="Clareza"      value={analysis.clarity} />
                          <AnalysisBar label="Força do Hook" value={analysis.hookStrength} />
                          <AnalysisBar label="Força do CTA"  value={analysis.ctaStrength} />
                          {analysis.suggestions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sugestões:</p>
                              {analysis.suggestions.map((s, i) => (
                                <p key={i} className="text-[10px] text-slate-600 flex gap-1.5">
                                  <span className="text-indigo-400 font-bold shrink-0">→</span>{s}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Hashtags por plataforma */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-slate-500">
                          <Hash size={12} /> Hashtags
                        </label>
                        <button type="button" disabled={generatingHashtags === plat} onClick={() => generateHashtags(plat)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition-all disabled:opacity-50">
                          {generatingHashtags === plat ? <Loader2 size={10} className="animate-spin" /> : <Hash size={10} />}
                          Gerar
                        </button>
                      </div>
                      {platformHashtags[plat].length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {platformHashtags[plat].map((h, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                              onClick={async () => { await navigator.clipboard.writeText(h); setSuccessToast(`${h} copiado!`); }}>
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Secção de imagem */}
                    <div className="p-4 bg-slate-50/20 flex-1 flex flex-col space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-slate-500 mb-1.5">
                          <ImageIcon size={12} /> Prompt Visual
                        </label>
                        <textarea rows={2} value={cfg.imagePrompt} onChange={e => updatePrompt(plat, e.target.value)}
                          className="w-full text-[11px] font-sans text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none" />
                      </div>

                      {/* Estilo de imagem */}
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5 block">Estilo Visual</label>
                        <div className="flex flex-wrap gap-1">
                          {IMAGE_STYLES.map(s => (
                            <button key={s.value} type="button" onClick={() => updateConfig(plat, "imageStyle" as any, s.value)}
                              className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${(cfg as any).imageStyle === s.value ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border border-slate-200/60 p-3 rounded-xl bg-white space-y-3">
                        <ImageControls
                          aspectRatio={cfg.aspectRatio} size={cfg.size} quality={cfg.quality}
                          onRatioChange={r => updateConfig(plat, "aspectRatio", r)}
                          onSizeChange={s => updateConfig(plat, "size", s)}
                          onQualityChange={q => updateConfig(plat, "quality", q)}
                          disabled={cfg.isGeneratingImage} />
                        <button type="button" disabled={cfg.isGeneratingImage} onClick={() => generateImage(plat)}
                          className={`w-full text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${cfg.isGeneratingImage ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"}`}>
                          {cfg.isGeneratingImage
                            ? <><Loader2 size={13} className="animate-spin" /><span>A gerar imagem...</span></>
                            : <><RefreshCw size={13} /><span>{cfg.imageUrl ? "Regenerar Imagem" : "Gerar Imagem"}</span></>}
                        </button>
                      </div>

                      {/* Preview da imagem */}
                      <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 shadow-inner">
                        <div className={`w-full relative ${getAspectClass(cfg.aspectRatio)} flex items-center justify-center`}>
                          {cfg.isGeneratingImage ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-center space-y-2 p-4">
                              <Loader2 size={24} className="animate-spin text-slate-800" />
                              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Pollinations.ai a gerar...</div>
                            </div>
                          ) : cfg.imageError ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-red-50 text-center text-red-700 space-y-1.5">
                              <AlertCircle size={18} />
                              <div className="text-[10px] font-bold uppercase tracking-wider">Erro de Geração</div>
                              <div className="text-[9px] line-clamp-3 px-1">{cfg.imageError}</div>
                              <button type="button" onClick={() => generateImage(plat)} className="mt-1 text-[10px] font-semibold bg-white border border-red-200 hover:bg-red-100 px-2 py-0.5 rounded transition-all cursor-pointer">
                                Tentar Novamente
                              </button>
                            </div>
                          ) : cfg.imageUrl ? (
                            <>
                              <img src={cfg.imageUrl} alt={`Imagem para ${plat}`} className="w-full h-full object-cover select-none" />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 flex justify-between items-end opacity-0 hover:opacity-100 transition-all duration-200">
                                <span className="text-[10px] text-white/80 font-medium">{cfg.aspectRatio}</span>
                                <div className="flex gap-1">
                                  <button type="button" onClick={() => setLightboxImage({ url: cfg.imageUrl!, platform: label, prompt: cfg.imagePrompt })}
                                    className="p-1 px-1.5 bg-white/10 hover:bg-white/30 text-white rounded-md transition-all cursor-pointer">
                                    <Maximize2 size={12} />
                                  </button>
                                  <button type="button" onClick={() => downloadImage(cfg.imageUrl!, plat)}
                                    className="p-1 px-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-all cursor-pointer">
                                    <Download size={12} />
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-1.5 bg-gradient-to-br from-indigo-50 to-slate-100/50">
                              <ImageIcon size={20} className="text-indigo-400" />
                              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Sem imagem ainda</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}>
          <button type="button" className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all cursor-pointer"
            onClick={e => { e.stopPropagation(); setLightboxImage(null); }}>
            <X size={20} />
          </button>
          <div className="max-w-4xl w-full flex flex-col items-center space-y-4" onClick={e => e.stopPropagation()}>
            <div className="border border-slate-800 rounded-2xl overflow-hidden p-1 shadow-2xl">
              <img src={lightboxImage.url} alt={lightboxImage.platform} className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain" />
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl max-w-2xl w-full text-center space-y-2 backdrop-blur-md">
              <span className="inline-block px-2.5 py-1 bg-indigo-600 text-white text-[10px] tracking-widest font-bold uppercase rounded-md">{lightboxImage.platform}</span>
              <p className="text-xs text-slate-300 italic px-2 leading-relaxed">"{lightboxImage.prompt}"</p>
              <button type="button" onClick={() => downloadImage(lightboxImage.url, lightboxImage.platform.toLowerCase())}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md mx-auto">
                <Download size={13} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span>Powered by <b className="text-slate-600">Gemini 2.0 Flash</b> + <b className="text-slate-600">Pollinations.ai</b></span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <div>SocialForge AI • © 2026</div>
        </div>
      </footer>
    </div>
  );
                        }
