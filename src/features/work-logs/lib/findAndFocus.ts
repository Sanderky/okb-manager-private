export const findAndFocus = (
  r: number,
  c: number,
  dRow: number,
  dCol: number,
  depth: number = 0
) => {
  if (depth > 20) return;

  const targetRow = r + dRow;
  const targetCol = c + dCol;

  if (targetCol < 0 || targetCol > 6) return;

  const targetId = `cell-${targetRow}-${targetCol}`;
  const element = document.getElementById(targetId) as HTMLInputElement;

  if (element) {
    element.focus();
    setTimeout(() => element.select(), 0);
  } else {
    findAndFocus(targetRow, targetCol, dRow, dCol, depth + 1);
  }
};
