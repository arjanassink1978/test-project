/**
 * WARM & MINIMAL FORUM DESIGN THEME
 *
 * Green-primary with warm neutrals & excellent contrast
 * Color palette: Off-white backgrounds + warm gray UI + green accents + charcoal text
 * Typography: Clean, readable sans-serif
 * Vibe: Professional, warm, timeless
 *
 * Sections:
 *  1. Colors & palette
 *  2. Typography
 *  3. Spacing & layout
 *  4. Borders & radius
 *  5. Shadows & depth
 *  6. Interactive states
 *  7. Composite patterns
 */

// ---------------------------------------------------------------------------
// 1. Colors & Palette
// ---------------------------------------------------------------------------

export const colors = {
  // Primary: Soft Green (links, primary actions, accents)
  green: {
    50: "bg-emerald-50",
    100: "bg-emerald-100",
    500: "bg-emerald-500",
    600: "bg-emerald-600",
    700: "bg-emerald-700",
    text600: "text-emerald-600",
    text700: "text-emerald-700",
    border200: "border-emerald-200",
    hoverBg50: "hover:bg-emerald-50",
    focusRing: "focus:ring-emerald-500",
  },

  // Secondary: Green accent colors (UI elements, borders, subtle accents)
  warmGray: {
    50: "bg-green-50",
    100: "bg-green-100",
    200: "bg-green-200",
    300: "bg-green-300",
    text500: "text-green-600",
    border200: "border-green-200",
    border300: "border-green-300",
  },

  // Neutral: Cool Grays for text & hierarchy
  gray: {
    50: "bg-gray-50",
    100: "bg-gray-100",
    200: "bg-gray-200",
    300: "bg-gray-300",
    400: "bg-gray-400",
    500: "bg-gray-500",
    text500: "text-gray-500",
    text600: "text-gray-600",
    text700: "text-gray-700",
    text800: "text-gray-800",
    text900: "text-gray-900",
    border200: "border-gray-200",
    border300: "border-gray-300",
  },

  // Background: Off-white/Cream for main surfaces
  background: {
    50: "bg-slate-50",
    100: "bg-slate-100",
    page: "bg-gray-50",
  },

  // Error/Danger: Red
  red: {
    50: "bg-red-50",
    600: "bg-red-600",
    700: "bg-red-700",
    text600: "text-red-600",
    text700: "text-red-700",
    border200: "border-red-200",
  },

  // Score/vote indicator colors (indigo = positive, red = negative)
  score: {
    positive: "bg-indigo-50 text-indigo-600",
    negative: "bg-red-50 text-red-600",
    positiveText: "text-indigo-600",
    negativeText: "text-red-600",
  },
} as const;

// ---------------------------------------------------------------------------
// 2. Typography
// ---------------------------------------------------------------------------

export const typography = {
  // Page heading - bold, dark charcoal
  pageHeading: "text-3xl font-bold text-gray-900",

  // Large heading
  largeHeading: "text-2xl font-bold text-gray-900",

  // Section heading
  sectionHeading: "text-lg font-semibold text-gray-900",

  // Dashboard/page heading
  dashboardHeading: "text-2xl font-bold text-gray-900",

  // Labels
  label: "block text-sm font-semibold text-gray-800 mb-2",
  metaLabel: "text-xs font-semibold uppercase tracking-wider text-gray-600",

  // Body text - excellent readability with dark charcoal
  bodyText: "text-sm leading-relaxed text-gray-700",
  bodyTextLg: "text-base leading-relaxed text-gray-700",
  bodyValue: "text-sm font-medium text-gray-900",

  // Helper/secondary text
  helperText: "text-xs text-gray-500",

  // Error text
  errorText: "text-sm font-medium text-red-700",

  // Character counter
  charCounter: "text-xs text-gray-500 text-right mt-1",

  // Thread list: title
  threadTitle: "text-sm font-medium text-gray-900",

  // Thread list: meta row (author, category, reply count)
  threadMeta: "mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500",

  // Inline loading text
  loadingText: "text-gray-600",
} as const;

