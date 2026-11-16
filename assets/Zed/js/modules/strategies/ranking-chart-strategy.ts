import type { ChartPayload, ChartTrace } from './chart-strategy';
import { CSS_PRIMARY_COLOR, prefersReducedMotion } from '../theme';
import { AbstractChartStrategy } from './chart-strategy';
import type { MountedChart } from './chart-strategy';

interface RankingRow {
    title: string;
    sku: string;
    count: number;
}

export class RankingChartStrategy extends AbstractChartStrategy {
    static readonly VIEW: string = 'ranking';

    readonly view: string = RankingChartStrategy.VIEW;

    private static readonly HIGHLIGHTED_RANKS = 3;
    private static readonly RANK_SHADES: ReadonlyArray<readonly [string, number]> = [
        ['black', 20],
        ['white', 0],
        ['white', 15],
        ['white', 30],
        ['white', 45],
    ];

    mount(element: HTMLElement, payload: ChartPayload): MountedChart {
        element.replaceChildren(...this.buildRanking(payload, !prefersReducedMotion()));

        return {};
    }

    private buildRanking(payload: ChartPayload, isAnimated: boolean): HTMLElement[] {
        const [trace] = payload.data.traces;
        const rows = trace ? this.readRankingRows(trace) : [];

        if (rows.length === 0) {
            return [this.buildEmptyState(payload)];
        }

        const maxCount = Math.max(1, ...rows.map((row) => row.count));
        const list = this.renderTemplate(payload, 'ranking');

        this.findSlot(list, 'rows').append(
            ...rows.map((row, index) => this.buildRankingRow(payload, row, index, maxCount, isAnimated)),
        );

        return [this.replaceCount(this.renderTemplate(payload, 'ranking-subtitle'), rows.length), list];
    }

    // The trace carries the titles in `values`, the counts in `labels` and the SKUs in `options`.
    private readRankingRows(trace: ChartTrace): RankingRow[] {
        return trace.values.map((value, index) => {
            const sku = trace.options[index];

            return {
                title: String(value ?? ''),
                sku: typeof sku === 'string' || typeof sku === 'number' ? String(sku) : '',
                count: this.toNumber(trace.labels[index]),
            };
        });
    }

    private buildRankingRow(
        payload: ChartPayload,
        row: RankingRow,
        index: number,
        maxCount: number,
        isAnimated: boolean,
    ): HTMLElement {
        const element = this.renderTemplate(payload, 'ranking-row');
        const isHighlighted = index < RankingChartStrategy.HIGHLIGHTED_RANKS;
        const title = this.fillSlot(element, 'title', row.title);

        this.findSlot(element, isHighlighted ? 'rank' : 'highlighted-rank').remove();
        this.fillSlot(element, isHighlighted ? 'highlighted-rank' : 'rank', String(index + 1));
        this.fillSlot(element, 'sku', row.sku);
        this.fillSlot(element, 'count', this.formatNumber(row.count));
        title.title = row.title;
        this.fillRankBar(element, row, index, maxCount, isAnimated);

        return element;
    }

    // The bar starts empty so Bootstrap's width transition animates it; that transition honours reduced motion.
    private fillRankBar(
        element: HTMLElement,
        row: RankingRow,
        index: number,
        maxCount: number,
        isAnimated: boolean,
    ): void {
        const track = this.findSlot(element, 'track');
        const fill = this.findSlot(element, 'fill');
        const shades = RankingChartStrategy.RANK_SHADES;
        const [mixColor, mixPercent] = shades[Math.min(index, shades.length - 1)];
        const width = `${(row.count / maxCount) * 100}%`;

        track.setAttribute('aria-label', row.title);
        track.setAttribute('aria-valuemax', String(maxCount));
        track.setAttribute('aria-valuenow', String(row.count));
        fill.style.backgroundColor = `color-mix(in srgb, ${CSS_PRIMARY_COLOR}, ${mixColor} ${mixPercent}%)`;
        fill.style.width = isAnimated ? '0' : width;

        if (isAnimated) {
            requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = width)));
        }
    }
}
