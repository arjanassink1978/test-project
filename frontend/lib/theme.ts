/**
 * Centralized design token file.
 *
 * All Tailwind class strings used across components live here. Components
 * import the tokens they need so there is a single place to adjust the
 * visual language of the application.
 *
 * Sections:
 *  1. Colors
 *  2. Typography
 *  3. Spacing / layout
 *  4. Borders & radius
 *  5. Shadows
 *  6. Interactive states (focus, disabled, hover)
 *  7. Composite patterns  (alert, card, input, button, label, link, nav)
 */

// ---------------------------------------------------------------------------
// 1. Colors
// ---------------------------------------------------------------------------

export const colors = {
  // Indigo palette (primary brand color)
  indigo: {
    50:  "bg-indigo-50",
    100: "bg-indigo-100",
    600: "bg-indigo-600",
    text600: "text-indigo-600",
    text700: "text-indigo-700",
    border200: "border-indigo-200",
    hoverBg100: "hover:bg-indigo-100",
    hoverBg500: "hover:bg-indigo-500",
    hoverText500: "hover:text-indigo-500",
    focusOutline600: "focus-visible:outline-indigo-600",
    ring2: "focus:ring-indigo-500",
    borderFocus: "focus:border-indigo-500",
  },

  // Gray palette (neutral)
  gray: {
    50: "bg-gray-50",
    text400: "text-gray-400",
    text500: "text-gray-500",
    text600: "text-gray-600",
    text700: "text-gray-700",
    text900: "text-gray-900",
    border300: "border-gray-300",
    hoverBg50: "hover:bg-gray-50",
    ring5: "ring-gray-900/5",
    bg200: "ring-gray-200",
  },

  // Red palette (errors / destructive)
  red: {
    50:  "bg-red-50",
    border200: "border-red-200",
    text600: "text-red-600",
    text700: "text-red-700",
    border300: "border-red-300",
    hoverBg50: "hover:bg-red-50",
  },

  // Green palette (success)
  green: {
    50:  "bg-green-50",
    border200: "border-green-200",
    text700: "text-green-700",
  },
} as const;

// ---------------------------------------------------------------------------
// 2. Typography
// ---------------------------------------------------------------------------

export const typography = {
  pageHeading:   "text-2xl font-bold tracking-tight text-gray-900",
  largeHeading:  "text-4xl font-bold tracking-tight text-gray-900",
  sectionHeading:"text-base font-semibold text-gray-900",
  dashboardHeading: "text-2xl font-semibold text-gray-900",
  label:         "block text-sm font-medium text-gray-700 mb-1",
  metaLabel:     "text-xs font-medium uppercase tracking-wide text-gray-500",
  bodyText:      "text-sm text-gray-600",
  bodyTextLg:    "text-lg text-gray-600",
  bodyValue:     "mt-1 text-sm text-gray-900",
  helperText:    "text-xs text-gray-400",
  errorText:     "mt-1 text-sm text-red-600",
  charCounter:   "mt-1 text-xs text-gray-400 text-right",
} as const;

// ---------------------------------------------------------------------------
// 3. Spacing / layout
// ---------------------------------------------------------------------------

export const spacing = {
  pagePadding:   "px-4 py-12",
  pageCenter:    "flex min-h-screen flex-col items-center justify-center",
  formSpacing:   "space-y-5",
  sectionSpacing:"space-y-6",
  cardPadding:   "px-6 py-6",
  cardPaddingLg: "px-8 py-8",
  navPadding:    "px-6 py-3",
  inputPadding:  "px-3 py-2",
  buttonPadding: "px-4 py-2.5",
  buttonPaddingLg:"px-4 py-3",
  buttonPaddingIcon: "px-3 py-2",
} as const;

// ---------------------------------------------------------------------------
// 4. Borders & radius
// ---------------------------------------------------------------------------

