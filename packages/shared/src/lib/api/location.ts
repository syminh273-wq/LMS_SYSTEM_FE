'use client';

import type { ReferenceData, ReferenceProvince, ReferenceWard } from './location-types';

const CACHE_KEY  = 'vn_provinces_v2';
const CACHE_TTL  = 7 * 24 * 60 * 60 * 1000; // 7 days
const SOURCE_URL = 'https://provinces.open-api.vn/api/v2/?depth=2';

type CacheShape = { ts: number; data: ReferenceData };

class LocationService {
  private inflight: Promise<ReferenceData> | null = null;

  /**
   * Return the full list of provinces (with nested wards) — fetched from the
   * remote API, cached in localStorage for 7 days, and falling back to the
   * bundled JSON when both are unavailable.
   */
  async getAllProvincesWithWards(): Promise<ReferenceData['provinces']> {
    const data = await this.loadData();
    return data.provinces;
  }

  async getProvinces(): Promise<{ code: number; name: string }[]> {
    const data = await this.loadData();
    return data.provinces.map((p) => ({ code: p.code, name: p.name }));
  }

  async getWardsByProvince(provinceCode: number): Promise<ReferenceWard[]> {
    const data = await this.loadData();
    const province = data.provinces.find((p) => p.code === provinceCode);
    return province?.wards ?? [];
  }

  searchProvinces(
    provinces: ReferenceProvince[],
    query: string,
  ): ReferenceProvince[] {
    const q = this.normalize(query);
    if (!q) return provinces;
    return provinces.filter((p) => this.normalize(p.name).includes(q));
  }

  searchWards(wards: ReferenceWard[], query: string): ReferenceWard[] {
    const q = this.normalize(query);
    if (!q) return wards;
    return wards.filter((w) => this.normalize(w.name).includes(q));
  }

  /** Force-refresh: bust the localStorage cache and re-fetch. */
  async refresh(): Promise<ReferenceData> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    return this.loadData();
  }

  private async loadData(): Promise<ReferenceData> {
    if (typeof window !== 'undefined') {
      const cached = readCache();
      if (cached) return cached;
    }

    if (this.inflight) return this.inflight;

    this.inflight = this.fetchOrFallback().finally(() => {
      this.inflight = null;
    });

    const data = await this.inflight;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
      } catch {
        // QuotaExceeded — ignore, fallback still works.
      }
    }
    return data;
  }

  private async fetchOrFallback(): Promise<ReferenceData> {
    try {
      const res = await fetch(SOURCE_URL, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ReferenceData['provinces'];
      return normalizeShape(json);
    } catch {
      return importBundled();
    }
  }

  private normalize(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}

function readCache(): ReferenceData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed?.ts || !parsed?.data) return null;
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function normalizeShape(raw: any[]): ReferenceData {
  const provinces: ReferenceProvince[] = (raw || []).map((p) => ({
    code: p.code,
    name: p.name,
    division_type: p.division_type,
    wards: Array.isArray(p.wards)
      ? p.wards.map((w: any) => ({ code: w.code, name: w.name }))
      : [],
  }));
  return {
    version: '2025-merged',
    source: SOURCE_URL,
    fetched_at: new Date().toISOString(),
    total_provinces: provinces.length,
    total_wards: provinces.reduce((sum, p) => sum + p.wards.length, 0),
    provinces,
  };
}

async function importBundled(): Promise<ReferenceData> {
  // The fallback JSON is shipped with each app at src/lib/data/vn_provinces.json
  const mod = await import('../data/vn_provinces.json');
  return mod.default as unknown as ReferenceData;
}

export const locationService = new LocationService();
