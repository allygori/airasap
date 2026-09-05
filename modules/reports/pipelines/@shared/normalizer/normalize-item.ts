import type { PipelineStage } from 'mongoose';

export const normalizeItem = () => {
  return {
    $addFields: {
      gross_sales: '$order_subtotal',
      discount: '$total_discount',
      net_sales: '',
      platform_fee: '',
      seller_income: '$released_funds',
    },
  };
};

export const normalizeProductAnalyticsItem =
  (): PipelineStage.AddFields => ({
    $addFields: {
      '_analytics.product_id': {
        $ifNull: [
          '$items.product_id',
          {
            $cond: [
              { $ifNull: ['$items.product', false] },
              { $toString: '$items.product' },
              '$items.parent_sku',
            ],
          },
        ],
      },
      '_analytics.product_name': {
        $ifNull: [
          '$items.product_name',
          'Produk tanpa nama',
        ],
      },
      '_analytics.variation_id': {
        $ifNull: [
          '$items.variation_id',
          '$items.child_sku',
        ],
      },
      '_analytics.variation_name': {
        $ifNull: ['$items.variation_name', 'Default'],
      },
      '_analytics.parent_sku': '$items.parent_sku',
      '_analytics.child_sku': '$items.child_sku',
      '_analytics.quantity': {
        $ifNull: ['$items.quantity', 0],
      },
      '_analytics.returned_quantity': {
        $ifNull: ['$items.returned_quantity', 0],
      },
      '_analytics.final_quantity': {
        $max: [
          0,
          {
            $subtract: [
              { $ifNull: ['$items.quantity', 0] },
              { $ifNull: ['$items.returned_quantity', 0] },
            ],
          },
        ],
      },
      '_analytics.item_gross_sales': {
        $ifNull: [
          '$items.gross_sales',
          '$items.subtotal',
          {
            $multiply: [
              {
                $ifNull: ['$items.price_after_discount', 0],
              },
              { $ifNull: ['$items.quantity', 0] },
            ],
          },
        ],
      },
      '_analytics.item_net_sales': {
        $ifNull: ['$items.net_sales', '$items.subtotal', 0],
      },
      '_analytics.item_cogs': {
        $ifNull: [
          '$items.total_product_cost',
          {
            $multiply: [
              { $ifNull: ['$items.product_cost', 0] },
              {
                $max: [
                  0,
                  {
                    $subtract: [
                      { $ifNull: ['$items.quantity', 0] },
                      {
                        $ifNull: [
                          '$items.returned_quantity',
                          0,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      '_analytics.item_gross_profit': {
        $ifNull: [
          '$items.gross_profit',
          {
            $subtract: [
              {
                $ifNull: [
                  '$items.gross_sales',
                  '$items.subtotal',
                  {
                    $multiply: [
                      {
                        $ifNull: [
                          '$items.price_after_discount',
                          0,
                        ],
                      },
                      { $ifNull: ['$items.quantity', 0] },
                    ],
                  },
                ],
              },
              {
                $ifNull: [
                  '$items.total_product_cost',
                  {
                    $multiply: [
                      {
                        $ifNull: ['$items.product_cost', 0],
                      },
                      {
                        $max: [
                          0,
                          {
                            $subtract: [
                              {
                                $ifNull: [
                                  '$items.quantity',
                                  0,
                                ],
                              },
                              {
                                $ifNull: [
                                  '$items.returned_quantity',
                                  0,
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      '_analytics.item_net_profit': {
        $ifNull: ['$items.net_profit', null],
      },
      '_analytics.item_processing_fee': {
        $ifNull: ['$items.processing_fee', 0],
      },
    },
  });
