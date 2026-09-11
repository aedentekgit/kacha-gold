const API_BASE_URL = import.meta.env.VITE_API_URL || "https://kacha-gold.onrender.com/api";

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const apiService = {
  // Rates API
  async getRates() {
    const res = await request("/rates");
    return res.data;
  },

  async addRate(rate) {
    const res = await request("/rates", {
      method: "POST",
      body: JSON.stringify(rate),
    });
    return res.data;
  },

  async updateRate(id, rate) {
    const res = await request(`/rates/${id}`, {
      method: "PUT",
      body: JSON.stringify(rate),
    });
    return res.data;
  },

  async deleteRate(id) {
    const res = await request(`/rates/${id}`, {
      method: "DELETE",
    });
    return res;
  },

  // Purchases API
  async getPurchases() {
    const res = await request("/purchases");
    return res.data;
  },

  async addPurchase(purchase) {
    const res = await request("/purchases", {
      method: "POST",
      body: JSON.stringify(purchase),
    });
    return res.data;
  },

  async updatePurchase(id, purchase) {
    const res = await request(`/purchases/${id}`, {
      method: "PUT",
      body: JSON.stringify(purchase),
    });
    return res.data;
  },

  async deletePurchase(id) {
    const res = await request(`/purchases/${id}`, {
      method: "DELETE",
    });
    return res;
  },

  // Settings API
  async getSettings() {
    const res = await request("/settings");
    return res.data;
  },

  async updateSettings(settings) {
    const res = await request("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    return res.data;
  },
};

export default apiService;
