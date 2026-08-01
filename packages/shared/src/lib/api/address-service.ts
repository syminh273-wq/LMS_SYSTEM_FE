import AbstractRestApiClient from './client';
import { ApiException } from './exceptions';
import type { Address, AddressPayload } from './address';

const PATH = '/api/v1/account/addresses/me/';

class AddressService extends AbstractRestApiClient {
  /**
   * Fetch the current user's address.
   * Returns `null` if the user has no address yet (404).
   */
  async getMine(): Promise<Address | null> {
    try {
      return await this.get<Address>(PATH);
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) return null;
      throw err;
    }
  }

  /** Create-or-replace the current user's address. */
  async upsert(data: AddressPayload): Promise<Address> {
    return this.put<Address>(PATH, data);
  }

  /** Soft-delete the current user's address. */
  async remove(): Promise<void> {
    await this.delete(PATH);
  }
}

export const addressService = new AddressService();
