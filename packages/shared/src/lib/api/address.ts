/**
 * Address types — shared between consumer-web and space-web.
 * Backend: GET/PUT/PATCH/DELETE /api/v1/account/addresses/me/
 */

type AddressType = 'home' | 'work' | 'billing' | 'other';
type OwnerType = 'consumer' | 'space';

export type Address = {
  uid: string;
  owner_id: string;
  owner_type: OwnerType;
  type: AddressType;
  label: string;
  line1: string;
  line2: string;
  province_code: number;
  province_name: string;
  ward_code: number;
  ward_name: string;
  country: string;
  created_at: string | null;
  updated_at: string | null;
};

/** Payload accepted by PUT/PATCH (names are auto-filled server-side from codes). */
export type AddressPayload = {
  type: AddressType;
  label?: string;
  line1?: string;
  line2?: string;
  province_code: number;
  ward_code: number;
  country?: string;
};
