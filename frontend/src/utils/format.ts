export const formatSubscriberCount = (count: number): string => {
  const thresholds = [
    100, 500, 1000, 3000, 5000, 8000,
    10000, 50000, 100000, 200000, 300000, 400000, 500000, 700000, 900000,
    1000000, 1500000
  ];

  let display = "100명 미만";

  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (count >= thresholds[i]) {
      const val = thresholds[i];
      if (val >= 10000) {
        display = `${val / 10000}만명+`;
      } else {
        display = `${val}명+`;
      }
      break;
    }
  }
  return display;
};

// 상대적 시간 포맷 (예: "방금 전", "5분 전", "2시간 전", "3일 전")
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
    return '방금 전';
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay < 7) {
    return `${diffDay}일 전`;
  } else if (diffWeek < 4) {
    return `${diffWeek}주 전`;
  } else if (diffMonth < 12) {
    return `${diffMonth}개월 전`;
  } else {
    return `${diffYear}년 전`;
  }
};

// 숫자 포맷 (예: 1200 -> "1.2k", 15000 -> "1.5만")
export const formatCount = (count: number): string => {
  if (count < 1000) {
    return count.toString();
  } else if (count < 10000) {
    return `${(count / 1000).toFixed(1)}k`;
  } else if (count < 100000000) {
    const wan = count / 10000;
    if (wan >= 10) {
      return `${Math.floor(wan)}만`;
    }
    return `${wan.toFixed(1)}만`;
  } else {
    const eok = count / 100000000;
    return `${eok.toFixed(1)}억`;
  }
};

// 날짜 포맷 (예: "2024.01.15")
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

// 날짜 및 시간 포맷 (예: "2024.01.15 14:30")
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hour}:${minute}`;
};
