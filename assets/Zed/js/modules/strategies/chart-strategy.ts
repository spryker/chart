export type SeriesKind = 'bar' | 'line' | 'pie';

export const ERROR_STATE_TEMPLATE = 'error-state';

export interface ChartTrace {
    name: string;
    seriesKind: SeriesKind;
    labels: string[];
    values: unknown[];
    options: unknown[];
}

export interface ChartPayload {
    view: string;
    data: {
        key: string;
        title: string;
        traces: ChartTrace[];
    };
    templates: Record<string, HTMLTemplateElement>;
}

export interface MountedChart {
    update?(): void;
}

export interface ChartStrategy {
    readonly view: string;
    mount(element: HTMLElement, payload: ChartPayload): MountedChart;
}

export const cloneTemplateRoot = (template: HTMLTemplateElement | null | undefined): HTMLElement | null => {
    const element = template?.content.firstElementChild?.cloneNode(true);

    return element instanceof HTMLElement ? element : null;
};

export abstract class AbstractChartStrategy implements ChartStrategy {
    abstract readonly view: string;

    abstract mount(element: HTMLElement, payload: ChartPayload): MountedChart;

    protected renderTemplate(payload: ChartPayload, name: string): HTMLElement {
        const element = cloneTemplateRoot(payload.templates[name]);

        if (!element) {
            throw new Error(
                `Chart "${payload.data.key}" has no "${name}" template. Add <template data-chart-template="${name}"> ` +
                    `with one root element to @ChartGui/Chart/strategies/${this.view}-chart-strategy.twig. A template ` +
                    'of the strategy this one extends comes from including that twig there; a template every view ' +
                    'shares belongs in chart-strategy.twig.',
            );
        }

        return element;
    }

    protected findSlot(root: HTMLElement, name: string): HTMLElement {
        const selector = `[data-chart-slot="${name}"]`;
        const slot = root.matches(selector) ? root : root.querySelector<HTMLElement>(selector);

        if (!slot) {
            throw new Error(
                `A chart template has no data-chart-slot="${name}" element. ` +
                    "Add it to that template in the strategy's twig in @ChartGui/Chart/strategies/.",
            );
        }

        return slot;
    }

    protected fillSlot(root: HTMLElement, name: string, text: string): HTMLElement {
        const slot = this.findSlot(root, name);

        slot.textContent = text;

        return slot;
    }

    protected buildEmptyState(payload: ChartPayload): HTMLElement {
        return this.renderTemplate(payload, 'empty-state');
    }

    protected buildErrorState(payload: ChartPayload): HTMLElement | null {
        return cloneTemplateRoot(payload.templates[ERROR_STATE_TEMPLATE]);
    }

    protected toNumber(value: unknown): number {
        const number = Number(value);

        return Number.isFinite(number) ? number : 0;
    }

    protected formatNumber(value: number): string {
        return new Intl.NumberFormat(this.readLocale()).format(value);
    }

    protected formatDay(label: string, withWeekday: boolean): string {
        return new Intl.DateTimeFormat(this.readLocale(), {
            weekday: withWeekday ? 'short' : undefined,
            day: 'numeric',
            month: 'short',
        }).format(this.parseIsoDate(label));
    }

    protected formatShare(value: number, total: number): string {
        return new Intl.NumberFormat(this.readLocale(), {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }).format(total > 0 ? value / total : 0);
    }

    protected replaceCount(element: HTMLElement, count: number): HTMLElement {
        element.textContent = (element.textContent ?? '').replace('%count%', this.formatNumber(count));

        return element;
    }

    protected buildCount(payload: ChartPayload, templateName: string, count: number): HTMLElement {
        const element = this.renderTemplate(payload, templateName);
        const category = new Intl.PluralRules(this.readLocale()).select(count);
        const variants = [...element.querySelectorAll<HTMLElement>('[data-chart-plural]')];
        const variant =
            variants.find((candidate) => candidate.dataset.chartPlural === category) ??
            variants.find((candidate) => candidate.dataset.chartPlural === 'other');

        if (!variant) {
            throw new Error(
                `The "${templateName}" chart template has no data-chart-plural="other" element. ` +
                    "Add it to that template in the strategy's twig in @ChartGui/Chart/strategies/.",
            );
        }

        variants.filter((candidate) => candidate !== variant).forEach((candidate) => candidate.remove());
        this.replaceCount(variant, count);

        return element;
    }

    // ISO days are read as local calendar dates: `new Date('2026-10-22')` would be UTC midnight and can
    // show the previous day west of Greenwich.
    private parseIsoDate(label: string): Date {
        const [year, month, day] = label.split('-').map(Number);

        return new Date(year, month - 1, day);
    }

    private readLocale(): string | undefined {
        return document.documentElement.lang || undefined;
    }
}
