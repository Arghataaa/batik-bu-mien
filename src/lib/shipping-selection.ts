type PendingRate = {
  orderId: string;
  postalCode: string;
  totalWeight: number;
  courierCode: string;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  cost: number;
  etd?: string;
  expiresAt: number;
};

const pendingRates = new Map<string, PendingRate>();
const TTL = 10 * 60 * 1000;

export function savePendingRate(rate: Omit<PendingRate, "expiresAt">) {
  const key = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  pendingRates.set(key, { ...rate, expiresAt: Date.now() + TTL });
  return key;
}

export function getPendingRate(key: string) {
  const rate = pendingRates.get(key);
  if (!rate || rate.expiresAt < Date.now()) {
    pendingRates.delete(key);
    return null;
  }
  return rate;
}

export function deletePendingRate(key: string) {
  pendingRates.delete(key);
}

// In-memory only. Safe for local single-instance development, not multi-instance production.