// ---------------------------------------------------------------------------
// 3. Spacing & Layout
// ---------------------------------------------------------------------------

export const spacing = {
  // Page padding
  pagePadding: "px-4 py-8 md:px-6 md:py-12",
  pageCenter: "flex min-h-screen flex-col items-center justify-center",

  // Sections
  formSpacing: "space-y-4",
  sectionSpacing: "space-y-6",

  // Cards & containers
  cardPadding: "px-4 py-4",
  cardPaddingLg: "px-6 py-6",

  // Navigation
  navPadding: "px-4 py-3",

  // Inputs
  inputPadding: "px-3 py-2",

  // Buttons
  buttonPadding: "px-4 py-2",
  buttonPaddingLg: "px-5 py-2.5",
  buttonPaddingIcon: "px-3 py-2",
} as const;

// ---------------------------------------------------------------------------
// 4. Borders & Radius
// ---------------------------------------------------------------------------

export const borders = {
  // Input borders
  inputBorderDefault: "border border-gray-300",
  inputBorderError: "border border-red-300",

  // Card styling - green borders
  cardRing: "border border-green-200",
  avatarRing: "ring-2 ring-green-200",
  navRing: "border-b border-green-200",

  // Nesting border for threaded replies
  nestedReply: "border-l-2 border-gray-200",

  // Radius options
  radiusLg: "rounded-lg",
  radiusMd: "rounded-md",
  radiusSm: "rounded-sm",
  radiusXl: "rounded-xl",
  radiusFull: "rounded-full",
} as const;

// ---------------------------------------------------------------------------
// 5. Shadows & Depth
// ---------------------------------------------------------------------------

export const shadows = {
  // Subtle, minimal shadows
  sm: "shadow-sm",
  md: "shadow-md",
  none: "",
} as const;

// ---------------------------------------------------------------------------
// 6. Interactive States
// ---------------------------------------------------------------------------

export const states = {
  // Focus ring - green accent
  focusRing: "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
  focusVisible: "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600",

  // Disabled state
  disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  disabledInline: "cursor-not-allowed opacity-50",

  // Transitions
  transition: "transition-all duration-150",
  transitionFast: "transition-all duration-100",
} as const;

// ---------------------------------------------------------------------------
// 7. Composite Patterns
// ---------------------------------------------------------------------------

/**
 * Alert banners
 */
export const alert = {
  base: "rounded-md border px-3 py-2 text-sm font-medium",
  error: "rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm font-medium text-red-700",
  success: "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700",
  info: "rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm font-medium text-green-700",
} as const;

/**
 * Card - clean panel with warm gray borders
 */
export const card = {
  base: "bg-white border border-green-200 rounded-lg",
  padded: "bg-white border border-green-200 rounded-lg px-4 py-4",
  paddedLg: "bg-white border border-green-200 rounded-lg px-6 py-6",
  interactive: "bg-white border border-green-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all duration-150",
} as const;

/**
 * Text input / textarea
 */
export const input = {
  base: "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed",
  error: "w-full rounded-md border border-red-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed",
  textarea: "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  // Inline select matching input.base appearance
  select: "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500",
} as const;

/**
 * Buttons - Primary (green), Secondary (gray), Danger (red)
 */
