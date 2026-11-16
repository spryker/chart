// Imported as `@zed/chart/js/modules`. A project adds or replaces a view in its own
// spryker-zed-chart-main.entry.ts, placed in a module not named Chart (that name would shadow `@zed/chart`):
//     mountCharts(new ChartFactory([...createDefaultChartStrategies(), new FunnelChartStrategy()]));
// ECharts is loaded on demand: a view that needs another series overrides `loadLibrary()` and registers it there.
export { ChartFactory } from './chart-factory';
export { mountCharts } from './chart-registry';
export { createDefaultChartStrategies } from './chart-strategies';
export type { ChartOption, ECharts } from './echarts';
export type { ChartTheme } from './theme';
export { AbstractChartStrategy } from './strategies/chart-strategy';
export type { ChartPayload, ChartStrategy, ChartTrace, MountedChart, SeriesKind } from './strategies/chart-strategy';
export { EChartsChartStrategy } from './strategies/echarts-chart-strategy';
export type { ChartDecoration, EChartsLibrary, TooltipItem } from './strategies/echarts-chart-strategy';
