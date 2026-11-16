import type { ChartPayload, ChartStrategy, ChartTrace, MountedChart, SeriesKind } from './strategies/chart-strategy';

const CHART_KINDS = ['chart', 'bar', 'line', 'pie'] as const;

type ChartKind = (typeof CHART_KINDS)[number];

export class ChartFactory {
    private readonly strategies = new Map<string, ChartStrategy>();

    constructor(strategies: readonly ChartStrategy[]) {
        strategies.forEach((strategy) => this.strategies.set(strategy.view, strategy));
    }

    create(element: HTMLElement): MountedChart {
        const payload = this.parsePayload(element);
        const strategy = this.strategies.get(payload.view);

        if (!strategy) {
            throw new Error(
                `Chart "${payload.data.key}" asks for the view "${payload.view}", which no chart strategy draws. ` +
                    `Set ChartDataTransfer.view, or chartView in a chart template rendered by hand, to one of ` +
                    `${[...this.strategies.keys()].join(', ')}, or pass a ` +
                    'strategy for it to the ChartFactory in spryker-zed-chart-main.entry.ts.',
            );
        }

        return strategy.mount(element, payload);
    }

    private parsePayload(element: HTMLElement): ChartPayload {
        let parsed: unknown;

        try {
            parsed = JSON.parse(element.dataset.chart ?? '');
        } catch (error) {
            throw new Error(
                `Chart element has an invalid data-chart attribute: ${error instanceof Error ? error.message : String(error)}. ` +
                    'Render it with the Chart twig functions (chart, bar_chart, line_chart, pie_chart) instead of writing the attribute by hand.',
            );
        }

        const key = this.isRecord(parsed) && this.isRecord(parsed.data) ? this.toText(parsed.data.key) : '';

        if (!this.isRecord(parsed) || !this.isRecord(parsed.data) || !Array.isArray(parsed.data.traces)) {
            throw new Error(
                `Chart "${key}" has a data-chart payload without data.traces. ` +
                    'Check that the chart plugin returns a ChartDataTransfer and that the twig partial passes it as data.',
            );
        }

        if (!CHART_KINDS.includes(parsed.kind as ChartKind)) {
            throw new Error(
                `Chart "${key}" has an unknown kind "${this.toText(parsed.kind)}". ` +
                    `Use one of ${CHART_KINDS.join(', ')} as chartKind in the twig include.`,
            );
        }

        const kind = parsed.kind as ChartKind;

        return {
            view: this.toText(parsed.data.view),
            templates: this.readTemplates(element),
            data: {
                key,
                title: this.toText(parsed.data.title),
                traces: parsed.data.traces.map((trace) => this.parseTrace(kind, trace)),
            },
        };
    }

    private readTemplates(element: HTMLElement): Record<string, HTMLTemplateElement> {
        const templates = element.querySelectorAll<HTMLTemplateElement>(':scope > template[data-chart-template]');

        return Object.fromEntries([...templates].map((template) => [template.dataset.chartTemplate ?? '', template]));
    }

    private parseTrace(kind: ChartKind, value: unknown): ChartTrace {
        const trace = this.isRecord(value) ? value : {};

        return {
            name: this.toText(trace.name),
            seriesKind: this.resolveSeriesKind(kind, trace.type),
            labels: this.toList(trace.labels).map((label) => this.toText(label)),
            values: this.toList(trace.values),
            options: this.toList(trace.options),
        };
    }

    // `scatter` is the wire value of ChartConfig::CHART_TYPE_LINE, kept from the Plotly era.
    private resolveSeriesKind(kind: ChartKind, traceType: unknown): SeriesKind {
        const type = kind === 'chart' ? traceType : kind;

        if (type === 'pie') {
            return 'pie';
        }

        return type === 'scatter' || type === 'line' ? 'line' : 'bar';
    }

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    // PHP serialises an array with non-sequential keys as a JSON object, so both shapes are lists here.
    private toList(value: unknown): unknown[] {
        if (Array.isArray(value)) {
            return value;
        }

        return this.isRecord(value) ? Object.values(value) : [];
    }

    private toText(value: unknown): string {
        return value === null || value === undefined ? '' : String(value);
    }
}
