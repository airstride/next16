"use client";

import { createTheme, rgba } from "@mantine/core";

export const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  headings: {
    fontFamily: "Clash Display, Space Grotesk, Inter, sans-serif",
    sizes: {
      h1: { fontSize: "60px", lineHeight: "1.2", fontWeight: "600" },
      h2: { fontSize: "48px", lineHeight: "1.2", fontWeight: "600" },
      h3: { fontSize: "40px", lineHeight: "1.2", fontWeight: "500" },
      h4: { fontSize: "32px", lineHeight: "1.2" },
      h5: { fontSize: "24px", lineHeight: "1.2" },
      h6: { fontSize: "18px", lineHeight: "1.2" },
    },
  },

  colors: {
    // Primary — Deep Indigo: intelligence, stability
    primary: [
      "#F2F3F8",
      "#E1E3F1",
      "#C9CCE6",
      "#9EA2CC",
      "#6E78B0",
      "#2B2D42", // main
      "#25283A",
      "#1F2233",
      "#1A1D2B",
      "#141722",
    ],

    // Accent — Electric Teal: growth, innovation
    accent: [
      "#E6FBF8",
      "#C0F6ED",
      "#9AF0E1",
      "#6BE8D5",
      "#3DE0C8",
      "#00C6AE", // main
      "#00B39E",
      "#009F8E",
      "#008C7E",
      "#00776C",
    ],

    // Secondary — Graphite Gray: neutral tech base
    secondary: [
      "#F5F6F7",
      "#E6E7E8",
      "#D1D2D3",
      "#A8A9AA",
      "#7D7E7F",
      "#3A3A3A", // main
      "#2E2E2E",
      "#232323",
      "#1A1A1A",
      "#121212",
    ],

    // Background — Mist White
    background: [
      "#FFFFFF",
      "#FCFDFE",
      "#F7F8FA", // main
      "#F2F3F5",
      "#EDEEF0",
      "#E8E9EB",
      "#E3E4E6",
      "#DEDFE1",
      "#D9DADC",
      "#D4D5D7",
    ],

    // Success / highlight — Lime Mint
    success: [
      "#F4FFF9",
      "#D7FFED",
      "#BFFCE1",
      "#A9F0D1", // main
      "#8EE5C0",
      "#73DAB0",
      "#5FCFA0",
      "#4AC490",
      "#38B980",
      "#25AE70",
    ],
  },

  primaryColor: "primary",
  primaryShade: 5,
  black: "#2B2D42",

  // 🪄 Global Styling
  defaultRadius: "md",
  cursorType: "pointer",
  fontSizes: {
    sm: "14px",
    md: "16px",
    lg: "18px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },

  components: {
    Button: {
      defaultProps: {
        radius: "md",
        size: "md",
        fw: 500,
        transition: "all 200ms ease",
      },
      styles: (theme: any, params: any) => ({
        root: {
          background:
            params.variant === "filled"
              ? `linear-gradient(90deg, ${theme.colors.primary[5]} 0%, ${theme.colors.accent[5]} 100%)`
              : "transparent",
          color:
            params.variant === "filled" ? theme.white : theme.colors.primary[5],
          border:
            params.variant === "outline"
              ? `1px solid ${rgba(theme.colors.primary[5], 0.4)}`
              : "none",
          "&:hover": {
            background:
              params.variant === "filled"
                ? `linear-gradient(90deg, ${theme.colors.primary[4]} 0%, ${theme.colors.accent[4]} 100%)`
                : rgba(theme.colors.primary[5], 0.05),
          },
        },
      }),
    },

    Card: {
      defaultProps: {
        radius: "md",
        shadow: "sm",
        padding: "lg",
        withBorder: true,
        style: {
          backgroundColor: "#FFFFFF",
          borderColor: "rgba(43, 45, 66, 0.05)",
          transition: "all 200ms ease",
        },
      },
      styles: {
        root: {
          "&:hover": {
            boxShadow:
              "0 4px 12px rgba(43, 45, 66, 0.08), 0 2px 4px rgba(43, 45, 66, 0.04)",
          },
        },
      },
    },

    Text: {
      defaultProps: {
        color: "#3A3A3A",
        lh: 1.5,
      },
    },

    Loader: {
      defaultProps: {
        color: "accent.5",
        type: "dots",
      },
    },
  },
});
