import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  codeDisplay: {
    fontSize: 14,
    color: "#B2BEC3",
    fontWeight: "bold",
    marginBottom: 20,
    letterSpacing: 2,
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2D3436",
    marginBottom: 8,
    textAlign: "center",
  },
  previewCard: {
    backgroundColor: "#ffffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000000ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B2BEC3",
    marginBottom: 8,
    letterSpacing: 1,
  },
  previewText: {
    fontSize: 20,
    color: "#2D3436",
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#ffffffff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#DFE6E9",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#0984E3",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  themeContainer: {
    marginBottom: 20,
    width: "100%",
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B2BEC3",
    marginBottom: 8,
    letterSpacing: 1,
  },
  scrollContainer: {
    flexGrow: 0, // Don't expand to fill screen
    marginBottom: 10, // Space below the scroller
    paddingVertical: 10, // Add room for shadows so they don't get clipped
    // marginHorizontal: -20, // Optional: Lets it scroll edge-to-edge?
  },

  scrollContent: {
    flexDirection: "row", // Keep items horizontal
    gap: 16, // Increase gap slightly for better touch targets
    paddingHorizontal: 4, // Tiny padding at the start
    paddingRight: 20, // Space at the end
    alignItems: "center", // Center circles vertically in the scroll track
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent", // Invisible border normally
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedCircle: {
    borderColor: "#0984E3", // Blue ring when selected
    transform: [{ scale: 1.1 }], // Slightly bigger
  },
  // ... existing styles ...

  // TABS
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E0E0E0", // Grey background for the pill
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontWeight: "bold", color: "#9E9E9E" },
  activeTabText: { color: "#2D3436" },

  // STICKERS
  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    marginBottom: 20,
    minHeight: 120, // Match input height roughly so layout doesn't jump
    alignItems: "center",
  },
  stickerButton: {
    width: 70,
    height: 70,
    backgroundColor: "#FFF",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    elevation: 2,
  },
  selectedSticker: {
    borderColor: "#0984E3",
    backgroundColor: "#E3F2FD",
    transform: [{ scale: 1.05 }],
  },
  preViewCardFooter: {
    marginTop: 12,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preViewCardFooterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B2BEC3",
    textTransform: "uppercase",
  },
  historyTitle: {
    // marginBottom: 30,
    fontWeight: "bold",
    color: "#B2BEC3",
    letterSpacing: 1,
    fontSize: 12,
  },
  historyItem: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4d4d4ff",
    height: 70,
    flex: 1,
    justifyContent: "center",
    //     shadowColor: "#000000ff",
    // shadowOffset: { width: 4, height: 4 },
    // shadowOpacity: 0.5,
    // shadowRadius: 5,
    // elevation: 3,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  historySender: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF4081",
  },
  historyTime: {
    fontSize: 10,
    color: "#B2BEC3",
  },
  historyText: {
    color: "#2D3436",
    fontSize: 14,
  },

  historyContainer: {
    marginBottom: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 20,
    overflow: "scroll",
    shadowColor: "#000000ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  historyHeaderRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  expandIcon: {
    fontSize: 14,
    color: "#B2BEC3",
    fontWeight: "bold",
  },

  // FADE EFFECT (Gradient trick without using a gradient library)
  fadeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.8)", // Semi-transparent white
  },
});

export default styles;
