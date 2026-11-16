export interface ChartTheme {
    palette: string[];
    primaryColor: string;
    textColor: string;
    mutedTextColor: string;
    borderColor: string;
    gridColor: string;
    surfaceColor: string;
    fontFamily: string;
}

interface ThemeToken {
    name: string;
    fallback: string;
}

const PRIMARY: ThemeToken = { name: 'primary', fallback: '#1ab394' };

// The order follows the dashboard design: primary, blue, gray. `success` and `teal` are left out: next to
// `primary` they read as the same slice in a donut.
const PALETTE: ThemeToken[] = [
    PRIMARY,
    { name: 'secondary', fallback: '#1c84c6' },
    { name: 'gray', fallback: '#8a969c' },
    { name: 'warning', fallback: '#f8ac59' },
    { name: 'purple', fallback: '#7b70ef' },
    { name: 'pink', fallback: '#ff679b' },
    { name: 'info', fallback: '#23c6c8' },
    { name: 'red', fallback: '#ed5565' },
];

const toCssValue = ({ name, fallback }: ThemeToken): string => `var(--ins-${name}, var(--bs-${name}, ${fallback}))`;

const readToken = (styles: CSSStyleDeclaration, { name, fallback }: ThemeToken): string =>
    styles.getPropertyValue(`--ins-${name}`).trim() || styles.getPropertyValue(`--bs-${name}`).trim() || fallback;

export const CSS_PRIMARY_COLOR = toCssValue(PRIMARY);
export const CSS_PALETTE = PALETTE.map(toCssValue);

export const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const readTheme = (): ChartTheme => {
    const styles = getComputedStyle(document.documentElement);

    return {
        palette: PALETTE.map((token) => readToken(styles, token)),
        primaryColor: readToken(styles, PRIMARY),
        textColor: readToken(styles, { name: 'body-color', fallback: '#4c4c5c' }),
        mutedTextColor: readToken(styles, { name: 'secondary-color', fallback: '#8391a2' }),
        borderColor: readToken(styles, { name: 'border-color', fallback: '#edf2f9' }),
        gridColor: readToken(styles, { name: 'tertiary-bg', fallback: '#f6f7fb' }),
        surfaceColor: readToken(styles, { name: 'secondary-bg', fallback: '#ffffff' }),
        fontFamily: readToken(styles, { name: 'body-font-family', fallback: 'sans-serif' }),
    };
};
