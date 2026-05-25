import mongoose from 'mongoose'

const { Schema } = mongoose

/*
|--------------------------------------------------------------------------
| Helper Schemas
|--------------------------------------------------------------------------
*/

const MoneyItemSchema = new Schema(
  {
    label: {
      type: String,
      required: true
    },

    value: {
      type: Number,
      default: 0
    },

    raw_label: {
      type: String
    }
  },
  { _id: false }
)

const MoneyGroupSchema = new Schema(
  {
    total: {
      type: Number,
      default: 0
    },

    items: {
      type: Map,
      of: Number,
      default: {}
    },

    raw_items: {
      type: [MoneyItemSchema],
      default: []
    }
  },
  { _id: false }
)

/*
|--------------------------------------------------------------------------
| Main Report Schema
|--------------------------------------------------------------------------
*/

const ToolMarketplaceIncomeReportSchema = new Schema(
  {
    sid: { type: String, required: true }, // 8 bytes nanoid (A-Z, a-z, 0-9)

    email: { type: String, required: false },

    /*
    |--------------------------------------------------------------------------
    | Platform Info
    |--------------------------------------------------------------------------
    */

    platform: {
      type: String,
      required: true,
      enum: ['shopee'] // 'tiktok' (future)
    },

    report_type: {
      type: String,
      required: true,
      enum: [
        'income_released',
        'income_unreleased',
        'ads',
        'affiliate',
        'other'
      ]
    },

    parser_version: {
      type: String,
      required: true,
      default: 'shopee-income-v1'
    },

    /*
    |--------------------------------------------------------------------------
    | Seller Info
    |--------------------------------------------------------------------------
    */

    seller: {
      username: {
        type: String,
        required: true,
        index: true
      },

      shop_id: {
        type: String
      },

      shop_name: {
        type: String
      }
    },

    /*
    |--------------------------------------------------------------------------
    | Report Period
    |--------------------------------------------------------------------------
    */

    period: {
      from: {
        type: Date,
        required: true,
        index: true
      },

      to: {
        type: Date,
        required: true,
        index: true
      }
    },

    currency: {
      type: String,
      default: 'IDR'
    },

    /*
    |--------------------------------------------------------------------------
    | Products
    |--------------------------------------------------------------------------
    */
    products: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      cogs: { type: Number, required: true, default: 0 },
    }],

    /*
    |--------------------------------------------------------------------------
    | Summary
    |--------------------------------------------------------------------------
    */

    summary: {
      /*
      |--------------------------------------------------------------------------
      | Total Income
      |--------------------------------------------------------------------------
      */

      total_income: {
        type: Number,
        default: 0
      },

      /*
      |--------------------------------------------------------------------------
      | Order Subtotal
      |--------------------------------------------------------------------------
      */

      order_subtotal: {
        type: MoneyGroupSchema,
        default: () => ({})
      },

      /*
      |--------------------------------------------------------------------------
      | Shopee Voucher & Subsidy
      |--------------------------------------------------------------------------
      */

      shopee_voucher_and_subsidy: {
        type: MoneyGroupSchema,
        default: () => ({})
      },

      /*
      |--------------------------------------------------------------------------
      | Total Expenses
      |--------------------------------------------------------------------------
      */

      total_expense: {
        total: {
          type: Number,
          default: 0
        },

        shipping: {
          type: MoneyGroupSchema,
          default: () => ({})
        },

        admin_and_service_fee: {
          type: MoneyGroupSchema,
          default: () => ({})
        },

        other_fees: {
          type: MoneyGroupSchema,
          default: () => ({})
        }
      },

      /*
      |--------------------------------------------------------------------------
      | Other Values
      |--------------------------------------------------------------------------
      */

      other_values: {
        type: MoneyGroupSchema,
        default: () => ({})
      },

      /*
      |--------------------------------------------------------------------------
      | Final Released Amount
      |--------------------------------------------------------------------------
      */

      released_amount: {
        type: Number,
        default: 0,
        index: true
      }
    },

    /*
    |--------------------------------------------------------------------------
    | Worksheet Metadata
    |--------------------------------------------------------------------------
    */

    worksheets: {
      summary: {
        name: String,
        total_rows: Number
      },

      income: {
        name: String,
        total_rows: Number
      },

      seller_fee: {
        name: String,
        total_rows: Number
      }
    },

    /*
    |--------------------------------------------------------------------------
    | Raw Parsed Data
    |--------------------------------------------------------------------------
    */

    raw_data: {
      summary_rows: {
        type: [[Schema.Types.Mixed]],
        default: []
      },

      income_rows: {
        type: [[Schema.Types.Mixed]],
        default: []
      },

      seller_fee_rows: {
        type: [[Schema.Types.Mixed]],
        default: []
      }
    },

    /*
    |--------------------------------------------------------------------------
    | Original File Metadata
    |--------------------------------------------------------------------------
    */

    source_file: {
      original_name: {
        type: String,
        required: true
      },

      mime_type: {
        type: String
      },

      size: {
        type: Number
      },

      checksum: {
        type: String,
        // index: true
      },

      storage_provider: {
        type: String,
        enum: ['local', 's3', 'r2'],
        default: 'local'
      },

      storage_path: {
        type: String
      }
    },

    /*
    |--------------------------------------------------------------------------
    | Import Metadata
    |--------------------------------------------------------------------------
    */

    imported_by: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    imported_at: {
      type: Date,
      default: Date.now,
      index: true
    },

    last_parsed_at: {
      type: Date
    },

    parse_status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'completed',
        'failed'
      ],
      default: 'completed',
      index: true
    },

    parse_errors: [
      {
        message: String,

        field: String,

        row: Number,

        raw_value: Schema.Types.Mixed
      }
    ],

    /*
    |--------------------------------------------------------------------------
    | Flexible Future Fields
    |--------------------------------------------------------------------------
    */

    extra: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at' 
    },

    minimize: false,

    strict: false,

    collection: 'tool_marketplace_income_reports'
  }
)

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

ToolMarketplaceIncomeReportSchema.index({
  platform: 1,
  report_type: 1
})

ToolMarketplaceIncomeReportSchema.index({
  'seller.username': 1,
  'period.from': 1,
  'period.to': 1
})

ToolMarketplaceIncomeReportSchema.index({
  'source_file.checksum': 1
})

/*
|--------------------------------------------------------------------------
| Virtuals
|--------------------------------------------------------------------------
*/

ToolMarketplaceIncomeReportSchema.virtual('period_label').get(function (this: any) {
  const p = this.period as { from?: Date; to?: Date } | undefined
  return `${p?.from ?? ''}-${p?.to ?? ''}`
})
/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export default mongoose.models.ToolMarketplaceIncomeReport || mongoose.model('ToolMarketplaceIncomeReport', ToolMarketplaceIncomeReportSchema);