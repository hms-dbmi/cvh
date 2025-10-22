import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface TypographyVariants {
    overlineSmall: React.CSSProperties;
  }

  // allow configuration using `createTheme()`
  interface TypographyVariantsOptions {
    overlineSmall?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    overlineSmall: true;
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#000000", // Black - primary action
      contrastText: "#FFFFFF", // White text on black
    },
    secondary: {
      main: "#FFFFFF", // White buttons / secondary surfaces
      contrastText: "#000000",
    },
    grey: {
      50: "#F5F7FA", // App background (soft neutral)
      100: "#EFF3F5", // Gray01
      200: "#E2E9EC", // Gray03
      300: "#CAD5DA", // Gray04
      400: "#8A9EA8", // Gray05
      600: "#657681", // Gray06
      800: "#4E5A63", // Gray08
    },
    divider: "#CAD5DA", // Gray04
    background: {
      default: "#F5F7FA", // App background
      paper: "#FFFFFF", // Cards, modals, tables
    },
    text: {
      primary: "#000000",
      secondary: "#4E5A63",
    },
  },

  typography: {
    fontFamily: '"Helvetica Neue", "Arial", sans-serif',

    // Headlines
    h1: {
      // Headline/Large
      fontSize: "32px",
      fontWeight: 400,
      lineHeight: "40px",
    },
    h2: {
      // Headline/Medium
      fontSize: "28px",
      fontWeight: 400,
      lineHeight: "36px",
    },
    h3: {
      // Headline/Small
      fontSize: "24px",
      fontWeight: 400,
      lineHeight: "32px",
    },

    // Titles
    h4: {
      // Title/Large
      fontSize: "22px",
      fontWeight: 500,
      lineHeight: "28px",
    },
    h5: {
      // Title/Medium
      fontSize: "16px",
      fontWeight: 500,
      lineHeight: "24px",
      letterSpacing: "0.15px",
    },
    h6: {
      // Title/Small
      fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: "20px",
      letterSpacing: "0.1px",
    },

    // Button Text Bold
    button: {
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: "130%", // ~18.2px
      letterSpacing: "0.28px",
      textTransform: "none",
    },

    // Body
    body1: {
      // Body/Large
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: "24px",
      letterSpacing: "0.5px",
    },
    body2: {
      // Body/Medium
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: "20px",
      letterSpacing: "0.25px",
    },

    // Labels
    subtitle1: {
      // Label/Large
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: "20px",
      letterSpacing: "0.1px",
    },
    subtitle2: {
      // Label/Medium
      fontSize: "12px",
      fontWeight: 500,
      lineHeight: "16px",
      letterSpacing: "0.5px",
    },
    caption: {
      // Label/Small
      fontSize: "11px",
      fontWeight: 500,
      lineHeight: "16px",
      letterSpacing: "0.5px",
    },

    // Overlines
    overline: {
      // Label/Overline Large
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: "20px",
      letterSpacing: "1px",
      textTransform: "uppercase",
    },
    overlineSmall: {
      // Custom
      fontSize: "12px",
      fontWeight: 400,
      lineHeight: "20px",
      letterSpacing: "1px",
      textTransform: "uppercase",
    },
  },
});

export default theme;