export const borders = {
  inputBorderDefault: "border border-gray-300",
  inputBorderError:   "border border-red-300",
  cardRing:           "ring-1 ring-gray-900/5",
  avatarRing:         "ring-2 ring-gray-200",
  navRing:            "ring-1 ring-gray-900/5",
  radiusLg:           "rounded-lg",
  radiusMd:           "rounded-md",
  radiusXl:           "rounded-xl",
  radiusFull:         "rounded-full",
} as const;

// ---------------------------------------------------------------------------
// 5. Shadows
// ---------------------------------------------------------------------------

export const shadows = {
  sm:   "shadow-sm",
  md:   "shadow-md",
  none: "",
} as const;

// ---------------------------------------------------------------------------
// 6. Interactive states
// ---------------------------------------------------------------------------

export const states = {
  focusRing:      "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
  focusVisible:   "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
  disabled:       "disabled:opacity-50 disabled:cursor-not-allowed",
  disabledInline: "cursor-not-allowed opacity-50",
  transition:     "transition-colors",
} as const;

// ---------------------------------------------------------------------------
// 7. Composite patterns
// ---------------------------------------------------------------------------

/**
 * Alert banners — used in LoginForm, RegisterForm, ProfileForm.
 */
export const alert = {
  base:    "rounded-md border px-4 py-3 text-sm",
  error:   "rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700",
  success: "rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700",
} as const;

/**
 * Card / panel — white box with subtle shadow and ring.
 */
export const card = {
  base:   "rounded-xl bg-white shadow-md ring-1 ring-gray-900/5",
  padded: "rounded-xl bg-white px-6 py-6 shadow-md ring-1 ring-gray-900/5",
  paddedLg: "rounded-xl bg-white px-8 py-8 shadow-md ring-1 ring-gray-900/5",
} as const;

/**
 * Text input / textarea.
 *
 * Use `input.base` for normal state and `input.error` when a field has a
 * validation error (swaps the border color).
 */
export const input = {
  base:  "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm",
  error: "block w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:text-sm",
  textarea: "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm resize-none",
} as const;

/**
 * Buttons — primary (indigo filled), secondary (white/gray outlined),
 * danger (red outlined), and their loading-spinner wrapper.
 */
export const button = {
  /** Full-width primary action (submit / save). */
  primary:
    "flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",

  /** Full-width primary action — larger padding (home page links). */
  primaryLg:
    "flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors",

  /** Full-width secondary / outline link button (home page). */
  outlineLg:
    "flex w-full items-center justify-center rounded-lg bg-white border-2 border-indigo-600 px-4 py-3 text-base font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors",

  /** Inline secondary (e.g. avatar upload label, logout). */
  secondary:
    "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors",

  /** Inline secondary — fixed width, with gap for icon (logout, profile link). */
  secondaryNav:
    "inline-flex w-32 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors",

  /** Inline danger (e.g. delete avatar). */
  danger:
    "inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",

  /** Spinner class used inside loading buttons. */
  spinner: "mr-2 h-4 w-4 animate-spin",
} as const;

/**
 * Navigation bar — dashboard top nav.
 */
export const nav = {
  bar:     "w-full bg-white shadow-sm ring-1 ring-gray-900/5",
  inner:   "mx-auto flex max-w-5xl items-center justify-start gap-3 px-6 py-3",
} as const;

/**
 * Profile link (indigo tinted, nav variant).
 */
export const profileLink = {
  base:
    "inline-flex w-32 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors",
} as const;

/**
 * Inline text links (e.g. "Register here" / "Login here").
 */
export const link = {
  primary: "font-medium text-indigo-600 hover:text-indigo-500",
} as const;

/**
 * Avatar placeholder circle.
 */
export const avatar = {
  image:       "h-24 w-24 rounded-full object-cover ring-2 ring-gray-200",
  placeholder: "flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 ring-2 ring-gray-200",
  initial:     "text-2xl font-bold text-indigo-600",
} as const;
