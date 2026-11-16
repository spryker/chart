<?php

/**
 * Copyright © 2016-present Spryker Systems GmbH. All rights reserved.
 * Use of this software requires acceptance of the Evaluation License Agreement. See LICENSE file.
 */

namespace Spryker\Zed\Chart;

use Spryker\Zed\Kernel\AbstractBundleConfig;

/**
 * @method \Spryker\Shared\Chart\ChartConfig getSharedConfig()
 */
class ChartConfig extends AbstractBundleConfig
{
    /**
     * @api
     *
     * @return array<string>
     */
    public function getChartTypes(): array
    {
        return $this->getSharedConfig()->getChartTypes();
    }

    /**
     * @api
     *
     * @return string
     */
    public function getDefaultChartType(): string
    {
        return $this->getSharedConfig()->getDefaultChartType();
    }
}
