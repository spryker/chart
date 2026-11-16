// Only what is registered here is bundled: a new series or component type must be added to `use`.
import { init, use } from 'echarts/core';
import type { ComposeOption, ECharts } from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import type { BarSeriesOption, LineSeriesOption, PieSeriesOption } from 'echarts/charts';
import { GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import type {
    GridComponentOption,
    LegendComponentOption,
    MarkLineComponentOption,
    TooltipComponentOption,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([
    LineChart,
    BarChart,
    PieChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    MarkLineComponent,
    CanvasRenderer,
]);

export type ChartOption = ComposeOption<
    | LineSeriesOption
    | BarSeriesOption
    | PieSeriesOption
    | GridComponentOption
    | TooltipComponentOption
    | LegendComponentOption
    | MarkLineComponentOption
>;

export type { ECharts };
export { init, use };
