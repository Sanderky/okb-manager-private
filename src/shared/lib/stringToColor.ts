export const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const goldenAngle = 137.508;
  const h = Math.abs((hash * goldenAngle) % 360);
  const l = 40 + (Math.abs(hash) % 20);
  const s = 65;

  return `hsl(${h}, ${s}%, ${l}%)`;
};