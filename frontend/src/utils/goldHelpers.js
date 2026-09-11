export const RATES_KEY = "rates-log";
export const PURCHASES_KEY = "purchases-log";
export const TARGET_KEY = "target-profit-per-gram";

export const uid = (prefix = "id") => {
  const d = new Date();
  const dateStr = d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const timeStr = String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${dateStr}_${timeStr}_${rand}`;
};


export const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

export const nowTime = () => {
  const d = new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

export const inr = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "₹" + Math.round(n).toLocaleString("en-IN");
};

export const fmtCompactINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : (val > 0 ? "+" : "");
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  return sign + inr(abs);
};

export const getEntryTimestamp = (item) => {
  if (!item) return 0;
  
  if (item.date) {
    let timeStr = item.time || "00:00 AM";
    const match = timeStr.match(/(\d+):(\d+)(?:\:(\d+))?\s*(AM|PM)?/i);
    let hours = 0, minutes = 0, seconds = 0;
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      if (match[3]) seconds = parseInt(match[3], 10);
      const ampm = match[4] ? match[4].toUpperCase() : null;
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
    }
    const parts = item.date.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const dt = new Date(parts[0], parts[1] - 1, parts[2], hours, minutes, seconds);
      if (!isNaN(dt.getTime())) {
        return dt.getTime();
      }
    }
  }
  
  if (typeof item.createdAt === "number" && !isNaN(item.createdAt)) {
    return item.createdAt;
  }
  
  return 0;
};

export const compareEntriesDesc = (a, b) => {
  const tsA = getEntryTimestamp(a);
  const tsB = getEntryTimestamp(b);
  if (tsA !== tsB) {
    return tsB - tsA; // Newest timestamp first
  }
  const ca = a.createdAt || 0;
  const cb = b.createdAt || 0;
  if (ca !== cb) return cb - ca;
  return 0;
};

export const compareEntriesAsc = (a, b) => {
  const tsA = getEntryTimestamp(a);
  const tsB = getEntryTimestamp(b);
  if (tsA !== tsB) {
    return tsA - tsB; // Oldest timestamp first
  }
  const ca = a.createdAt || 0;
  const cb = b.createdAt || 0;
  if (ca !== cb) return ca - cb;
  return 0;
};

export const inr2 = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

export const fmtDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
};

export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 320;
        let w = img.width, h = img.height;
        if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fetchGoodReturns22KRate() {
  const parseRateFromHtml = (html) => {
    if (!html) return null;
    const m = html.match(/22k\s*Gold[^]*?class="[^"]*ticker-value[^"]*">\s*₹?\s*([0-9,]+)/i)
      || html.match(/₹?\s*([0-9,]{4,6})\s*per gram for 22 karat/i)
      || html.match(/22k\s*Gold[^]*?₹\s*([0-9,]{4,6})/i)
      || html.match(/22\s*Karat[^\d]{1,100}₹?\s*([0-9,]{4,6})/i);
    if (m && m[1]) {
      const val = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 1000 && val < 50000) return val;
    }
    return null;
  };

  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const apiBaseUrl = import.meta.env.VITE_API_URL || "https://kacha-gold.onrender.com/api";
  const targetUrl = 'https://www.goodreturns.in/gold-rates/';
  const endpoints = [
    { url: `${baseUrl}/api/goodreturns/index.php`, type: 'text' },
    { url: `${baseUrl}/api/goodreturns/`, type: 'text' },
    { url: `${baseUrl}/api/goodreturns`, type: 'text' },
    { url: `${apiBaseUrl}/rates/goodreturns`, type: 'backend-json' },
    { url: 'https://api.allorigins.win/get?url=' + encodeURIComponent(targetUrl) + '&t=' + Date.now(), type: 'json' },
    { url: 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(targetUrl), type: 'text' },
    { url: 'https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl), type: 'text' }
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { cache: 'no-cache', signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        if (ep.type === 'backend-json') {
          const json = await res.json();
          if (json.success && json.rate) {
            return { rate: json.rate, source: json.source || 'GoodReturns.in', success: true };
          }
        } else {
          let text = '';
          if (ep.type === 'json') {
            const json = await res.json();
            text = json.contents || '';
          } else {
            text = await res.text();
          }
          const rate = parseRateFromHtml(text);
          if (rate) {
            return { rate, source: 'GoodReturns.in', success: true };
          }
        }
      }
    } catch (e) {
      console.warn('GoodReturns fetch attempt failed for endpoint:', ep.url);
    }
  }

  // Live Market Gold API Fallback if GoodReturns scraper is blocked
  try {
    const res = await fetch('https://api.gold-api.com/price/XAU', { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.price) {
        // Price in USD / oz -> 1 oz = 31.1034768g, 22K = 22/24 purity, USD/INR ~ 86.5
        const usdPerGram24k = data.price / 31.1034768;
        const usdPerGram22k = usdPerGram24k * (22 / 24);
        const inrPerGram22k = Math.round(usdPerGram22k * 86.5);
        if (inrPerGram22k > 5000 && inrPerGram22k < 25000) {
          return { rate: inrPerGram22k, source: 'Live Market Rate (GoldAPI)', success: true };
        }
      }
    }
  } catch (err) {
    console.warn('GoldAPI fallback failed:', err);
  }

  return { rate: null, source: 'GoodReturns.in', success: false };
}
