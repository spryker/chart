import type { ChartOption, ECharts } from '../echarts';
import { prefersReducedMotion, readTheme } from '../theme';
import type { ChartTheme } from '../theme';
import { AbstractChartStrategy } from './chart-strategy';
import type { ChartPayload, MountedChart } from './chart-strategy';

export type EChartsLibrary = typeof import('../echarts');

export interface TooltipItem {
    color?: unknown;
    seriesName?: string;
    name?: string;
    value?: unknown;
    percent?: number;
    dataIndex: number;
    axisValueLabel?: string;
}

export interface ChartDecoration {
    connect(chart: ECharts): void;
    // Runs after each redraw: notMerge drops any state set through dispatchAction.
    restore(): void;
}

export abstract class EChartsChartStrategy extends AbstractChartStrategy {
    abstract readonly view: string;

    private static readonly VIEWPORT_MARGIN = '200px 0px';

    protected abstract buildOption(payload: ChartPayload, theme: ChartTheme, common: ChartOption): ChartOption;

    protected renderHeader?(payload: ChartPayload): HTMLElement[];

    protected decorate?(payload: ChartPayload, plot: HTMLElement): ChartDecoration | null;

    protected isEmpty(payload: ChartPayload): boolean {
        return payload.data.traces.every((trace) => trace.values.every((value) => this.toNumber(value) === 0));
    }

    protected loadLibrary(): Promise<EChartsLibrary> {
        return import(/* webpackChunkName: "chart-echarts" */ '../echarts');
    }

    protected buildAxisStyle(theme: ChartTheme) {
        return {
            axisLine: { lineStyle: { color: theme.borderColor } },
            axisTick: { show: false },
            axisLabel: { color: theme.mutedTextColor },
            splitLine: { lineStyle: { color: theme.gridColor } },
        };
    }

    protected paintMarker(marker: HTMLElement, item: TooltipItem): void {
        marker.style.backgroundColor = typeof item.color === 'string' ? item.color : '';
    }

    protected readTooltipItems(params: unknown): TooltipItem[] {
        return (Array.isArray(params) ? params : [params]) as TooltipItem[];
    }

    mount(element: HTMLElement, payload: ChartPayload): MountedChart {
        const header = this.renderHeader?.(payload) ?? [];

        if (this.isEmpty(payload)) {
            element.replaceChildren(...header, this.buildEmptyState(payload));

            return {};
        }

        const plot = this.renderTemplate(payload, this.view);
        const canvasHost = this.findSlot(plot, 'canvas');
        let redraw: (() => void) | null = null;

        element.replaceChildren(...header, plot);

        const decoration = this.decorate?.(payload, plot) ?? null;

        this.whenNearViewport(plot, () =>
            this.loadLibrary()
                .then((library) => {
                    redraw = this.draw(library, canvasHost, payload, decoration);
                })
                .catch((error: unknown) => {
                    window.reportError(error);

                    const errorState = this.buildErrorState(payload);

                    if (errorState) {
                        plot.replaceWith(errorState);
                    }
                }),
        );

        return { update: () => redraw?.() };
    }

    private draw(
        library: EChartsLibrary,
        canvasHost: HTMLElement,
        payload: ChartPayload,
        decoration: ChartDecoration | null,
    ): () => void {
        const chart = library.init(canvasHost, null, { renderer: 'canvas' });
        const render = (): void => {
            const theme = readTheme();

            chart.setOption(this.buildOption(payload, theme, this.buildCommonOption(theme, prefersReducedMotion())), {
                notMerge: true,
            });
        };
        let size = this.readSize(canvasHost);

        // ResizeObserver reports the initial size right after observe(); resizing then would cut the entrance animation.
        const resizeObserver = new ResizeObserver(() => {
            if (this.readSize(canvasHost) !== size) {
                size = this.readSize(canvasHost);
                chart.resize();
            }
        });

        render();
        resizeObserver.observe(canvasHost);
        decoration?.connect(chart);

        return (): void => {
            render();
            decoration?.restore();
        };
    }

    private whenNearViewport(target: HTMLElement, callback: () => void): void {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    observer.disconnect();
                    callback();
                }
            },
            { rootMargin: EChartsChartStrategy.VIEWPORT_MARGIN },
        );

        observer.observe(target);
    }

    private buildCommonOption(theme: ChartTheme, reducedMotion: boolean): ChartOption {
        return {
            animation: !reducedMotion,
            color: theme.palette,
            textStyle: { fontFamily: theme.fontFamily, color: theme.textColor },
            tooltip: {
                backgroundColor: theme.textColor,
                borderWidth: 0,
                borderRadius: 6,
                padding: [6, 10],
                textStyle: { color: theme.surfaceColor, fontFamily: theme.fontFamily, fontSize: 12 },
            },
        };
    }

    private readSize(element: HTMLElement): string {
        return `${element.clientWidth}x${element.clientHeight}`;
    }
}
