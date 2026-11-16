import { CartesianChartStrategy } from './strategies/cartesian-chart-strategy';
import type { ChartStrategy } from './strategies/chart-strategy';
import { DailyBarChartStrategy } from './strategies/daily-bar-chart-strategy';
import { OrderStatusChartStrategy } from './strategies/order-status-chart-strategy';
import { PieChartStrategy } from './strategies/pie-chart-strategy';
import { RankingChartStrategy } from './strategies/ranking-chart-strategy';

export const createDefaultChartStrategies = (): ChartStrategy[] => [
    new CartesianChartStrategy(),
    new DailyBarChartStrategy(),
    new PieChartStrategy(),
    new OrderStatusChartStrategy(),
    new RankingChartStrategy(),
];
