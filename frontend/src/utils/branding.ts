export const BRANDING_STORAGE_KEY = "ofs:branding";

export type BrandingData = {
  nomeFraternidade?: string;
  logoBase64?: string;
};

export const getStoredBranding = (): BrandingData | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as BrandingData;
    return {
      nomeFraternidade: parsed?.nomeFraternidade,
      logoBase64: parsed?.logoBase64,
    };
  } catch {
    return null;
  }
};

export const persistBranding = (branding: BrandingData): void => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
};

export const extractBrandingFromConfig = (configData: any): BrandingData => ({
  nomeFraternidade: configData?.nomeFraternidade,
  logoBase64: configData?.logoBase64,
});
