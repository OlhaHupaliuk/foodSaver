export function calculateDiscount(expiryTime: string, currentTime?: Date): number {
  const expiry = new Date(expiryTime);
  const now = currentTime || new Date();
  const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursLeft < 2) return 70;
  if (hoursLeft < 6) return 50;
  if (hoursLeft < 12) return 30;
  return 20;
}

export function calculateDiscountPrice(originalPrice: number, expiryTime: string): number {
  const discount = calculateDiscount(expiryTime);
  return Math.round(originalPrice * (1 - discount / 100));
}

export function getTimeUntilExpiry(expiryTime: string): string {
  const expiry = new Date(expiryTime);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs < 0) return 'Expired';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}хв`;
  if (hours < 24) return `${hours}год ${minutes}хв`;

  const days = Math.floor(hours / 24);
  return `${days}д`;
}
