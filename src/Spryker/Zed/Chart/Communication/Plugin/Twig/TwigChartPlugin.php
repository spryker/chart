<?php

/**
 * Copyright © 2016-present Spryker Systems GmbH. All rights reserved.
 * Use of this software requires acceptance of the Evaluation License Agreement. See LICENSE file.
 */

namespace Spryker\Zed\Chart\Communication\Plugin\Twig;

/**
 * @method \Spryker\Zed\Chart\Communication\ChartCommunicationFactory getFactory()
 * @method \Spryker\Zed\Chart\ChartConfig getConfig()
 * @method \Spryker\Zed\Chart\Business\ChartFacadeInterface getFacade()
 */
class TwigChartPlugin extends AbstractChartTwigPlugin
{
    public const TWIG_FUNCTION_NAME = 'chart';

    /**
     * @return string
     */
    protected function getTemplateName(): string
    {
        return '@Chart/_template/chart.twig';
    }
}
