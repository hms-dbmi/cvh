// "1 file", "3 files", "1,200 files".
export default function plural(count: number, noun: string) {
  return `${count.toLocaleString()} ${noun}${count === 1 ? "" : "s"}`;
}
