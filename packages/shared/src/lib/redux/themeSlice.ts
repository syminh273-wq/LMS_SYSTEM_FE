import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BrandColors {
  primaryColor: string;
  accentColor: string;
  goldColor: string;
}

interface ThemeState {
  brand: BrandColors;
}

export const DEFAULT_BRAND: BrandColors = {
  primaryColor: '#1a3a7a',
  accentColor: '#00b4d8',
  goldColor: '#d4a843',
};

function loadFromStorage(): Partial<BrandColors> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem('lmsBrandTheme');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

const initialState: ThemeState = {
  brand: { ...DEFAULT_BRAND, ...loadFromStorage() },
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setBrandColors: (state, action: PayloadAction<Partial<BrandColors>>) => {
      state.brand = { ...state.brand, ...action.payload };
      if (typeof window !== 'undefined') {
        localStorage.setItem('lmsBrandTheme', JSON.stringify(state.brand));
      }
    },
    resetBrandColors: (state) => {
      state.brand = { ...DEFAULT_BRAND };
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lmsBrandTheme');
      }
    },
  },
});

export const { setBrandColors, resetBrandColors } = themeSlice.actions;
export default themeSlice.reducer;
