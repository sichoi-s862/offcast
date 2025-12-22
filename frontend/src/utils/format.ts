export const formatSubscriberCount = (count: number): string => {
  const thresholds = [
    100, 500, 1000, 3000, 5000, 8000,
    10000, 50000, 100000, 200000, 300000, 400000, 500000, 700000, 900000,
    1000000, 1500000
  ];

  let display = "< 100";

  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (count >= thresholds[i]) {
      const val = thresholds[i];
      if (val >= 1000000) {
        display = `${val / 1000000}M+`;
      } else if (val >= 1000) {
        display = `${val / 1000}K+`;
      } else {
        display = `${val}+`;
      }
      break;
    }
  }
  return display;
};

// Relative time format (e.g., "just now", "5m ago", "2h ago", "3d ago")
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else if (diffWeek < 4) {
    return `${diffWeek}w ago`;
  } else if (diffMonth < 12) {
    return `${diffMonth}mo ago`;
  } else {
    return `${diffYear}y ago`;
  }
};

// Number format (e.g., 1200 -> "1.2K", 15000 -> "15K")
export const formatCount = (count: number): string => {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    const k = count / 1000;
    if (k >= 10) {
      return `${Math.floor(k)}K`;
    }
    return `${k.toFixed(1)}K`;
  } else if (count < 1000000000) {
    const m = count / 1000000;
    if (m >= 10) {
      return `${Math.floor(m)}M`;
    }
    return `${m.toFixed(1)}M`;
  } else {
    const b = count / 1000000000;
    return `${b.toFixed(1)}B`;
  }
};

// Date format (e.g., "2024.01.15")
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

// Date and time format (e.g., "2024.01.15 14:30")
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hour}:${minute}`;
};
