/**
 * Reference data shape for the bundled vn_provinces.json snapshot.
 * Source: https://provinces.open-api.vn/api/v2/?depth=2
 */
export type ReferenceProvince = {
  code: number;
  name: string;
  division_type?: string;
  wards: ReferenceWard[];
};

export type ReferenceWard = {
  code: number;
  name: string;
};

export type ReferenceData = {
  version: string;
  source: string;
  fetched_at: string;
  total_provinces: number;
  total_wards: number;
  provinces: ReferenceProvince[];
};
