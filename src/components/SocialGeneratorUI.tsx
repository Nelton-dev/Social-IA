import React from "react";
import { 
  Briefcase, 
  Sparkles, 
  Megaphone, 
  Check, 
  Linkedin, 
  Twitter, 
  Instagram,
  Copy,
  Sliders,
  Settings2,
  Lock,
  Layers,
  Sparkle
} from "lucide-react";
import { Tone, AspectRatioType, ImageSizeType, ModelQualityType } from "../types";

// Tone Selector Component
interface ToneSelectorProps {
  currentTone: Tone;
  onChange: (tone: Tone) => void;
  disabled?: boolean;
}

export function ToneSelector({ currentTone, onChange, disabled }: ToneSelectorProps) {
  const tonesList = [
    {
      value: "professional" as Tone,
      label: "Profissional",
      tagline: "Estratégia corporativa",
      description: "Conteúdo focado nos negócios, estruturado, perspicaz e com escrita polida voltada à credibilidade.",
      color: "text-indigo-600",
      accentBg: "bg-indigo-50",
      borderSelected: "border-indigo-600 ring-indigo-100",
      icon: Briefcase
    },
    {
      value: "witty" as Tone,
      label: "Perspicaz & Criativo",
      tagline: "Engajamento viral",
      description: "Ganchos afiados, humor inteligente, tom conversacional e analogias surpreendentes de alto alcance.",
      color: "text-amber-600",
      accentBg: "bg-amber-50",
      borderSelected: "border-amber-600 ring-amber-100",
      icon: Sparkles
    },
    {
      value: "urgent" as Tone,
      label: "Urgente & Persuasivo",
      tagline: "Foco em Conversão",
      description: "Frases de alto impacto emocional, gatilhos de escassez e chamadas comerciais diretas (CTA).",
      color: "text-red-600",
      accentBg: "bg-red-50",
      borderSelected: "border-red-600 ring-red-100",
      icon: Megaphone
    }
  ];

  return (
    <div id="tone-selector" className="grid grid-cols-1 gap-3">
      {tonesList.map((t) => {
        const Icon = t.icon;
        const isSelected = currentTone === t.value;
        return (
          <button
            key={t.value}
            id={`tone-btn-${t.value}`}
            type="button"
            disabled={disabled}
            onClick={() => onChange(t.value)}
            className={`group text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden flex gap-3.5 items-start ${
              isSelected 
                ? `border-slate-800 bg-white ring-4 ${t.borderSelected} shadow-xs` 
                : "border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300"
            } ${disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {/* Left Accented Block */}
            <span className={`p-2.5 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105 ${
              isSelected ? "bg-slate-900 text-white" : `${t.accentBg} ${t.color}`
            }`}>
              <Icon size={18} />
            </span>

            {/* Central Information */}
            <div className="space-y-0.5 flex-1 pr-6">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-800 text-sm">{t.label}</span>
                <span className="text-[10px] bg-slate-100/80 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">
                  {t.tagline}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                {t.description}
              </p>
            </div>

            {/* Selected Indicator badge */}
            {isSelected && (
              <span className="absolute top-4 right-4 flex items-center justify-center w-5 h-5 bg-slate-900 text-white rounded-full">
                <Check size={11} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Platform Logo Selector with customized branded designs
export function PlatformBranding({ platform }: { platform: "linkedin" | "twitter" | "instagram" }) {
  switch (platform) {
    case "linkedin":
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-[#005a87] to-[#0077b5] text-white shadow-xs">
          <Linkedin size={16} />
        </span>
      );
    case "twitter":
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-950 text-white border border-slate-800 shadow-xs">
          <Twitter size={15} />
        </span>
      );
    case "instagram":
      return (
        <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-xs">
          <Instagram size={16} />
        </span>
      );
  }
}

// Control selector panel for Aspect Ratio, Size, and Model Quality
interface ImageControlsProps {
  aspectRatio: AspectRatioType;
  size: ImageSizeType;
  quality: ModelQualityType;
  onRatioChange: (ratio: AspectRatioType) => void;
  onSizeChange: (size: ImageSizeType) => void;
  onQualityChange: (quality: ModelQualityType) => void;
  disabled?: boolean;
}

export function ImageControls({
  aspectRatio,
  size,
  quality,
  onRatioChange,
  onSizeChange,
  onQualityChange,
  disabled
}: ImageControlsProps) {
  
  // Wireframe geometric representation generator
  const getWireframe = (ratio: AspectRatioType) => {
    switch (ratio) {
      case "1:1": return "w-3 h-3 rounded-xs border-2 border-current shrink-0";
      case "4:3": return "w-3.5 h-2.5 rounded-xs border-2 border-current shrink-0";
      case "3:4": return "w-2.5 h-3.5 rounded-xs border-2 border-current shrink-0";
      case "16:9": return "w-4.5 h-2.5 rounded-xs border-2 border-current shrink-0";
      case "9:16": return "w-2.5 h-4 rounded-xs border-2 border-current shrink-0";
      case "3:2": return "w-4 h-2.5 rounded-xs border-2 border-current shrink-0";
      case "2:3": return "w-2.5 h-4 rounded-xs border-2 border-current shrink-0";
      case "21:9": return "w-5 h-2 rounded-xs border-2 border-current shrink-0";
      default: return "w-3 h-3 rounded-xs border-2 border-current shrink-0";
    }
  };

  const ratios: { value: AspectRatioType; label: string; desc: string }[] = [
    { value: "1:1", label: "1:1", desc: "Feed Quadrado" },
    { value: "4:3", label: "4:3", desc: "Tablet / Carrossel" },
    { value: "3:4", label: "3:4", desc: "Feed Retrato" },
    { value: "16:9", label: "16:9", desc: "Widescreen / Banner" },
    { value: "9:16", label: "9:16", desc: "Story / Reels" },
    { value: "3:2", label: "3:2", desc: "Foto Clássica" },
    { value: "2:3", label: "2:3", desc: "Capa / Editorial" },
    { value: "21:9", label: "21:9", desc: "Ultra-Amplo" }
  ];

  const sizes: { value: ImageSizeType; label: string; pixels: string }[] = [
    { value: "1K", label: "1K SD", pixels: "1024 px" },
    { value: "2K", label: "2K HD", pixels: "2048 px" },
    { value: "4K", label: "4K UHD", pixels: "4096 px" }
  ];

  return (
    <div id="image-controls-panel" className="space-y-4">
      {/* Model Selector Card Style */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estilo de Motor Visual</label>
          <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkle size={8} fill="currentColor" />
            <span>Gemini Image FX</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="quality-fast"
            type="button"
            disabled={disabled}
            onClick={() => onQualityChange("fast")}
            className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all relative ${
              quality === "fast"
                ? "bg-slate-900 border-slate-950 text-white shadow-md shadow-slate-100"
                : "bg-slate-50/50 text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="font-semibold text-[11px]">Renderizador Flash</div>
            <p className="text-[9px] opacity-80 mt-0.5 font-normal">Velocidade ultra rápida</p>
          </button>
          <button
            id="quality-studio"
            type="button"
            disabled={disabled}
            onClick={() => onQualityChange("studio")}
            className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all relative ${
              quality === "studio"
                ? "bg-gradient-to-br from-indigo-900 to-indigo-950 border-indigo-950 text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-500/10"
                : "bg-slate-50/50 text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="font-semibold text-[11px] flex items-center justify-between gap-1">
              <span>Mestre de Estúdio</span>
              <span className="text-[7px] bg-amber-400 text-amber-950 px-1 py-0.2 rounded font-bold uppercase">PRO</span>
            </div>
            <p className="text-[9px] opacity-80 mt-0.5 font-normal">Filtro de refinamento estético</p>
          </button>
        </div>
      </div>

      {/* Aspect Ratio Selector (Mini Wireframes) */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ajuste de Proporção (Quadro)</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-sans">
          {ratios.map((r) => {
            const isSelected = aspectRatio === r.value;
            return (
              <button
                key={r.value}
                id={`ratio-${r.value.replace(":", "-")}`}
                type="button"
                disabled={disabled}
                onClick={() => onRatioChange(r.value)}
                title={`${r.label} - ${r.desc}`}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-950 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <span className={isSelected ? "text-indigo-400" : "text-slate-400"}>
                  {getWireframe(r.value)}
                </span>
                <span className="text-[11px] font-medium font-mono">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Output Size Selector */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Resolução Nativa</label>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((s) => {
            const isSelected = size === s.value;
            return (
              <button
                key={s.value}
                id={`size-${s.value}`}
                type="button"
                disabled={disabled}
                onClick={() => onSizeChange(s.value)}
                className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center hover:scale-[1.01] ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-950 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="text-[11px] font-bold">{s.label}</div>
                <div className="text-[8px] font-medium opacity-70 tracking-tight mt-0.5">{s.pixels}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Media Display Details Component with Copy / Download
export function ContentTools({ 
  text, 
  onCopySuccess 
  }: { 
  text: string; 
  onCopySuccess: () => void 
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      onCopySuccess();
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <button
      id="btn-copy-post"
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-950 text-white hover:bg-slate-800 transition-all cursor-pointer rounded-lg text-xs font-semibold shadow-xs"
      title="Copiar texto completo"
    >
      <Copy size={12} />
      <span>Copiar Copia</span>
    </button>
  );
}
