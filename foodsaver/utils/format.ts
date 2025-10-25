export function formatPrice(price: number): string {
  return `${price.toFixed(0)}₴`;
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Щойно';
  if (diffMins < 60) return `${diffMins}хв тому`;
  if (diffHours < 24) return `${diffHours}год тому`;
  if (diffDays < 7) return `${diffDays}д тому`;

  return date.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('380')) {
    const match = cleaned.match(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/);
    if (match) {
      return `+${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
    }
  }
  return phone;
}
