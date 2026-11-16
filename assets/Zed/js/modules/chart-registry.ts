import type { ChartFactory } from './chart-factory';
import { cloneTemplateRoot, ERROR_STATE_TEMPLATE } from './strategies/chart-strategy';
import type { MountedChart } from './strategies/chart-strategy';

const MOUNTED_ATTRIBUTE = 'data-chart-mounted';

export const mountCharts = (factory: ChartFactory): void => {
    const mountedCharts: MountedChart[] = [];

    // The chart partial puts the script on the page once, but a project template may include it again, and the browser
    // runs a classic script once per tag, so a later run must skip the charts an earlier one took: their templates are
    // already consumed.
    document.querySelectorAll<HTMLElement>(`[data-chart]:not([${MOUNTED_ATTRIBUTE}])`).forEach((element) => {
        element.setAttribute(MOUNTED_ATTRIBUTE, '');

        const errorStateTemplate = element.querySelector<HTMLTemplateElement>(
            `:scope > template[data-chart-template="${ERROR_STATE_TEMPLATE}"]`,
        );

        try {
            mountedCharts.push(factory.create(element));
        } catch (error) {
            window.reportError(error);

            const errorState = cloneTemplateRoot(errorStateTemplate);

            if (errorState) {
                element.replaceChildren(errorState);
            }
        }
    });

    if (mountedCharts.length === 0) {
        return;
    }

    new MutationObserver(() => mountedCharts.forEach((mounted) => mounted.update?.())).observe(
        document.documentElement,
        {
            attributes: true,
            attributeFilter: ['data-bs-theme', 'data-skin'],
        },
    );
};
