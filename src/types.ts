export type Tone = "professional" | "witty" | "urgent";

export interface SocialPosts {
  linkedin: string;
  linkedinImagePrompt: string;
  twitter: string;
  twitterImagePrompt: string;
  instagram: string;
  instagramImagePrompt: string;
}

export type AspectRatioType = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageSizeType = "1K" | "2K" | "4K";
export type ModelQualityType = "fast" | "studio";

export interface PlatformConfig {
  aspectRatio: AspectRatioType;
  size: ImageSizeType;
  quality: ModelQualityType;
  isGeneratingImage: boolean;
  imageUrl: string | null;
  imagePrompt: string;
  imageError: string | null;
  isFallback?: boolean;
  fallbackMessage?: string;
}

export interface AppState {
  idea: string;
  tone: Tone;
  isGeneratingPosts: boolean;
  posts: SocialPosts | null;
  platformConfigs: {
    linkedin: PlatformConfig;
    twitter: PlatformConfig;
    instagram: PlatformConfig;
  };
  error: string | null;
}
