// Themes
const THEMES = [
  { id: "duck_wink", color: "#f7cbb0", label: "🐣" },
  { id: "bunny", color: "#F0D0C1", label: "🐰" },
  { id: "duck_rain", color: "#D6DBE1", label: "🦆" },
  { id: "duck_clueless", color: "#FFD6D8", label: "🦢" },
  { id: "mm_hug", color: "#F7E1C9", label: "🐻" },
  { id: "beach", color: "#9EC9CB", label: "🌊" },
  { id: "mountain", color: "#f3ce7dff", label: "⛱️" },
];

// Sticker
const STICKERS = [
  { id: "sticker_heart", label: "❤️" },
  { id: "sticker_ghost", label: "👻" },
  { id: "sticker_frog", label: "🐸" },
  { id: "sticker_squirrel", label: "🐿️" },
  { id: "sticker_bunny", label: "🐰" },
  { id: "sticker_catsad", label: "😿" },
];

const senderColorMap: Record<string, string> = {};

const textColors = [
  "#D96E52",
  "#C15572",
  "#D88948",
  "#3A7E6F",
  "#3F6596",
  "#6A4BA6",
  "#B03E54",
  "#A07A52",
  "#2C747C",
  "#3B7992",
];

function getColorForSender(sender: string) {
  if (!senderColorMap[sender]) {
    const randomIndex = Math.floor(Math.random() * textColors.length);
    senderColorMap[sender] = textColors[randomIndex]!;
  }
  return senderColorMap[sender];
}

export { THEMES, STICKERS, getColorForSender };
