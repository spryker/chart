import type { ChartPayload, ChartTrace } from './chart-strategy';
import type { ChartOption } from '../echarts';
import type { ChartTheme } from '../theme';
import { EChartsChartStrategy } from './echarts-chart-strategy';

export class DailyBarChartStrategy extends EChartsChartStrategy {
    static readonly VIEW: string = 'daily-bar';

    readonly view: string = DailyBarChartStrategy.VIEW;

    private static readonly BAR_OPACITY = 0.4;

    private static readonly AXIS_LABEL_GAPS = 4;

    protected renderHeader(payload: ChartPayload): HTMLElement[] {
        const [trace] = payload.data.traces;

        if (!trace || trace.labels.length === 0) {
            return [];
        }

        const subtitle = this.renderTemplate(payload, 'daily-subtitle');

        this.fillSlot(
            subtitle,
            'period',
            `${this.formatDay(trace.labels[0], false)} – ${this.formatDay(trace.labels[trace.labels.length - 1], false)}`,
        );

        if (this.isEmpty(payload)) {
            return [subtitle];
        }

        const summary = this.renderTemplate(payload, 'daily-summary');

        this.fillSlot(summary, 'total', this.formatNumber(this.sumValues(trace)));
        this.fillSlot(summary, 'average', this.formatNumber(this.averageValue(trace)));

        return [subtitle, summary];
    }

    protected buildOption(payload: ChartPayload, theme: ChartTheme, common: ChartOption): ChartOption {
        const [trace] = payload.data.traces;
        const values = trace.values.map((value) => this.toNumber(value));
        const latestIndex = values.length - 1;
        const labelStep = Math.max(1, Math.round(latestIndex / DailyBarChartStrategy.AXIS_LABEL_GAPS));
        const axisStyle = this.buildAxisStyle(theme);

        return {
            ...common,
            tooltip: {
                ...(common.tooltip as object),
                trigger: 'axis',
                axisPointer: { type: 'none' },
                formatter: (params: unknown) => {
                    const [item] = this.readTooltipItems(params);
                    const tooltip = this.renderTemplate(payload, 'daily-tooltip');

                    this.fillSlot(tooltip, 'day', this.formatDay(String(item?.name ?? ''), true));
                    this.findSlot(tooltip, 'count').append(
                        this.buildCount(payload, 'order-count', this.toNumber(item?.value)),
                    );

                    return tooltip;
                },
            },
            grid: { left: 4, right: 4, top: 12, bottom: 4 },
            xAxis: {
                type: 'category',
                data: trace.labels,
                ...axisStyle,
                axisLabel: {
                    ...axisStyle.axisLabel,
                    hideOverlap: true,
                    interval: (index: number) => index % labelStep === 0 || index === latestIndex,
                    formatter: (label: string) => this.formatDay(label, false),
                },
                splitLine: { show: false },
            },
            yAxis: { type: 'value', minInterval: 1, ...axisStyle, axisLine: { show: false } },
            series: [
                {
                    type: 'bar',
                    name: trace.name,
                    barWidth: '55%',
                    barMaxWidth: 12,
                    itemStyle: {
                        color: theme.primaryColor,
                        opacity: DailyBarChartStrategy.BAR_OPACITY,
                        borderRadius: [3, 3, 0, 0],
                    },
                    emphasis: { itemStyle: { opacity: 1 } },
                    data: values,
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        label: { show: false },
                        lineStyle: { color: theme.mutedTextColor, type: 'dashed', width: 1 },
                        data: [{ type: 'average' }],
                    },
                },
            ],
        };
    }

    private sumValues(trace: ChartTrace): number {
        return Math.round(trace.values.reduce<number>((sum, value) => sum + this.toNumber(value), 0) * 100) / 100;
    }

    private averageValue(trace: ChartTrace): number {
        return trace.values.length > 0 ? Math.round((this.sumValues(trace) / trace.values.length) * 10) / 10 : 0;
    }
}
