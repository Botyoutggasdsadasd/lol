import { Product, Order, UserProfile, Coupon, VisitorAnalyticsData, StoreSettings, SongTrack, RobloxProfile } from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_USER_PROFILE,
  INITIAL_COUPONS,
  INITIAL_VISITOR_ANALYTICS,
  INITIAL_STORE_SETTINGS,
  INITIAL_SONGS,
} from '../data/mockData';

export interface FullAppState {
  products: Product[];
  orders: Order[];
  userProfile: UserProfile;
  coupons: Coupon[];
  settings: StoreSettings;
  analytics: VisitorAnalyticsData;
  songs?: SongTrack[];
}

export const api = {
  async getFullState(): Promise<FullAppState> {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            products: json.data.products || INITIAL_PRODUCTS,
            orders: json.data.orders || INITIAL_ORDERS,
            userProfile: json.data.userProfile || INITIAL_USER_PROFILE,
            coupons: json.data.coupons || INITIAL_COUPONS,
            settings: json.data.settings || INITIAL_STORE_SETTINGS,
            analytics: json.data.analytics || INITIAL_VISITOR_ANALYTICS,
            songs: json.data.settings?.songs || INITIAL_SONGS,
          };
        }
      }
    } catch (e) {
      console.warn('API /api/state unavailable, using local cache:', e);
    }

    // Fallback to local storage
    const savedProducts = localStorage.getItem('uchiro_products');
    const savedOrders = localStorage.getItem('uchiro_orders');
    const savedUser = localStorage.getItem('uchiro_user');
    const savedCoupons = localStorage.getItem('uchiro_coupons');
    const savedSettings = localStorage.getItem('uchiro_settings');

    return {
      products: savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS,
      orders: savedOrders ? JSON.parse(savedOrders) : INITIAL_ORDERS,
      userProfile: savedUser ? JSON.parse(savedUser) : INITIAL_USER_PROFILE,
      coupons: savedCoupons ? JSON.parse(savedCoupons) : INITIAL_COUPONS,
      settings: savedSettings ? JSON.parse(savedSettings) : INITIAL_STORE_SETTINGS,
      analytics: INITIAL_VISITOR_ANALYTICS,
      songs: INITIAL_SONGS,
    };
  },

  async fetchFullState(): Promise<FullAppState> {
    return this.getFullState();
  },

  async createProduct(product: Product, token?: string): Promise<Product> {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(product),
      });
      const data = await res.json();
      if (data.success && data.product) {
        return data.product;
      }
    } catch (e) {
      console.error('Failed to create product:', e);
    }
    return product;
  },

  async addProduct(product: Product): Promise<boolean> {
    const p = await this.createProduct(product);
    return !!p;
  },

  async updateProduct(id: string, updates: Partial<Product>, token?: string): Promise<Product> {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.product) {
        return data.product;
      }
    } catch (e) {
      console.error('Failed to update product:', e);
    }
    return { id, ...updates } as Product;
  },

  async deleteProduct(id: string, token?: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async resetToZeroSlate(token?: string): Promise<{ products: Product[]; orders: Order[] }> {
    try {
      const res = await fetch('/api/reset-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ mode: 'zero' }),
      });
      if (res.ok) {
        return { products: [], orders: [] };
      }
    } catch (e) {
      console.error(e);
    }
    return { products: [], orders: [] };
  },

  async resetData(mode: 'zero' | 'starter'): Promise<boolean> {
    try {
      const res = await fetch('/api/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async exportBackup(): Promise<any> {
    try {
      const res = await fetch('/api/backup/export');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API /api/backup/export failed, fallback to local state:', e);
    }
    return null;
  },

  async importBackup(
    backupData: any,
    mode: 'overwrite' | 'merge' = 'overwrite'
  ): Promise<{ success: boolean; message?: string; stats?: any; data?: FullAppState }> {
    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, backupData }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      console.error('Failed to import backup:', e);
      return { success: false, message: e.message || 'Import failed' };
    }
    return { success: false, message: 'Server responded with an error' };
  },

  async saveAllDatabase(data: Partial<FullAppState>): Promise<{ success: boolean; data?: FullAppState }> {
    try {
      const res = await fetch('/api/database/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to save all database state:', e);
    }
    return { success: false };
  },

  async getOrders(): Promise<Order[]> {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders)) {
          return json.orders;
        }
      }
    } catch (e) {
      console.warn('API /api/orders unavailable, using cache:', e);
    }
    const savedOrders = localStorage.getItem('uchiro_orders');
    return savedOrders ? JSON.parse(savedOrders) : INITIAL_ORDERS;
  },

  async createOrder(order: Order): Promise<boolean> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async sendTelegramOrderAlert(order: Order): Promise<{
    success: boolean;
    dispatched: boolean;
    status: 'success' | 'failed';
    textPreview?: string;
    productName?: string;
    buyerUsername?: string;
  }> {
    try {
      const res = await fetch('/api/telegram/send-order-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to send telegram order alert:', e);
    }
    return { success: false, dispatched: false, status: 'failed' };
  },

  async resendTelegramOrderAlert(orderId: string): Promise<{
    success: boolean;
    dispatched: boolean;
    status: 'success' | 'failed';
    order?: Order;
  }> {
    try {
      const res = await fetch(`/api/telegram/resend-order-alert/${encodeURIComponent(orderId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to resend telegram alert:', e);
    }
    return { success: false, dispatched: false, status: 'failed' };
  },

  async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'delivered' | 'rejected',
    token?: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteOrder(orderId: string, token?: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to delete order:', e);
      return false;
    }
  },

  async deleteOrdersByStatus(status?: string, token?: string): Promise<boolean> {
    try {
      const url = status ? `/api/orders?status=${encodeURIComponent(status)}` : '/api/orders';
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to delete orders by status:', e);
      return false;
    }
  },

  async updateSettings(settings: StoreSettings, token?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(settings),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateSongs(songs: SongTrack[], token?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ songs }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async createCoupon(coupon: Coupon, token?: string): Promise<Coupon> {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(coupon),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        return data.coupon;
      }
    } catch (e) {
      console.error(e);
    }
    return coupon;
  },

  async addCoupon(coupon: Coupon): Promise<boolean> {
    const c = await this.createCoupon(coupon);
    return !!c;
  },

  async toggleCoupon(code: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/coupons/${code}/toggle`, {
        method: 'PUT',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async topUpBalance(amountUSD: number): Promise<boolean> {
    try {
      const res = await fetch('/api/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUSD }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async adminLogin(
    username: string,
    password: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Login failed' };
    }
  },

  async uploadImage(fileOrBase64: string): Promise<string> {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: fileOrBase64 }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    } catch (e) {
      console.error('Image upload failed:', e);
    }
    return fileOrBase64;
  },

  async checkRobloxProfile(username: string): Promise<{ success: boolean; profile?: RobloxProfile; error?: string; source?: string }> {
    try {
      const res = await fetch('/api/roblox/check-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      return data;
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error checking Roblox profile' };
    }
  },

  // Reseller / Voucher Codes API
  async getResellerCodes(): Promise<any[]> {
    try {
      const res = await fetch('/api/reseller-codes');
      if (res.ok) {
        const data = await res.json();
        return data.resellerCodes || [];
      }
    } catch (e) {
      console.error('Failed to fetch reseller codes:', e);
    }
    return [];
  },

  async createResellerCode(codeData: any): Promise<{ success: boolean; code?: any; error?: string }> {
    try {
      const res = await fetch('/api/reseller-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(codeData),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create reseller code' };
    }
  },

  async deleteResellerCode(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/reseller-codes/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async toggleResellerCode(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/reseller-codes/${id}/toggle`, { method: 'PUT' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async redeemCode(
    code: string,
    username?: string
  ): Promise<{
    success: boolean;
    error?: string;
    message?: string;
    amountUSD?: number;
    newBalance?: number;
    isResellerUnlocked?: boolean;
    rank?: string;
    type?: string;
    userProfile?: UserProfile;
  }> {
    try {
      const res = await fetch('/api/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, username }),
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error redeeming code' };
    }
  },

  // Referral Validation & Processing
  async validateReferralCode(
    code: string,
    currentUsername?: string
  ): Promise<{
    valid: boolean;
    error?: string;
    friendBonusPercent?: number;
    referrerBonusPercent?: number;
    message?: string;
  }> {
    try {
      const url = `/api/referral/validate/${encodeURIComponent(code)}?currentUsername=${encodeURIComponent(currentUsername || '')}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Referral validation failed:', e);
    }
    return { valid: false, error: 'Could not validate referral code' };
  },

  async processReferralTopup(
    amountUSD: number,
    referralCode?: string,
    buyerUsername?: string
  ): Promise<{
    success: boolean;
    friendBonusUSD?: number;
    referrerBonusUSD?: number;
    userProfile?: UserProfile;
  }> {
    try {
      const res = await fetch('/api/referral/process-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUSD, referralCode, buyerUsername }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Process referral topup error:', e);
    }
    return { success: false };
  },
};

export const Api = api;
