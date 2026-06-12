import React, { useState, useRef, useEffect, FormEvent } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  Check, 
  Copy, 
  Download, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  Maximize2, 
  Grid, 
  Layers, 
  ListRestart, 
  FileEdit, 
  Image as ImageIcon,
  CheckCircle2,
  X,
  Play
} from "lucide-react";
import { Tone, SocialPosts, PlatformConfig, AspectRatioType, ImageSizeType, ModelQualityType } from "./types";
import { ToneSelector, PlatformBranding, ImageControls, ContentTools } from "./components/SocialGeneratorUI";

export default function App() {
  // Campaign inputs state
  const [idea, setIdea] = useState<string>("");
  const [tone, setTone] = useState<Tone>("professional");
  const [isGeneratingPosts, setIsGeneratingPosts] = useState<boolean>(false);
  const [posts, setPosts] = useState<SocialPosts | null>(null);
  
  // Quick test prompts to make exploration easy for the user
  const campaignIdeas = [
    { label: "Garrafa Ecológica Descartável", text: "Lançamento de uma garrafa de água de bioplástico revolucionária que se decompõe naturalmente em 90 days. Estética moderna e elegante, tampa esportiva premium, disponível em tons pastéis de alta qualidade." },
    { label: "Plataforma SaaS Automações IA", text: "Anúncio do novo recurso de automação inteligente que elimina processos manuais e repetitivos de entrada de dados. Economize até 12 horas semanais. Configuração rápida sem necessidade de código." },
    { label: "Buscamos Diretores de Design!", text: "Vaga aberta para Designer de Produto Líder experiente para liderar interfaces de ferramentas de design colaborativo em tempo real. Regime totalmente remoto, cultura focada em design." }
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
        throw new Error(errorData.error || "O servidor falhou ao gerar os rascunhos de redação.");
      }

      const campaignData: SocialPosts = await response.json();
      setPosts(campaignData);

      // Distribute the freshly generated visual prompts into platform configurations & start rendering them!
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

    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Ocorreu um erro inesperado ao rascunhar cópias de campanha.");
      setIsGeneratingPosts(false);
    }
  };

  // Generate an individual platform's image (either called on draft setup or custom trigger)
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
          imageError: "O texto do prompt visual está vazio. Por favor, insira instruções detalhadas.",
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
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased selection:bg-indigo-600 selection:text-white">
      {/* Toast alert system */}
      {successToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm max-w-sm border border-slate-800 animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Workspace Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display tracking-tight text-slate-800">SocialForge AI</h1>
              <p className="text-xs text-slate-500 font-semibold">Rascunhos de redes sociais multiataforma e recursos visuais sob medida</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-1.5 text-sm text-slate-500 font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Motor de IA: Pro-V3 Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Layout Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Campaign configuration board (width 4 on large screens) */}
        <section className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              <h2 className="text-base font-bold font-display text-slate-800">Configuração do Conteúdo</h2>
            </div>

            <form onSubmit={startCampaignGeneration} className="space-y-4 font-sans">
              {/* Preset quick buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Sugestões de Ideias</label>
                <div className="flex flex-wrap gap-1.5">
                  {campaignIdeas.map((ideaPreset, index) => (
                    <button
                      key={index}
                      id={`preset-btn-${index}`}
                      type="button"
                      disabled={isGeneratingPosts}
                      onClick={() => selectPreset(ideaPreset.text)}
                      className="text-[11px] bg-slate-50 hover:bg-slate-100 transition-all font-semibold text-slate-600 py-1.5 px-2.5 rounded-lg text-left cursor-pointer border border-slate-200/60"
                    >
                      {ideaPreset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input for the idea */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="idea-input" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ideia do Conteúdo / Tópico</label>
                  <span className="text-[10px] text-slate-400 font-semibold">{idea.length} caracteres</span>
                </div>
                <textarea
                  id="idea-input"
                  rows={4}
                  required
                  disabled={isGeneratingPosts}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="O futuro da jardinagem urbana sustentável em 2026..."
                  className="w-full text-sm rounded-lg border border-slate-300 p-3 bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none text-sans"
                />
              </div>

              {/* Tone Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tom de Escrita Desejado</label>
                <ToneSelector 
                  currentTone={tone} 
                  onChange={setTone} 
                  disabled={isGeneratingPosts} 
                />
              </div>

              {/* Trigger generate campaign */}
              <button
                id="generate-campaign-btn"
                type="submit"
                disabled={isGeneratingPosts || !idea.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all shadow-sm ${
                  isGeneratingPosts 
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                    : !idea.trim()
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99] cursor-pointer"
                }`}
              >
                {isGeneratingPosts ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-indigo-400" />
                    <span>Analisando & Redigindo Conteúdo...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span>Rascunhar Campanhas & Gerar Imagens</span>
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
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <HelpCircle size={14} className="text-slate-500" />
              <span>Diretrizes do Painel</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-500 font-sans">
              <li className="flex gap-2">
                <span className="font-bold text-slate-700">1.</span>
                <span>Insira qualquer tema de marketing ou cole ideias brutas do produto e selecione o estilo de escrita desejado.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-slate-700">2.</span>
                <span>A plataforma utiliza o Gemini 3.5-Flash para gerar rascunhos adaptados para o LinkedIn, Twitter e Instagram, além de detalhar descrições visuais avançadas para cada cenário.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-slate-700">3.</span>
                <span>O motor inteligente inicia e renderiza de forma simultânea imagens personalizadas e otimizadas para as proporções ideais de cada canal.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-slate-700">4.</span>
                <span>Você tem controle total para editar os rascunhos, ajustar tamanhos, refinar as instruções visuais e reenviar novas renderizações com qualidade de Estúdio de forma individual.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Right Side: Generations Workspace (width 8 on large screens) */}
        <section className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Workspace Controls & View Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1.5">Modo de Visualização:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  id="view-grid-btn"
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    viewMode === "grid" 
                      ? "bg-white text-indigo-600 shadow-xs border border-indigo-100" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Grid size={13} />
                  <span>Ver Grade (Tudo)</span>
                </button>
                <button
                  id="view-tab-linkedin"
                  type="button"
                  onClick={() => setViewMode("linkedin")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    viewMode === "linkedin" 
                      ? "bg-white text-[#0077b5] shadow-xs border border-blue-100" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>LinkedIn</span>
                </button>
                <button
                  id="view-tab-twitter"
                  type="button"
                  onClick={() => setViewMode("twitter")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    viewMode === "twitter" 
                      ? "bg-white text-slate-950 shadow-xs border border-slate-200" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>Twitter / X</span>
                </button>
                <button
                  id="view-tab-instagram"
                  type="button"
                  onClick={() => setViewMode("instagram")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    viewMode === "instagram" 
                      ? "bg-white text-pink-600 shadow-xs border border-pink-100" 
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>Instagram</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-bold text-right self-end sm:self-center pr-1.5 uppercase tracking-wider">
              {posts ? "3 rascunhos criados" : "Pronto para criação de campanha"}
            </div>
          </div>

          {/* Core Drafting Workspace Grid Area */}
          {!posts && !isGeneratingPosts ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-5 flex-1 min-h-[400px] shadow-sm">
              <div className="w-16 h-16 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                <Layers size={28} className="text-indigo-500" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-base font-bold text-slate-800">Seu painel de conteúdo social está vazio</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Insira sua ideia de marca, diretrizes do projeto ou escopo do produto. Em seguida, inicie a geração para criar automaticamente um pacote completo de mídia multi-canal com imagens personalizadas para cada proporção ideal de rede.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  id="setup-demo-btn"
                  type="button"
                  onClick={() => {
                    setIdea(campaignIdeas[0].text);
                    setTone("witty");
                  }}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-all border border-slate-200 shadow-xs"
                >
                  Carregar Demonstração
                </button>
              </div>
            </div>
          ) : isGeneratingPosts ? (
            /* Main overall skeleton loading */
            <div className="bg-white rounded-xl border border-slate-200 p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-4 flex-1 min-h-[400px] shadow-sm animate-pulse">
              <div className="p-4 bg-slate-50 rounded-full text-slate-400">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-sm font-bold text-slate-800">Orquestrando Campanhas de Mídia Social</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Nosso motor inteligente está estruturando as diferenças de formato específicas para cada plataforma, desenhando ganchos de persuasão inteligentes e construindo rascunhos com diretrizes visuais ricas de imagem.
                </p>
              </div>
            </div>
          ) : (
            /* Active Workspace display with full outputs */
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 xl:grid-cols-3" : "grid-cols-1"}`}>
              {filteredPlatforms().map((plat) => {
                const config = platformConfigs[plat];
                const contentText = posts ? posts[plat] : "";
                
                let titleLabel = "LinkedIn";
                let characterHint = "Análises de formato longo, headings e marcadores estruturados";
                if (plat === "twitter") {
                  titleLabel = "Twitter / X";
                  characterHint = "Impactante com menos de 280 caracteres, forte poder de atração";
                } else if (plat === "instagram") {
                  titleLabel = "Instagram";
                  characterHint = "Visual e emocional, uso de emojis orgânicos e hashtags no rodapé";
                }

                return (
                  <div 
                    key={plat} 
                    id={`platform-block-${plat}`} 
                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all"
                  >
                    {/* Header bar */}
                    <div className="border-b border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PlatformBranding platform={plat} />
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{titleLabel}</h3>
                          <p className="text-[10px] text-slate-400 font-medium">{characterHint}</p>
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <ContentTools 
                          text={contentText} 
                          onCopySuccess={() => triggerCopyNotice(titleLabel)} 
                        />
                      </div>
                    </div>

                    {/* Editor Textarea */}
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-1.5 text-slate-400">
                        <label className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-slate-500">
                          <FileEdit size={12} />
                          <span>Texto de Redação</span>
                        </label>
                        {plat === "twitter" && (
                          <span className={`text-[10px] font-bold ${contentText.length > 280 ? "text-red-500 animate-pulse" : "text-slate-500"}`}>
                            {contentText.length} / 280
                          </span>
                        )}
                      </div>
                      <textarea
                        id={`text-editor-${plat}`}
                        rows={6}
                        value={contentText}
                        onChange={(e) => updatePostText(plat, e.target.value)}
                        className="w-full text-xs font-sans text-slate-700 bg-slate-50/40 border border-slate-200 rounded-lg p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-y"
                        placeholder="Cópia de campanha não definida..."
                      />
                    </div>

                    {/* Image Generation Section */}
                    <div className="p-4 bg-slate-50/20 flex-1 flex flex-col space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 text-slate-500 mb-1.5">
                          <ImageIcon size={12} />
                          <span>Diretriz Visual Sob Medida</span>
                        </label>
                        <textarea
                          id={`image-prompt-editor-${plat}`}
                          rows={3}
                          value={config.imagePrompt}
                          onChange={(e) => updateImagePrompt(plat, e.target.value)}
                          className="w-full text-[11px] font-sans text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                          placeholder="Digite ou modifique as instruções conceituais da imagem..."
                        />
                      </div>

                      {/* Controls inside card accordion summary or drawer state */}
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

                        {/* Trigger Single platform image gen manual */}
                        <button
                          id={`btn-regenerate-${plat}`}
                          type="button"
                          disabled={config.isGeneratingImage}
                          onClick={() => generateImageIndividual(plat)}
                          className={`w-full text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            config.isGeneratingImage
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-750 text-white shadow-xs"
                          }`}
                        >
                          {config.isGeneratingImage ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-slate-400" />
                              <span>Renderizando imagem...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw size={13} />
                              <span>{config.imageUrl ? "Regerar Imagem" : "Gerar Imagem"}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Display visual item */}
                      <div className="flex-1 flex flex-col justify-end pt-2">
                        <div id={`render-stage-${plat}`} className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 shadow-inner flex items-center justify-center">
                          
                          {/* Sizing wrapper with appropriate padding */}
                          <div className={`w-full h-full relative ${getAspectClass(config.aspectRatio)} flex items-center justify-center transition-all duration-300`}>
                            {config.isGeneratingImage ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-100 text-center space-y-2">
                                <Loader2 size={24} className="animate-spin text-slate-800" />
                                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Compilando Pixels com IA</div>
                                <div className="text-[9px] text-slate-400 line-clamp-1 italic px-2">"{config.imagePrompt}"</div>
                              </div>
                            ) : config.imageError ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-red-50 text-center text-red-700 space-y-1.5">
                                <AlertCircle size={18} className="shrink-0" />
                                <div className="text-[10px] font-bold uppercase tracking-wider">Erro de Geração</div>
                                <div className="text-[9px] line-clamp-3 leading-relaxed opacity-90 px-1">{config.imageError}</div>
                                <button
                                  type="button"
                                  onClick={() => generateImageIndividual(plat)}
                                  className="mt-1 text-[10px] font-semibold bg-white border border-red-200 hover:bg-red-100 px-2 py-0.5 rounded transition-all cursor-pointer"
                                >
                                  Tentar Novamente
                                </button>
                              </div>
                            ) : config.imageUrl ? (
                              <>
                                <img
                                  src={config.imageUrl}
                                  alt={`Tailored post canvas layout for ${plat}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover select-none"
                                />
                                
                                {/* Fallback Warning Overlay Banner */}
                                {config.isFallback && (
                                  <div className="absolute top-2 inset-x-2 bg-amber-500/95 backdrop-blur-xs text-white p-1.5 px-2 rounded-lg text-[9px] font-medium leading-tight shadow-sm flex items-start gap-1.5 transition-all select-none z-10 text-left">
                                    <AlertCircle size={11} className="shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                      <span className="font-semibold block mb-0.5">Demonstração Fotográfica</span>
                                      Cota de IA excedida. Ative o Modo Estúdio no painel Settings do AI Studio para criar com o Gemini!
                                    </div>
                                  </div>
                                )}
                                
                                {/* Overlay Controls */}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-3 flex justify-between items-end opacity-0 hover:opacity-100 focus-within:opacity-100 transition-all duration-200">
                                  <div className="text-[10px] font-medium text-white/90 truncate mr-3">
                                    {config.size} • {config.aspectRatio}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      id={`btn-lightbox-${plat}`}
                                      type="button"
                                      onClick={() => setLightboxImage({ url: config.imageUrl!, platform: titleLabel, prompt: config.imagePrompt })}
                                      className="p-1 px-1.5 bg-white/10 hover:bg-white/30 text-white rounded-md text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                                      title="Maximizar exibição"
                                    >
                                      <Maximize2 size={12} />
                                    </button>
                                    <button
                                      id={`btn-download-img-${plat}`}
                                      type="button"
                                      onClick={() => downloadImageFile(config.imageUrl!, plat)}
                                      className="p-1 px-1.5 bg-indigo-600 border border-indigo-700 hover:bg-indigo-750 text-white rounded-md text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                                      title="Baixar bytes da imagem"
                                    >
                                      <Download size={12} />
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-1.5 bg-gradient-to-br from-indigo-50 to-slate-100/50">
                                <ImageIcon size={20} className="text-indigo-400" />
                                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Nenhuma Imagem Renderizada</div>
                                <p className="text-[9px] text-slate-400">Ajuste as diretrizes e proporções acima e clique em gerar</p>
                              </div>
                            )}
                          </div>
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

      {/* Lightbox / Full Aspect Ratio Zoom Modal */}
      {lightboxImage && (
        <div 
          id="image-lightbox-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <button
            id="close-lightbox-btn"
            type="button"
            className="absolute top-4 right-4 text-white hover:text-slate-300 p-2 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition-all"
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
            <div className="relative bg-slate-905 border border-slate-800 rounded-2xl overflow-hidden p-1 shadow-2xl">
              <img
                src={lightboxImage.url}
                alt={`Expanded high-definition canvas visual for ${lightboxImage.platform}`}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
              />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl max-w-2xl w-full text-center space-y-1 backdrop-blur-md">
              <span className="inline-block px-2.5 py-1 bg-indigo-600 text-white text-[10px] tracking-widest font-bold uppercase rounded-md">
                {lightboxImage.platform} Aspect Output
              </span>
              <p className="text-xs text-slate-300 italic font-medium px-2 leading-relaxed">
                "{lightboxImage.prompt}"
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadImageFile(lightboxImage.url, lightboxImage.platform.toLowerCase())}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  <Download size={13} />
                  <span>Download Full Resolution</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span>Powered by <b className="text-slate-600">Gemini Pro System</b></span>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] lowercase font-normal italic text-slate-405">secured with end-to-end sandbox shielding</span>
          </div>
          <div>
            Social Content Studio • © 2026 Forge Digital Systems
          </div>
        </div>
      </footer>
    </div>
  );
}
