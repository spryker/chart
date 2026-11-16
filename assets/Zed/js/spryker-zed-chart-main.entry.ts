import { ChartFactory } from './modules/chart-factory';
import { mountCharts } from './modules/chart-registry';
import { createDefaultChartStrategies } from './modules/chart-strategies';

mountCharts(new ChartFactory(createDefaultChartStrategies()));
