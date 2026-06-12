import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  Copy, 
  Download, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  Maximize2, 
  Grid, 
  Layers, 
  FileEdit, 
  Image as ImageIcon,
  CheckCircle2,
  X,
  Play,
  ThumbsUp,
  MessageSquare,
  Share2,
  Send,
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Eye,
  Settings,
  Sliders,
  User,
  MapPin,
  Lightbulb,
  Check,
  Smartphone,
  Globe
} from "lucide-react";
import { Tone, SocialPosts, PlatformConfig, AspectRatioType, ImageSizeType, ModelQualityType } from "./types";
import { ToneSelector, PlatformBranding, ImageControls, ContentTools } from "./components/SocialGeneratorUI";

export default function App() {
  // Campaign inputs state
  const [idea, setIdea] = useState<string>("");
  const [tone, setTone] = useState<Tone>("professional");
  const [isGeneratingPosts, setIsGeneratingPosts] = useState<boolean>(false);
  const [posts, setPosts] = useState<SocialPosts | null>(null);
  
  // Custom interactive mockup counts to feel professional
  const [likesCount, setLikesCount] = useState<Record<string, { liked: boolean; count: number }>>({
    linkedin: { liked: false, count: 48 },
    twitter: { liked: false, count: 184 },
    instagram: { liked: false, count: 326 }
  });

  const toggleMockLike = (platform: string) => {
    setLikesCount(prev => {
      const active = prev[platform];
      return {
        ...prev,
        [platform]: {
          liked: !active.liked,
          count: active.liked ? active.count - 1 : active.count + 1
        }
      };
    });
    setSuccessToast(`Engajado no simulador de feed do ${platform}!`);
  };

  // Switch subtab per platform between "edit" and "preview"
  const [platformTabs, setPlatformTabs] = useState<Record<string, "edit" | "preview">>({
    linkedin: "edit",
    twitter: "edit",
    instagram: "edit"
  });

  const setPlatformTab = (platform: "linkedin" | "twitter" | "instagram", tab: "edit" | "preview") => {
    setPlatformTabs(prev => ({ ...prev, [platform]: tab }));
  };

  // Quick test prompts to make exploration easy for the user
  const campaignIdeas = [
    { label: "🌱 Garrafa Ecológica", text: "Lançamento de uma garrafa de água de bioplástico revolucionária que se decompõe naturalmente em 90 dias. Estética minimalista e elegante, tampa esportiva premium, disponível em tons pastéis." },
    { label: "⚡ SaaS Automação IA", text: "Anúncio de ferramenta SaaS de automação que elimina processos manuais e repetitivos de entrada de dados. Economize até 12 horas semanais. Configuração rápida sem necessidade de código." },
    { label: "🎨 Diretor de Design", text: "Vaga para Designer de Produto Líder para liderar interfaces de ferramentas colaborativas digitais em tempo real. Regime remoto, foco extremo em estética e tipografia refinada." }
  ];

  // System general feedback alert
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Active platform layout layout: "grid" (columns) or focusing individual platforms: "linkedin" | "twitter" | "instagram"
  const [viewMode, setViewMode] = useState<"grid" | "linkedin" | "twitter" | "instagram">("grid");

  // Platform generation states
  const [platformConfigs, setPlatformConfigs] = useState<{
    linkedin: PlatformConfig;
    twitter: PlatformConfig;
    instagram: PlatformConfig;
  }>({
    linkedin: {
      aspectRatio: "4:3",
      size: "1K",
      quality: "fast",
      isGeneratingImage: false,
      imageUrl: null,
      imagePrompt: "",
      imageError: null
    },
    twitter: {
      aspectRatio: "16:9",
      size: "1K",
      quality: "fast",
      isGeneratingImage: false,
      imageUrl: null,
      imagePrompt: "",
      imageError: null
    },
    instagram: {
      aspectRatio: "1:1",
      size: "1K",
      quality: "fast",
      isGeneratingImage: false,
      imageUrl: null,
      imagePrompt: "",
      imageError: null
    }
  });

  // Lightbox component state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; platform: string; prompt: string } | null>(null);

  // Auto-fading notifications
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Handler to copy post contents
  const triggerCopyNotice = (platformName: string) => {
    setSuccessToast(`Post do ${platformName} copiado para a área de transferência!`);
  };

  // Select a preset idea
  const selectPreset = (text: string) => {
    setIdea(text);
    setSuccessToast("Diretriz carregada com sucesso.");
  };

  // Generate All social copies + Auto kick-off tailored visual generations
  const startCampaignGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      setGlobalError("Por favor, digite ou selecione uma ideia de campanha primeiro.");
      return;
    }

    setGlobalError(null);
    setIsGeneratingPosts(true);
    setPosts(null);

    // Reset old stats
    setPlatformConfigs(prev => ({
      linkedin: { ...prev.linkedin, imageUrl: null, imageError: null, isGeneratingImage: false, isFallback: false, fallbackMessage: "" },
      twitter: { ...prev.twitter, imageUrl: null, imageError: null, isGeneratingImage: false, isFallback: false, fallbackMessage: "" },
      instagram: { ...prev.instagram, imageUrl: null, imageError: null, isGeneratingImage: false, isFallback: false, fallbackMessage: "" }
    }));

    try {
      const response = await fetch("/api/generate-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, tone })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "O servidor falhou ao rascunhar as cópias de marketing.");
      }

      const campaignData: SocialPosts = await response.json();
      setPosts(campaignData);

      // Distribute the freshly generated visual prompts into platform configurations
      const updatedConfigs = {
        linkedin: {
          ...platformConfigs.linkedin,
          imagePrompt: campaignData.linkedinImagePrompt,
          imageUrl: null,
          imageError: null,
          isGeneratingImage: true
        },
        twitter: {
          ...platformConfigs.twitter,
          imagePrompt: campaignData.twitterImagePrompt,
          imageUrl: null,
          imageError: null,
          isGeneratingImage: true
        },
        instagram: {
          ...platformConfigs.instagram,
          imagePrompt: campaignData.instagramImagePrompt,
          imageUrl: null,
          imageError: null,
          isGeneratingImage: true
        }
      };

      setPlatformConfigs(updatedConfigs);
      setIsGeneratingPosts(false);

      // Trigger parallel visual rendering on backend asynchronously
      generateImageIndividual("linkedin", campaignData.linkedinImagePrompt, updatedConfigs.linkedin);
      generateImageIndividual("twitter", campaignData.twitterImagePrompt, updatedConfigs.twitter);
      generateImageIndividual("instagram", campaignData.instagramImagePrompt, updatedConfigs.instagram);

      // Auto flip view into preview for instantaneous feed feedback
      setPlatformTabs({ linkedin: "preview", twitter: "preview", instagram: "preview" });

    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Ocorreu um erro inesperado ao rascunhar cópias de campanha.");
      setIsGeneratingPosts(false);
    }
  };

  // Generate an individual platform's image
  const generateImageIndividual = async (
    platform: "linkedin" | "twitter" | "instagram",
    customPrompt?: string,
    passedConfig?: PlatformConfig
  ) => {
    const activeConfig = passedConfig || platformConfigs[platform];
    const targetPrompt = customPrompt !== undefined ? customPrompt : activeConfig.imagePrompt;

    if (!targetPrompt.trim()) {
      setPlatformConfigs(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          imageError: "O texto do prompt visual está vazio.",
          isGeneratingImage: false
        }
      }));
      return;
    }

    // Set loading indicator
    setPlatformConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        isGeneratingImage: true,
        imageError: null
      }
    }));

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: targetPrompt,
          platform: platform,
          aspectRatio: activeConfig.aspectRatio,
          size: activeConfig.size,
          quality: activeConfig.quality
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Falha ao renderizar imagem para ${platform}.`);
      }

      const data = await response.json();
      
      setPlatformConfigs(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          imageUrl: data.imageUrl,
          isGeneratingImage: false,
          imageError: null,
          isFallback: data.isFallback || false,
          fallbackMessage: data.fallbackMessage || ""
        }
      }));
    } catch (err: any) {
      console.error(`Image rendering failure [${platform}]:`, err);
      setPlatformConfigs(prev => ({
        ...prev,
        [platform]: {
          ...prev[platform],
          imageError: err.message || "A geração de imagem expirou ou falhou.",
          isGeneratingImage: false
        }
      }));
    }
  };

  // Handle post text changes from textareas directly (making it custom and modifiable)
  const updatePostText = (platform: "linkedin" | "twitter" | "instagram", val: string) => {
    if (!posts) return;
    setPosts(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [platform]: val
      };
    });
  };

  // Handle user typing directly inside the visual prompt input box
  const updateImagePrompt = (platform: "linkedin" | "twitter" | "instagram", val: string) => {
    setPlatformConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        imagePrompt: val
      }
    }));
  };

  // Formats specific fields in platform configs
  const updatePlatformConfigField = <K extends keyof PlatformConfig>(
    platform: "linkedin" | "twitter" | "instagram",
    field: K,
    value: PlatformConfig[K]
  ) => {
    setPlatformConfigs(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  // Dynamic Aspect ratio container style rendering (avoids squishing!)
  const getAspectClass = (ratio: AspectRatioType) => {
    switch (ratio) {
      case "1:1": return "aspect-square";
      case "4:3": return "aspect-[4/3]";
      case "3:4": return "aspect-[3/4]";
      case "16:9": return "aspect-[16/9]";
      case "9:16": return "aspect-[9/16]";
      case "3:2": return "aspect-[3/2]";
      case "2:3": return "aspect-[2/3]";
      case "21:9": return "aspect-[21/9]";
      default: return "aspect-video";
    }
  };

  // Direct trigger to download base64 generated image
  const downloadImageFile = (base64Data: string, platformName: string) => {
    const link = document.createElement("a");
    link.href = base64Data;
    link.download = `${platformName}_social_campaign_visual.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessToast(`Recurso visual do ${platformName} baixado com sucesso!`);
  };

  // Render separate views based on Tab settings selection
  const filteredPlatforms = () => {
    if (viewMode === "grid") {
      return ["linkedin", "twitter", "instagram"] as const;
    }
    return [viewMode] as const;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col antialiased font-sans text-slate-800">
      
      {/* Interactive Floating Toast notifications */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in transition-all">
          <Check className="text-emerald-400 shrink-0" size={14} strokeWidth={3} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Modern High-End Top Navigation Header */}
      <header className="border-b border-slate-205/80 bg-white/80 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-xs">
              <Sparkles size={16} fill="currentColor" className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold font-display tracking-tight text-slate-900">SocialForge Studio</h1>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">v2.1</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Suíte Premium para Criação e Publicação Multicanais Adaptada com IA</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200/60 p-2 rounded-lg">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>Workspace: Ativo</span>
              <span className="text-slate-300">|</span>
              <span className="text-indigo-600 font-bold uppercase text-[10px]">Gemini 3.5-Flash</span>
            </div>
          </div>

        </div>
      </header>

      {/* Primary Layout Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Control Column: Campaign Configuration (4 spans on lg screen) */}
        <section className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 md:p-6 space-y-5">
            
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-slate-900 rounded-full"></span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">Configuração de Campanha</h2>
            </div>

            <form onSubmit={startCampaignGeneration} className="space-y-5">
              
              {/* Sugestões de ideias */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Lightbulb size={12} className="text-indigo-500" />
                  <span>Diretrizes e Ideias de Exemplo</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {campaignIdeas.map((ideaPreset, index) => (
                    <button
                      key={index}
                      id={`preset-btn-${index}`}
                      type="button"
                      disabled={isGeneratingPosts}
                      onClick={() => selectPreset(ideaPreset.text)}
                      className="text-[11px] bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 border border-slate-200/80 transition-all text-slate-700 py-2 px-3 rounded-xl text-left font-medium cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate mr-3">{ideaPreset.label}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-800 transition-colors font-mono">Usar →</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tópico Principal / Ideia */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="idea-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foco ou Escopo do Produto</label>
                  <span className="text-[10px] text-slate-400 font-semibold">{idea.length} ch</span>
                </div>
                <textarea
                  id="idea-input"
                  rows={4}
                  required
                  disabled={isGeneratingPosts}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Ex: Novo relógio inteligente inovador construído de titânio escovado reciclado com visor holográfico avançado..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-slate-50/50 text-slate-705 placeholder-slate-400/80 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Tone Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tom de Escrita Desejado</label>
                <ToneSelector 
                  currentTone={tone} 
                  onChange={setTone} 
                  disabled={isGeneratingPosts} 
                />
              </div>

              {/* Submit Trigger - Premium Pulsing Dark Button */}
              <button
                id="generate-campaign-btn"
                type="submit"
                disabled={isGeneratingPosts || !idea.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
                  isGeneratingPosts 
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                    : !idea.trim()
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99] cursor-pointer hover:shadow-md hover:shadow-slate-100"
                }`}
              >
                {isGeneratingPosts ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-slate-400" />
                    <span>Redigindo & Ilustrando...</span>
                  </>
                ) : (
                  <>
                    <Play size={13} fill="currentColor" className="text-white" />
                    <span>Criar Pacote Multicanal</span>
                  </>
                )}
              </button>
            </form>

            {globalError && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{globalError}</span>
              </div>
            )}
          </div>

          {/* Quick instructions panel details */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <h3 className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <HelpCircle size={15} className="text-indigo-500" />
              <span>Instruções do Ateliê</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-500 font-sans leading-relaxed">
              <p>O <b>SocialForge Studio</b> integra ganchos emocionais da psicologia do marketing e gera campanhas inteligentes.</p>
              <ul className="space-y-2 pl-1.5">
                <li className="flex gap-2">
                  <span className="text-emerald-500 font-bold font-mono">✔</span>
                  <span>Copie os rascunhos refinados para suas redes.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-bold font-mono">★</span>
                  <span>Ajuste proporções e regere imagens individuais se necessário.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500 font-bold font-mono">✦</span>
                  <span>Visualize a simulação no feed para validar a estética.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Right Workspace Column: Core Drafting & Live Feeds (8 spans on lg screen) */}
        <section className="lg:col-span-8 flex flex-col space-y-5">
          
          {/* Workspace Filters & Tab switchers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider p-1">Selecionar Visualização:</span>
              <div className="flex bg-slate-50 border border-slate-200/60 p-1 rounded-xl">
                <button
                  id="view-grid-btn"
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    viewMode === "grid" 
                      ? "bg-slate-900 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Grid size={13} />
                  <span>Multicanais</span>
                </button>
                <button
                  id="view-tab-linkedin"
                  type="button"
                  onClick={() => setViewMode("linkedin")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    viewMode === "linkedin" 
                      ? "bg-[#0a66c2] text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>LinkedIn</span>
                </button>
                <button
                  id="view-tab-twitter"
                  type="button"
                  onClick={() => setViewMode("twitter")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    viewMode === "twitter" 
                      ? "bg-slate-950 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>X / Twitter</span>
                </button>
                <button
                  id="view-tab-instagram"
                  type="button"
                  onClick={() => setViewMode("instagram")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    viewMode === "instagram" 
                      ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>Instagram</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-slate-450 uppercase tracking-widest pl-1.5 text-right font-mono">
              {posts ? "⚡ Geração Concluída" : "Aguardando Ideia"}
            </div>
          </div>

          {/* Empty Workspace Board */}
          {!posts && !isGeneratingPosts ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 flex-1 min-h-[420px] shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-200/80 shadow-xs relative">
                <Layers size={26} className="text-slate-650" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping"></span>
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-bold text-slate-900">Seu Ateliê está pronto para criar</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Insira um foco ou mude de exemplo ao lado. O sistema irá articular as melhores estratégias e renderizar copias prontas, além de construir imagens simultâneas com IA específicas para as proporções de cada rede escolhida.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  id="setup-demo-btn"
                  type="button"
                  onClick={() => {
                    setIdea(campaignIdeas[0].text);
                    setTone("witty");
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm"
                >
                  Carregar Exemplo 🌱
                </button>
              </div>
            </div>
          ) : isGeneratingPosts ? (
            /* Running Generation Progress */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-5 flex-1 min-h-[420px] shadow-xs animate-pulse">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-450">
                <Loader2 size={32} className="animate-spin text-slate-800" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Compilando Cópias e Pixels</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  O Gemini 3.5-flash está moldando as redações de acordo com as regras de cada plataforma e gerando chaves visuais avançadas...
                </p>
              </div>
            </div>
          ) : (
            /* Active Studio Workspace with all platforms cards rendering */
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 xl:grid-cols-3" : "grid-cols-1"}`}>
              {filteredPlatforms().map((plat) => {
                const config = platformConfigs[plat];
                const contentText = posts ? posts[plat] : "";
                const activeTab = platformTabs[plat] || "edit";
                
                let titleLabel = "LinkedIn";
                let characterHint = "Conteúdo corporativo estratégico";
                let userHandle = "Nelton Ambate";
                let handleLabel = "@nelton_ambate";
                let userJobDesc = "Estrategista de Produtos Digitais & Growth";
                if (plat === "twitter") {
                  titleLabel = "Twitter / X";
                  characterHint = "Impacto sob 280 caracteres";
                } else if (plat === "instagram") {
                  titleLabel = "Instagram";
                  characterHint = "Estilo visual forte e hashtags";
                }

                return (
                  <div 
                    key={plat} 
                    id={`platform-block-${plat}`} 
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md"
                  >
                    {/* Header bar and Subtab controller */}
                    <div className="border-b border-slate-100 bg-slate-55 p-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <PlatformBranding platform={plat} />
                        <div>
                          <h3 className="text-xs font-bold text-slate-800">{titleLabel}</h3>
                          <p className="text-[9px] text-slate-400 font-medium">{characterHint}</p>
                        </div>
                      </div>

                      {/* Pill tabs switchers: Editar vs Visualizar */}
                      <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0">
                        <button
                          type="button"
                          onClick={() => setPlatformTab(plat, "edit")}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            activeTab === "edit"
                              ? "bg-white text-slate-800 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <FileEdit size={10} />
                            <span>Editor</span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlatformTab(plat, "preview")}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            activeTab === "preview"
                              ? "bg-slate-900 text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <Eye size={10} />
                            <span>Feed Real</span>
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* RENDER TAB: EDITOR */}
                    {activeTab === "edit" ? (
                      <div className="flex flex-col flex-1 divide-y divide-slate-100">
                        {/* Editor Textarea */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between text-slate-400">
                            <label className="text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 text-slate-500">
                              <FileEdit size={11} className="text-slate-400" />
                              <span>Rascunho de Texto</span>
                            </label>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-500">
                              {contentText.length} caracteres
                            </span>
                          </div>
                          
                          <textarea
                            id={`text-editor-${plat}`}
                            rows={6}
                            value={contentText}
                            onChange={(e) => updatePostText(plat, e.target.value)}
                            className="w-full text-xs font-sans text-slate-700 bg-slate-50/30 border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:bg-white transition-all resize-y leading-relaxed"
                            placeholder="Cópia de campanha não definida..."
                          />

                          <div className="flex justify-end pt-0.5">
                            <ContentTools 
                              text={contentText} 
                              onCopySuccess={() => triggerCopyNotice(titleLabel)} 
                            />
                          </div>
                        </div>

                        {/* Visual Prompt Section */}
                        <div className="p-4 bg-slate-50/20 space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 text-slate-550">
                              <ImageIcon size={11} className="text-indigo-400" />
                              <span>Diretriz Visual para a IA</span>
                            </label>
                            <textarea
                              id={`image-prompt-editor-${plat}`}
                              rows={2}
                              value={config.imagePrompt}
                              onChange={(e) => updateImagePrompt(plat, e.target.value)}
                              className="w-full text-[11px] font-sans text-slate-700 bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all resize-none leading-normal"
                              placeholder="Filtro estético ou descrição..."
                            />
                          </div>

                          {/* Image controls accordion wrapper */}
                          <div className="border border-slate-200/60 p-3 rounded-xl bg-white space-y-3">
                            <ImageControls
                              aspectRatio={config.aspectRatio}
                              size={config.size}
                              quality={config.quality}
                              onRatioChange={(r) => updatePlatformConfigField(plat, "aspectRatio", r)}
                              onSizeChange={(s) => updatePlatformConfigField(plat, "size", s)}
                              onQualityChange={(q) => updatePlatformConfigField(plat, "quality", q)}
                              disabled={config.isGeneratingImage}
                            />

                            <button
                              id={`btn-regenerate-${plat}`}
                              type="button"
                              disabled={config.isGeneratingImage}
                              onClick={() => generateImageIndividual(plat)}
                              className={`w-full text-[11px] font-bold h-9 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                config.isGeneratingImage
                                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                              }`}
                            >
                              {config.isGeneratingImage ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  <span>Compilando...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw size={11} />
                                  <span>{config.imageUrl ? "Regerar Imagem" : "Girar Imagem"}</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Visual asset wrapper */}
                          <div className="pt-2">
                            <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 flex items-center justify-center">
                              <div className={`w-full h-full relative ${getAspectClass(config.aspectRatio)} flex items-center justify-center transition-all duration-300`}>
                                {config.isGeneratingImage ? (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-slate-50 text-center space-y-1.5">
                                    <Loader2 size={20} className="animate-spin text-slate-800" />
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Desenhando Pixels...</div>
                                  </div>
                                ) : config.imageError ? (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-rose-50 text-center text-rose-700 space-y-1">
                                    <AlertCircle size={14} />
                                    <div className="text-[9px] line-clamp-2">{config.imageError}</div>
                                    <button
                                      type="button"
                                      onClick={() => generateImageIndividual(plat)}
                                      className="text-[8px] bg-white border border-rose-200 px-1.5 py-0.5 rounded"
                                    >
                                      Re-tentar
                                    </button>
                                  </div>
                                ) : config.imageUrl ? (
                                  <>
                                    <img
                                      src={config.imageUrl}
                                      alt="Tailored draft layout artwork"
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover select-none"
                                    />
                                    
                                    {config.isFallback && (
                                      <div className="absolute top-2 inset-x-2 bg-amber-500/95 text-white p-1 rounded font-medium text-[8px] flex items-center gap-1 select-none shadow z-10 text-left">
                                        <AlertCircle size={10} className="shrink-0" />
                                        <span>Modo Demonstração local ativo</span>
                                      </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 p-2 flex justify-between items-center opacity-0 hover:opacity-100 transition-all duration-150">
                                      <span className="text-[9px] text-white/90 font-mono font-bold">
                                        {config.size} • {config.aspectRatio}
                                      </span>
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setLightboxImage({ url: config.imageUrl!, platform: titleLabel, prompt: config.imagePrompt })}
                                          className="p-1 bg-white/20 hover:bg-white/40 text-white rounded transition-all cursor-pointer"
                                        >
                                          <Maximize2 size={10} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => downloadImageFile(config.imageUrl!, plat)}
                                          className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-all cursor-pointer"
                                        >
                                          <Download size={10} />
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-50/50">
                                    <ImageIcon size={16} className="text-slate-300 mb-1" />
                                    <span className="text-[9px] text-slate-400">Ajuste as diretrizes e clique em Gerar</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      /* RENDER TAB: REAL PLATFORM PREVIEW SIMULATION (FEED MODE) */
                      <div className="p-4 bg-slate-50 flex-1 flex flex-col justify-between font-sans">
                        
                        {/* Simulation Frame depending on the Social Network */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                          
                          {/* LINKEDIN POST SIMULATION CHASSIS */}
                          {plat === "linkedin" && (
                            <div className="p-3 text-left space-y-2.5 font-sans">
                              {/* LinkedIn Profile Area */}
                              <div className="flex items-start gap-2">
                                <div className="w-10 h-10 bg-slate-205 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-slate-700 border border-slate-200 font-mono uppercase bg-indigo-100 text-indigo-800 shadow-inner">
                                  NA
                                </div>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[12px] font-bold text-slate-900 hover:text-indigo-650 cursor-pointer">Nelton Ambate</span>
                                    <span className="text-[10px] text-slate-400 font-medium">• 1º</span>
                                  </div>
                                  <p className="text-[10px] text-slate-550 leading-tight truncate">
                                    {userJobDesc}
                                  </p>
                                  <p className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                                    <span>Agora</span>
                                    <span>•</span>
                                    <span>Editado</span>
                                    <span>•</span>
                                    <Globe size={9} />
                                  </p>
                                </div>
                                <button type="button" className="text-[11px] text-indigo-600 font-bold hover:bg-indigo-50 px-2 py-1 rounded transition-colors cursor-pointer shrink-0">
                                  + Seguir
                                </button>
                              </div>

                              {/* LinkedIn copy with proper line break formats */}
                              <p className="text-[11.5px] text-slate-800 leading-relaxed whitespace-pre-wrap px-0.5">
                                {contentText || "O rascunho está vazio. Volte ao Editor para preenchê-lo!"}
                              </p>

                              {/* LinkedIn tailored image visually seamless */}
                              {config.imageUrl ? (
                                <div className="relative border border-slate-100 overflow-hidden cursor-pointer" onClick={() => setLightboxImage({ url: config.imageUrl!, platform: titleLabel, prompt: config.imagePrompt })}>
                                  <div className={`w-full ${getAspectClass(config.aspectRatio)}`}>
                                    <img
                                      src={config.imageUrl}
                                      alt="LinkedIn campaign post visual"
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="p-8 bg-slate-50 border border-dashed border-slate-200 text-center rounded-xl">
                                  <ImageIcon size={16} className="text-slate-300 mx-auto" strokeWidth={1} />
                                  <p className="text-[9px] text-slate-400 mt-1">Carregando visual ilustrativo...</p>
                                </div>
                              )}

                              {/* LinkedIn Realistic Interactions Stats line */}
                              <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-100 pb-2 pt-1 font-medium select-none px-1">
                                <div className="flex items-center gap-1">
                                  <span className="inline-flex items-center justify-center w-4.5 h-4.5 bg-indigo-100 text-indigo-700 rounded-full text-[8px] font-bold">👍</span>
                                  <span className="inline-flex items-center justify-center w-4.5 h-4.5 bg-amber-100 text-amber-700 rounded-full text-[8px] font-bold">💡</span>
                                  <span>{likesCount.linkedin.count} pessoas recomendam isto</span>
                                </div>
                                <div className="flex gap-2">
                                  <span>4 comentários</span>
                                  <span>•</span>
                                  <span>2 compartilhamentos</span>
                                </div>
                              </div>

                              {/* LinkedIn real reaction button interactions */}
                              <div className="grid grid-cols-4 gap-0.5 pt-1 text-slate-600 select-none">
                                <button 
                                  type="button" 
                                  onClick={() => toggleMockLike("linkedin")}
                                  className={`flex items-center justify-center gap-1.5 py-2 px-1 hover:bg-slate-50 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                    likesCount.linkedin.liked ? "text-indigo-600 bg-indigo-50/50" : ""
                                  }`}
                                >
                                  <ThumbsUp size={11} className={likesCount.linkedin.liked ? "fill-current" : ""} />
                                  <span>{likesCount.linkedin.liked ? "Recomendado" : "Gostei"}</span>
                                </button>
                                <button type="button" className="flex items-center justify-center gap-1.5 py-2 px-1 hover:bg-slate-50 rounded-lg text-[10px] font-bold cursor-not-allowed">
                                  <MessageSquare size={11} />
                                  <span>Comentar</span>
                                </button>
                                <button type="button" className="flex items-center justify-center gap-1.5 py-2 px-1 hover:bg-slate-50 rounded-lg text-[10px] font-bold cursor-not-allowed">
                                  <Share2 size={11} />
                                  <span>Apoiar</span>
                                </button>
                                <button type="button" className="flex items-center justify-center gap-1.5 py-2 px-1 hover:bg-slate-50 rounded-lg text-[10px] font-bold cursor-not-allowed">
                                  <Send size={11} />
                                  <span>Enviar</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* TWITTER / X POST SIMULATION CHASSIS */}
                          {plat === "twitter" && (
                            <div className="p-3 text-left space-y-2.5 font-sans">
                              {/* Twitter User Area */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white shadow-xs font-mono">
                                    X
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[12px] font-bold text-slate-900 leading-none">Nelton Ambate</span>
                                      <span className="text-indigo-600 text-[10px]" title="Verificado">⚡</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block leading-tight">{handleLabel}</span>
                                  </div>
                                </div>
                                <button type="button" className="text-[11px] bg-slate-900 text-white font-bold px-3 py-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer">
                                  Seguir
                                </button>
                              </div>

                              {/* Twitter Copy block with colored links for realism */}
                              <p className="text-[12px] text-slate-875 leading-relaxed whitespace-pre-wrap">
                                {contentText || "Seu tweet está em branco! Preencha no Editor."}
                              </p>

                              {/* Twitter Aspect Card Display */}
                              {config.imageUrl ? (
                                <div className="relative border border-slate-100 rounded-xl overflow-hidden cursor-pointer" onClick={() => setLightboxImage({ url: config.imageUrl!, platform: titleLabel, prompt: config.imagePrompt })}>
                                  <div className={`w-full ${getAspectClass(config.aspectRatio)}`}>
                                    <img
                                      src={config.imageUrl}
                                      alt="Twitter aspect block illustration"
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="p-8 bg-slate-50 border border-dashed border-slate-200 text-center rounded-xl">
                                  <ImageIcon size={15} className="text-slate-300 mx-auto" />
                                  <p className="text-[9px] text-slate-400 mt-1">Nenhum recurso visual gerado ainda.</p>
                                </div>
                              )}

                              {/* Twitter metadata timeline */}
                              <div className="text-[10px] text-slate-400 border-b border-slate-100 pb-2 pt-1 font-medium select-none px-1">
                                <span>21:40 • Jun 12, 2026 • <b>4.8K</b> Visualizações</span>
                              </div>

                              {/* Twitter Mock Interactive Stats Action controls */}
                              <div className="flex justify-between items-center text-slate-500 max-w-sm mx-auto select-none px-4 pt-1">
                                <button type="button" className="flex items-center gap-1 text-[10px] hover:text-sky-500 transition-colors cursor-not-allowed">
                                  <MessageCircle size={12} />
                                  <span>14</span>
                                </button>
                                <button type="button" className="flex items-center gap-1 text-[10px] hover:text-emerald-500 transition-colors cursor-not-allowed">
                                  <RefreshCw size={11} />
                                  <span>45</span>
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => toggleMockLike("twitter")}
                                  className={`flex items-center gap-1 text-[10px] hover:text-rose-500 transition-colors cursor-pointer ${
                                    likesCount.twitter.liked ? "text-rose-500 font-bold" : ""
                                  }`}
                                >
                                  <Heart size={12} className={likesCount.twitter.liked ? "fill-current" : ""} />
                                  <span>{likesCount.twitter.count}</span>
                                </button>
                                <button type="button" className="flex items-center gap-1 text-[10px] hover:text-indigo-500 transition-colors cursor-not-allowed">
                                  <Bookmark size={12} />
                                  <span>21</span>
                                </button>
                                <button type="button" className="text-slate-400 hover:text-slate-600 cursor-not-allowed">
                                  <Share2 size={11} />
                                </button>
                              </div>

                            </div>
                          )}

                          {/* INSTAGRAM POST SIMULATION CHASSIS */}
                          {plat === "instagram" && (
                            <div className="text-left font-sans flex flex-col">
                              {/* IG Header Area */}
                              <div className="p-3 flex items-center justify-between border-b border-slate-100 bg-white">
                                <div className="flex items-center gap-2">
                                  <div className="w-8.5 h-8.5 p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600">
                                    <div className="w-full h-full bg-slate-105 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-650 bg-slate-100">
                                      IG
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[11.5px] font-bold text-slate-900">nelton.ambate</span>
                                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    </div>
                                    <span className="text-[9px] text-slate-400 block -mt-0.5">Campinas, São Paulo • Áudio Original</span>
                                  </div>
                                </div>
                                <button type="button" className="text-slate-400 hover:text-slate-700">
                                  <MoreHorizontal size={14} />
                                </button>
                              </div>

                              {/* IG Image prominent top-center as standard on feed layout */}
                              {config.imageUrl ? (
                                <div 
                                  className="relative overflow-hidden cursor-pointer" 
                                  onClick={() => setLightboxImage({ url: config.imageUrl!, platform: titleLabel, prompt: config.imagePrompt })}
                                >
                                  <div className={`w-full ${getAspectClass(config.aspectRatio)}`}>
                                    <img
                                      src={config.imageUrl}
                                      alt="Instagram post visual asset"
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>

                                  {config.isFallback && (
                                    <div className="absolute top-2 right-2 bg-black/75 text-white p-1 rounded text-[8px] z-10 select-none">
                                      Demo
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="aspect-square bg-slate-50 flex flex-col items-center justify-center p-8 border-b border-slate-100">
                                  <ImageIcon size={22} className="text-slate-300" />
                                  <p className="text-[10px] text-slate-400 mt-1">Visual pendente.</p>
                                </div>
                              )}

                              {/* IG Feedback Icons line */}
                              <div className="p-3 space-y-2">
                                <div className="flex items-center justify-between select-none">
                                  <div className="flex gap-3 text-slate-700">
                                    <button 
                                      type="button" 
                                      onClick={() => toggleMockLike("instagram")}
                                      className={`hover:text-rose-600 hover:scale-110 transition-transform cursor-pointer ${
                                        likesCount.instagram.liked ? "text-rose-605 text-rose-600" : ""
                                      }`}
                                    >
                                      <Heart size={16} className={likesCount.instagram.liked ? "fill-current text-rose-600" : ""} />
                                    </button>
                                    <button type="button" className="hover:text-slate-900 hover:scale-110 transition-transform cursor-not-allowed">
                                      <MessageCircle size={16} />
                                    </button>
                                    <button type="button" className="hover:text-slate-900 hover:scale-110 transition-transform cursor-not-allowed">
                                      <Send size={15} />
                                    </button>
                                  </div>
                                  <button type="button" className="text-slate-705 hover:text-slate-950 cursor-not-allowed">
                                    <Bookmark size={16} />
                                  </button>
                                </div>

                                {/* Likes line */}
                                <div className="text-[11px] font-bold text-slate-800 leading-none select-none">
                                  Curtido por <span className="hover:underline cursor-pointer">marketing_ninja</span> e <span className="hover:underline cursor-pointer">{likesCount.instagram.count} outras pessoas</span>
                                </div>

                                {/* Custom caption view with bold handle at the start */}
                                <div className="text-[11px] text-slate-800 leading-relaxed font-sans mt-1 whitespace-pre-wrap">
                                  <span className="font-bold text-slate-900 mr-1.5">nelton.ambate</span>
                                  <span>{contentText || "Sem descrição no momento!"}</span>
                                </div>

                                {/* Preset Hashtags footer bar */}
                                <p className="text-[10px] text-[#00376b] font-medium leading-none font-mono">
                                  #marketingdemidia #socialforgedigital #iafuturo #visualcreative
                                </p>

                                {/* IG Comment prompt */}
                                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 select-none">
                                  <span>Adicione um comentário...</span>
                                  <span className="text-slate-300">☺</span>
                                </div>
                              </div>

                            </div>
                          )}

                        </div>

                        {/* Interactive toggle switch quick tip */}
                        <div className="mt-2 text-center text-[9px] text-slate-450 italic">
                          💡 Clique no botão de curtir no simulador para interagir de verdade!
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </section>
      </main>

      {/* Lightbox Modal with Full-Resolution Zoom */}
      {lightboxImage && (
        <div 
          id="image-lightbox-backdrop"
          className="fixed inset-0 z-50 bg-slate-955 bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            id="close-lightbox-btn"
            type="button"
            className="absolute top-5 right-5 text-white hover:text-slate-350 p-2.5 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(null);
            }}
          >
            <X size={20} />
          </button>

          <div 
            className="max-w-4xl w-full flex flex-col items-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-h-[75vh]">
              <img
                src={lightboxImage.url}
                alt="HQ expanded visual layout"
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl max-w-2xl w-full text-center space-y-1 backdrop-blur-md">
              <span className="inline-block px-2.5 py-1 bg-indigo-650 text-white text-[9px] tracking-wider font-bold uppercase rounded-md shadow-xs">
                {lightboxImage.platform} Aspect Output
              </span>
              <p className="text-[11px] text-slate-300 italic font-medium px-2 leading-relaxed line-clamp-2 mt-1">
                "{lightboxImage.prompt}"
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadImageFile(lightboxImage.url, lightboxImage.platform.toLowerCase())}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-white text-slate-900 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  <Download size={13} />
                  <span>Baixar Alta Resolução</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright section */}
      <footer className="border-t border-slate-200/80 bg-white py-4 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
          <div className="flex items-center gap-2">
            <span>Powered by <b className="text-slate-650">Gemini & Antigravity Pro</b></span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-[9px] lowercase font-normal italic text-slate-400">secured with end-to-end sandbox shielding</span>
          </div>
          <div>
            SocialForge • Atelier de Mídia Digital • © 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
