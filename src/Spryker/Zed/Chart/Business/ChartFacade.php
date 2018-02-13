<?php

/**
 * Copyright © 2016-present Spryker Systems GmbH. All rights reserved.
 * Use of this software requires acceptance of the Evaluation License Agreement. See LICENSE file.
 */

namespace Spryker\Zed\Chart\Business;

use Spryker\Zed\Kernel\Business\AbstractFacade;

/**
 * @method \Spryker\Zed\Chart\Business\ChartBusinessFactory getFactory()
 */
class ChartFacade extends AbstractFacade implements ChartFacadeInterface
{
    /**
     * {@inheritdoc}
     *
     * @api
     *
     * @return string[]
     */
    public function getChartTypes()
    {
        return $this->getFactory()
            ->getModuleConfig()
            ->getChartTypes();
    }

    /**
     * {@inheritdoc}
     *
     * @api
     *
     * @return string
     */
    public function getDefaultChartType()
    {
        return $this->getFactory()
            ->getModuleConfig()
            ->getDefaultChartType();
    }
}