export const button = {
  // Primary action - green
  primary:
    "flex w-full items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",

  // Primary action - larger
  primaryLg:
    "flex w-full items-center justify-center rounded-md bg-green-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors",

  // Primary action - auto width (for inline usage)
  primaryAuto:
    "inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",

  // Outline large
  outlineLg:
    "flex w-full items-center justify-center rounded-md bg-white border-2 border-green-600 px-5 py-2.5 text-base font-semibold text-green-600 hover:bg-green-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors",

  // Secondary - full width (gray)
  secondary:
    "flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors",

  // Secondary - inline (gray)
  secondaryInline:
    "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors",

  // Compact primary for category filters
  compactPrimary:
    "inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors",

  // Compact secondary for category filters
  compactSecondary:
    "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors",

  // Secondary - nav variant (logout button)
  secondaryNav:
    "inline-flex items-center justify-center gap-2 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors",

  // Danger - red
  danger:
    "inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",

  // Inline text button: green link-style (e.g. "Reply" toggle)
  inlineGreen: "text-xs text-emerald-600 hover:text-emerald-500",

  // Inline text button: red link-style (e.g. "Delete" in reply)
  inlineDanger: "text-xs text-red-600 hover:text-red-500 disabled:opacity-50",

  // Collapse/expand toggle for nested replies
  collapseToggle: "self-start mt-1 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border border-gray-300 bg-white text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors",

  // Spinner
  spinner: "mr-2 h-4 w-4 animate-spin",
} as const;

/**
 * Navigation bar
 */
export const nav = {
  bar: "w-full bg-white border-b border-green-200 sticky top-0 z-40",
  inner: "mx-auto flex max-w-6xl items-center justify-start gap-4 px-4 py-3 md:px-6 md:py-4",
} as const;

/**
 * Profile link - green-tinted
 */
export const profileLink = {
  base:
    "inline-flex items-center justify-center gap-2 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors",
} as const;

/**
 * Text links - green
 */
export const link = {
  primary: "font-medium text-green-600 hover:text-green-700 hover:underline transition-colors",
} as const;

/**
 * Avatar styling
 */
export const avatar = {
  image: "h-10 w-10 rounded-md object-cover bg-gray-100",
  placeholder: "flex h-10 w-10 items-center justify-center rounded-md bg-green-100",
  initial: "text-xs font-bold text-green-700",
  // Small round avatar used in reply headers
  replyAvatar: "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600",
} as const;

/**
 * Page layout wrappers
 */
export const layout = {
  // Standard page background
  page: "min-h-screen bg-gray-50",
  // Centered loading state
  loadingCenter: "min-h-screen bg-gray-50 flex items-center justify-center",
  // Loading spinner container
  loadingInner: "flex items-center gap-3 text-gray-600",
  // Page container with max-width and padding
  container: "mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12",
  // Centered page wrapper (login, register, home)
  centeredPage: "flex min-h-screen flex-col items-center justify-center px-4 py-12",
  // Standard main content area
  main: "mx-auto max-w-3xl px-4 py-8",
  // Empty state message
  emptyState: "text-center py-8",
} as const;

/**
 * Vote button widget (compact inline badge)
 */
export const vote = {
  // Container badge
  container: "inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs",
  // Upvote arrow button
  upvote: "rounded p-0.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
  // Upvote arrow button — active state (user has upvoted)
  upvoteActive: "rounded p-0.5 text-emerald-600 bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
  // Downvote arrow button
  downvote: "rounded p-0.5 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
  // Downvote arrow button — active state (user has downvoted)
  downvoteActive: "rounded p-0.5 text-red-600 bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
  // Score number — positive (green, matching primary)
  scorePositive: "min-w-[1.25rem] text-center font-semibold text-emerald-600",
  // Score number — negative
  scoreNegative: "min-w-[1.25rem] text-center font-semibold text-red-600",
} as const;

/**
 * Thread score badge (square, used in ThreadList)
 */
export const scoreBadge = {
  // Shared base: fixed size, text, rounded
  base: "inline-flex items-center justify-center w-10 h-10 text-xs font-bold rounded",
  // Positive (score >= 0): emerald (green theme primary)
  positive: "bg-emerald-50 text-emerald-600",
  // Negative (score < 0): red
  negative: "bg-red-50 text-red-600",
} as const;

/**
 * Thread closed badge (pill)
 */
export const closedBadge = {
  base: "inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700",
} as const;
