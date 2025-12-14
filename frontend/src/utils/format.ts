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
