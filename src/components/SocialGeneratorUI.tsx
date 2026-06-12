import { motion } from "motion/react";
import { 
  Briefcase, 
  Sparkles, 
  Megaphone, 
  Check, 
  Linkedin, 
  Twitter, 
  Instagram,
  Copy,
  Download,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { Tone, AspectRatioType, ImageSizeType, ModelQualityType } from "../types";

// Tone Selector Component
interface ToneSelectorProps {
  currentTone: Tone;
  onChange: (tone: Tone) => void;
  disabled?: boolean;
}

export function ToneSelector({ currentTone, onChange, disabled }: ToneSelectorProps) {
  const tonesList: { value: Tone; label: string; description: string; color: string; bg: string; icon: any }[] = [
    {
      value: "professional",
      label: "Profissional",
      description: "Conteúdo estruturado, perspicaz e focado em negócios com layouts corporativos.",
      color: "text-indigo-600 border-indigo-200",
      bg: "bg-indigo-50",
      icon: Briefcase
    },
    {
      value: "witty",
      label: "Perspicaz & Divertido",
      description: "Estruturas inteligentes, ganchos afiados, tom conversacional e ideias criativas.",
      color: "text-emerald-600 border-emerald-200",
      bg: "bg-emerald-50",
      icon: Sparkles
    },
    {
      value: "urgent",
      label: "Urgente & Direto",
      description: "Alto impacto, urgência baseada em valor comercial e apelos de ação (CTA) fortes.",
      color: "text-rose-600 border-rose-200",
      bg: "bg-rose-50",
      icon: Megaphone
    }
  ];

  return (
    <div id="tone-selector" className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
              isSelected 
                ? "border-indigo-600 bg-white shadow-sm ring-1 ring-indigo-600" 
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`p-1.5 rounded-lg ${isSelected ? "bg-indigo-600 text-white" : `${t.bg} ${t.color}`}`}>
                <Icon size={16} />
              </span>
              <span className="font-semibold text-slate-800 text-sm md:text-base">{t.label}</span>
              {isSelected && (
                <span className="ml-auto text-indigo-600 bg-indigo-50 rounded-full p-0.5">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
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
        <span className="flex items-center justify-center p-2 bg-[#0077b5]/10 text-[#0077b5] rounded-lg">
          <Linkedin size={20} />
        </span>
      );
    case "twitter":
      return (
        <span className="flex items-center justify-center p-2 bg-neutral-950/10 text-neutral-950 rounded-lg">
          <Twitter size={20} />
        </span>
      );
    case "instagram":
      return (
        <span className="flex items-center justify-center p-2 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 text-white rounded-lg">
          <Instagram size={20} />
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
  const ratios: { value: AspectRatioType; label: string; desc: string }[] = [
    { value: "1:1", label: "1:1", desc: "Quadrado (Feed Meta)" },
    { value: "4:3", label: "4:3", desc: "Tablet Paisagem" },
    { value: "3:4", label: "3:4", desc: "Retrato Post" },
    { value: "16:9", label: "16:9", desc: "Widescreen (Banner X / LinkedIn)" },
    { value: "9:16", label: "9:16", desc: "Story / Reel (Celular)" },
    { value: "3:2", label: "3:2", desc: "Foto tradicional" },
    { value: "2:3", label: "2:3", desc: "Aspecto editorial" },
    { value: "21:9", label: "21:9", desc: "Cinematográfico ultra-amplo" }
  ];

  const sizes: { value: ImageSizeType; label: string; pixels: string }[] = [
    { value: "1K", label: "1K Padrão", pixels: "1024 x 1024" },
    { value: "2K", label: "2K QuadHD", pixels: "2048 x 2048" },
    { value: "4K", label: "4K UHD Estúdio", pixels: "4096 x 4096" }
  ];

  return (
    <div id="image-controls-panel" className="space-y-4">
      {/* Model Quality Setup Block */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-500 tracking-wider uppercase">Qualidade do Modelo</label>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">Gemini Engine</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            id="quality-fast"
            type="button"
            disabled={disabled}
            onClick={() => onQualityChange("fast")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
              quality === "fast"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div>Geração Rápida</div>
            <div className="text-[10px] opacity-75 font-normal">3.1-flash-image</div>
          </button>
          <button
            id="quality-studio"
            type="button"
            disabled={disabled}
            onClick={() => onQualityChange("studio")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
              quality === "studio"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm ring-1 ring-indigo-400"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <span>Mestre de Estúdio</span>
              <span className="px-1 text-[9px] bg-amber-500 text-white rounded font-bold uppercase tracking-wider">Pro</span>
            </div>
            <div className="text-[10px] opacity-75 font-normal">3-pro-image</div>
          </button>
        </div>
      </div>

      {/* Aspect Ratio Selector */}
      <div>
        <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">Proporção da Imagem (Quadro Ideal)</label>
        <div className="grid grid-cols-4 gap-1.5 font-sans">
          {ratios.map((r) => (
            <button
              key={r.value}
              id={`ratio-${r.value.replace(":", "-")}`}
              type="button"
              disabled={disabled}
              onClick={() => onRatioChange(r.value)}
              title={`${r.label} - ${r.desc}`}
              className={`py-1.5 px-1 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                aspectRatio === r.value
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output Size Selector */}
      <div>
        <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">Resolução Alvo</label>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((s) => (
            <button
              key={s.value}
              id={`size-${s.value}`}
              type="button"
              disabled={disabled}
              onClick={() => onSizeChange(s.value)}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                size === s.value
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm animate-pulse"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="text-xs font-bold">{s.value}</div>
              <div className="text-[9px] opacity-75">{s.pixels}</div>
            </button>
          ))}
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
      className="text-indigo-600 text-xs font-bold hover:underline transition-all cursor-pointer p-1 rounded hover:bg-indigo-50"
      title="Copiar conteúdo do post"
    >
      <span>Copiar Texto</span>
    </button>
  );
}
