import type { ChartPayload, ChartTrace } from './chart-strategy';
import type { ChartOption } from '../echarts';
import type { ChartTheme } from '../theme';
import { EChartsChartStrategy } from './echarts-chart-strategy';
import type { TooltipItem } from './echarts-chart-strategy';

export class CartesianChartStrategy extends EChartsChartStrategy {
    static readonly VIEW: string = 'cartesian';

    readonly view: string = CartesianChartStrategy.VIEW;

    protected buildOption(payload: ChartPayload, theme: ChartTheme, common: ChartOption): ChartOption {
        const traces = payload.data.traces.filter((trace) => trace.seriesKind !== 'pie');
        const categories = this.collectCategories(traces);
        const axisStyle = this.buildAxisStyle(theme);

        return {
            ...common,
            tooltip: {
                ...(common.tooltip as object),
                trigger: 'axis',
                formatter: (params: unknown) => this.buildTooltip(payload, this.readTooltipItems(params)),
            },
            legend: { show: traces.length > 1, top: 0, textStyle: { color: theme.textColor } },
            grid: { left: 4, right: 4, top: traces.length > 1 ? 32 : 12, bottom: 4 },
            xAxis: {
                type: 'category',
                data: categories,
                boundaryGap: traces.some((trace) => trace.seriesKind === 'bar'),
                ...axisStyle,
                splitLine: { show: false },
            },
            yAxis: {
                type: 'value',
                ...(this.hasOnlyWholeNumbers(traces) ? { minInterval: 1 } : {}),
                ...axisStyle,
                axisLine: { show: false },
            },
            series: traces.map((trace) => {
                const data = this.alignToCategories(trace, categories);

                if (trace.seriesKind === 'line') {
                    return { type: 'line' as const, name: trace.name, smooth: true, symbolSize: 6, data };
                }

                return {
                    type: 'bar' as const,
                    name: trace.name,
                    barMaxWidth: 24,
                    itemStyle: { borderRadius: [3, 3, 0, 0] },
                    data,
                };
            }),
        };
    }

    private collectCategories(traces: ChartTrace[]): string[] {
        return [...new Set(traces.flatMap((trace) => trace.labels))];
    }

    private alignToCategories(trace: ChartTrace, categories: string[]): (number | null)[] {
        const valueByLabel = new Map(trace.labels.map((label, index) => [label, trace.values[index]]));

        return categories.map((category) =>
            valueByLabel.has(category) ? this.toNumber(valueByLabel.get(category)) : null,
        );
    }

    private hasOnlyWholeNumbers(traces: ChartTrace[]): boolean {
        return traces.every((trace) => trace.values.every((value) => Number.isInteger(this.toNumber(value))));
    }

    private buildTooltip(payload: ChartPayload, items: TooltipItem[]): HTMLElement {
        const tooltip = this.renderTemplate(payload, 'cartesian-tooltip');

        this.fillSlot(tooltip, 'heading', String(items[0]?.axisValueLabel ?? ''));
        this.findSlot(tooltip, 'rows').append(
            ...items
                .filter((item) => item.value !== null && item.value !== undefined)
                .map((item) => {
                    const row = this.renderTemplate(payload, 'cartesian-tooltip-row');

                    this.paintMarker(this.findSlot(row, 'marker'), item);
                    this.fillSlot(row, 'name', String(item.seriesName ?? ''));
                    this.fillSlot(row, 'value', this.formatNumber(this.toNumber(item.value)));

                    return row;
                }),
        );

        return tooltip;
    }
}
