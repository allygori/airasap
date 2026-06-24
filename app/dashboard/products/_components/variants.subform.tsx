// VariantsSubForm.tsx
import React from 'react';
import { withForm } from '@/components/form/form.hook';
import {
  VariantSchema,
  VariantDTO,
} from '@/modules/products/product.dto';

export const VariantsSubForm = withForm({
  defaultValues: {
    variant_id: '',
    name: '',
    price: 0,
    discount: 0,
    final_price: 0,
    is_default: false,
    product_cost: '', // Types.ObjectId;
    parent_sku: '', // string | undefined;
    sku: '', // string | undefined;
    gtin: '', // string | undefined;
    // product: ObjectIdSchema,
    product: '',
  } as unknown as VariantDTO,
  validators: {
    onChange: VariantSchema,
  },
  props: {
    variantIndex: 0,
  },
  render: ({ form, variantIndex }) => {
    return (
      <div
        style={{
          padding: '10px',
          background: '#f9f9f9',
          borderRadius: '4px',
          marginTop: '10px',
        }}
      >
        <h5>
          Product Cost Details (Variant #{variantIndex + 1})
        </h5>
        {/* <pre>{form}</pre> */}
        {/* <form.AppField
          name={`variants[${0}].variant_id`}
          children={(subField) => (
            <subField.TextField
              type="text"
              label="Variation ID"
              value={subField.state.value ?? ''}
              disabled={true}
              onChange={(e) =>
                subField.handleChange(
                  e.target.value === ''
                    ? undefined
                    : Number(e.target.value)
                )
              }
            />
          )}
        /> */}

        {/* 
        <form.AppField name="product">
          {(field) => (
            <div>
              <label>Product Link ID:</label>
              <input 
                type="text" 
                value={field.state.value} 
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.AppField>

        <form.AppField name="cogs_unit">
          {(field) => (
            <div>
              <label>COGS Unit Value:</label>
              <input
                type="number"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        </form.AppField> */}
      </div>
    );
  },
});
