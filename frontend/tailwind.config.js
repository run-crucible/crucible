/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forge: { DEFAULT: "#120A07", deep: "#0A0706" },
        molten: { DEFAULT: "#FF6A1A", hot: "#FF3D00" },
        amber: { DEFAULT: "#FFB020" },
        ember: { DEFAULT: "#C2410C" },
        oxblood: { DEFAULT: "#7A1E12" },
        bone: { DEFAULT: "#E8D6B8", light: "#F2D9B0" },
        warm: { DEFAULT: "#8A6A4A" },
        held: { DEFAULT: "#5C7A66" },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        molten: "0 0 24px rgba(255,106,26,0.45)",
        ember: "0 0 12px rgba(194,65,12,0.5)",
      },
      keyframes: {
        flicker: {
          "0%,100%": { opacity: "0.96" },
          "50%": { opacity: "1" },
          "92%": { opacity: "0.88" },
        },
        shake: {
          "0%,100%": { transform: "translate(0,0) rotate(0deg)" },
          "15%": { transform: "translate(-6px,3px) rotate(-1.5deg)" },
          "30%": { transform: "translate(6px,-4px) rotate(1.5deg)" },
          "45%": { transform: "translate(-5px,-3px) rotate(-1deg)" },
          "60%": { transform: "translate(5px,4px) rotate(1deg)" },
          "75%": { transform: "translate(-3px,2px) rotate(-0.5deg)" },
          "90%": { transform: "translate(3px,-2px) rotate(0.5deg)" },
        },
        fracture: {
          "0%": { opacity: "0.9", transform: "scale(1.04)" },
          "15%": { opacity: "1",   transform: "scale(1.0)" },
          "40%": { opacity: "0.8", transform: "scale(1.0)" },
          "100%": { opacity: "0",  transform: "scale(1.0)" },
        },
        crackIn: {
          "0%": { strokeDashoffset: "200", opacity: "0" },
          "40%": { opacity: "1" },
          "100%": { strokeDashoffset: "0", opacity: "1" },
        },
        breakFlash: {
          "0%": { backgroundColor: "rgba(122,30,18,0.55)" },
          "100%": { backgroundColor: "transparent" },
        },
        stamp: {
          "0%": { transform: "scale(2.4)", opacity: "0", filter: "brightness(4)" },
          "60%": { transform: "scale(0.92)", opacity: "1", filter: "brightness(2.2)" },
          "100%": { transform: "scale(1)", opacity: "1", filter: "brightness(1)" },
        },
        emberPulse: {
          "0%,100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        blink: { "0%,49%": { opacity: "1" }, "50%,100%": { opacity: "0" } },
        riseGlow: {
          "0%": { opacity: "0.25" },
          "50%": { opacity: "0.6" },
          "100%": { opacity: "0.25" },
        },
        scanFlash: {
          "0%": { opacity: "0" },
          "8%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        flicker: "flicker 4s infinite",
        shake: "shake 0.55s ease-in-out",
        fracture: "fracture 0.65s ease-out forwards",
        crackIn: "crackIn 0.5s ease-out forwards",
        breakFlash: "breakFlash 0.8s ease-out forwards",
        stamp: "stamp 0.9s cubic-bezier(0.2,0.9,0.3,1) forwards",
        ember: "emberPulse 2s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
        riseGlow: "riseGlow 3s ease-in-out infinite",
        scanFlash: "scanFlash 0.65s ease-out forwards",
      },
    },
  },
  plugins: [],
};
