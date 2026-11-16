import type { ChartPayload } from './chart-strategy';
import { PieChartStrategy } from './pie-chart-strategy';

export class OrderStatusChartStrategy extends PieChartStrategy {
    static readonly VIEW: string = 'order-status';

    readonly view: string = OrderStatusChartStrategy.VIEW;

    protected renderHeader(payload: ChartPayload): HTMLElement[] {
        const [trace] = this.readPieTraces(payload);
        const total = trace ? trace.values.reduce<number>((sum, value) => sum + this.toNumber(value), 0) : 0;

        if (total === 0) {
            return [];
        }

        const subtitle = this.renderTemplate(payload, 'order-status-subtitle');

        this.findSlot(subtitle, 'count').append(this.buildCount(payload, 'item-count', total));

        return [subtitle];
    }

    protected formatSliceName(name: string): string {
        return name.charAt(0).toLocaleUpperCase() + name.slice(1);
    }
}
