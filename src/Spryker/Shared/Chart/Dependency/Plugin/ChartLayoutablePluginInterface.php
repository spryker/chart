<?php

/**
 * Copyright © 2016-present Spryker Systems GmbH. All rights reserved.
 * Use of this software requires acceptance of the Evaluation License Agreement. See LICENSE file.
 */

namespace Spryker\Shared\Chart\Dependency\Plugin;

use Generated\Shared\Transfer\ChartLayoutTransfer;

interface ChartLayoutablePluginInterface extends ChartPluginInterface
{
    /**
     * Specification:
     * - Returns a ChartLayoutTransfer object with layout for charts.
     * - Applied by the Yves chart Twig functions of `spryker-shop/chart-widget` only.
     * - The Back Office chart Twig functions of `spryker/chart-gui` 2.0.0 and later ignore it: the chart size comes from CSS.
     *
     * @api
     *
     * @return \Generated\Shared\Transfer\ChartLayoutTransfer
     */
    public function getChartLayout(): ChartLayoutTransfer;
}
