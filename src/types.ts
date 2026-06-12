export type Tone = "professional" | "witty" | "urgent" | "inspirational" | "educational";

export interface SocialPosts {
  linkedin: string;
  linkedinImagePrompt: string;
  twitter: string;
  twitterImagePrompt: string;
  instagram: string;
  instagramImagePrompt: string;
  suggestedHashtags?: string[];
}

export type AspectRatioType = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageSizeType = "1K" | "2K" | "4K";
export type ModelQualityType = "fast" | "studio";
export type ImageStyleType = "realistic" | "illustration" | "cinematic" | "minimal" | "3d";

export interface PlatformConfig {
  aspectRatio: AspectRatioType;
  size: ImageSizeType;
  quality: ModelQualityType;
  imageStyle?: ImageStyleType;
  isGeneratingImage: boolean;
  imageUrl: string | null;
  imagePrompt: string;
  imageError: string | null;
  isFallback?: boolean;
  fallbackMessage?: string;
}
