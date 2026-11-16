import type { ChartPayload, ChartTrace } from './chart-strategy';
import type { ChartOption, ECharts } from '../echarts';
import { CSS_PALETTE } from '../theme';
import type { ChartTheme } from '../theme';
import { EChartsChartStrategy } from './echarts-chart-strategy';
import type { ChartDecoration } from './echarts-chart-strategy';

type ChartAction = Parameters<ECharts['dispatchAction']>[0];

interface LegendRow {
    element: HTMLElement;
    name: string;
    value: number;
    toggle: HTMLElement;
    share: HTMLElement;
}

export class PieChartStrategy extends EChartsChartStrategy {
    static readonly VIEW: string = 'pie';

    readonly view: string = PieChartStrategy.VIEW;

    private static readonly HIDDEN_SHARE = '–';

    protected buildOption(payload: ChartPayload, theme: ChartTheme, common: ChartOption): ChartOption {
        return {
            ...common,
            tooltip: {
                ...(common.tooltip as object),
                trigger: 'item',
                formatter: (params: unknown) => {
                    const [item] = this.readTooltipItems(params);
                    const tooltip = this.renderTemplate(payload, 'pie-tooltip');

                    this.paintMarker(this.findSlot(tooltip, 'marker'), item);
                    this.fillSlot(tooltip, 'name', this.formatSliceName(String(item.name ?? '')));
                    this.fillSlot(tooltip, 'value', this.formatNumber(this.toNumber(item.value)));
                    this.fillSlot(tooltip, 'share', this.formatShare(item.percent ?? 0, 100));

                    return tooltip;
                },
            },
            // Hidden, not removed: the markup legend toggles slices through it.
            legend: { show: false },
            series: this.readPieTraces(payload).map((trace) => ({
                type: 'pie' as const,
                name: trace.name,
                radius: ['72%', '96%'],
                itemStyle: { borderColor: theme.surfaceColor, borderWidth: 2 },
                label: { show: false },
                labelLine: { show: false },
                emphasis: { scale: false },
                data: trace.labels.map((label, index) => ({ name: label, value: this.toNumber(trace.values[index]) })),
            })),
        };
    }

    protected decorate(payload: ChartPayload, plot: HTMLElement): ChartDecoration | null {
        const [trace] = this.readPieTraces(payload);

        return trace ? this.decorateWithLegend(payload, trace, plot) : null;
    }

    protected formatSliceName(name: string): string {
        return name;
    }

    protected readPieTraces(payload: ChartPayload): ChartTrace[] {
        return payload.data.traces.filter((trace) => trace.seriesKind === 'pie');
    }

    private decorateWithLegend(payload: ChartPayload, trace: ChartTrace, plot: HTMLElement): ChartDecoration {
        const hiddenNames = new Set<string>();
        const center = this.renderTemplate(payload, `${this.view}-center`);
        const total = this.findSlot(center, 'total');
        const legend = this.renderTemplate(payload, 'legend');
        let connectedChart: ECharts | null = null;
        const dispatch = (action: ChartAction): void => {
            connectedChart?.dispatchAction(action);
        };
        const rows = trace.labels.map((name, index) =>
            this.buildLegendRow(
                payload,
                dispatch,
                name,
                this.toNumber(trace.values[index]),
                CSS_PALETTE[index % CSS_PALETTE.length],
            ),
        );
        const showSelection = (): void => {
            const visibleTotal = rows.reduce((sum, row) => (hiddenNames.has(row.name) ? sum : sum + row.value), 0);

            total.textContent = this.formatNumber(Math.round(visibleTotal * 100) / 100);
            rows.forEach((row) => this.showRowSelection(row, hiddenNames.has(row.name), visibleTotal));
        };

        this.findSlot(legend, 'rows').append(...rows.map((row) => row.element));
        plot.append(center);
        plot.after(legend);
        showSelection();

        return {
            connect: (chart: ECharts): void => {
                connectedChart = chart;
                chart.on('legendselectchanged', (event: unknown) => {
                    const { selected } = event as { selected: Record<string, boolean> };

                    hiddenNames.clear();
                    Object.entries(selected).forEach(([name, isSelected]) =>
                        isSelected ? null : hiddenNames.add(name),
                    );
                    showSelection();
                });
            },
            restore: (): void => hiddenNames.forEach((name) => dispatch({ type: 'legendUnSelect', name })),
        };
    }

    private buildLegendRow(
        payload: ChartPayload,
        dispatch: (action: ChartAction) => void,
        name: string,
        value: number,
        swatchColor: string,
    ): LegendRow {
        const element = this.renderTemplate(payload, 'legend-row');
        const toggle = this.findSlot(element, 'toggle');
        const highlight = (): void => dispatch({ type: 'highlight', seriesIndex: 0, name });
        const downplay = (): void => dispatch({ type: 'downplay', seriesIndex: 0 });

        this.findSlot(element, 'swatch').style.backgroundColor = swatchColor;
        this.fillSlot(element, 'name', this.formatSliceName(name));
        this.fillSlot(element, 'value', this.formatNumber(value));
        toggle.addEventListener('click', () => dispatch({ type: 'legendToggleSelect', name }));
        toggle.addEventListener('mouseenter', highlight);
        toggle.addEventListener('focus', highlight);
        toggle.addEventListener('mouseleave', downplay);
        toggle.addEventListener('blur', downplay);

        return { element, name, value, toggle, share: this.findSlot(element, 'share') };
    }

    private showRowSelection(row: LegendRow, isHidden: boolean, visibleTotal: number): void {
        const hiddenClass = row.toggle.dataset.chartHiddenClass;

        row.toggle.setAttribute('aria-pressed', String(!isHidden));
        row.share.textContent = isHidden ? PieChartStrategy.HIDDEN_SHARE : this.formatShare(row.value, visibleTotal);

        if (hiddenClass) {
            row.toggle.classList.toggle(hiddenClass, isHidden);
        }
    }
}
