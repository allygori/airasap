import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';

export function FeeFields({ form }: { form: any }) {
  const feeFields = [
    { name: 'admin_fee', label: 'Admin Fee' },
    { name: 'processing_fee', label: 'Processing Fee' },
    { name: 'affiliate_fee', label: 'Affiliate Fee' },
    { name: 'service_fee', label: 'Service Fee' },
    {
      name: 'shipping_saver_program_fee',
      label: 'Shipping Saver Program Fee',
    },
    { name: 'transaction_fee', label: 'Transaction Fee' },
    { name: 'campaign_fee', label: 'Campaign Fee' },
    {
      name: 'auto_top_up_fee_from_income',
      label: 'Auto Top Up Fee from Income',
    },
    {
      name: 'return_shipping_fee',
      label: 'Return Shipping Fee',
    },
    {
      name: 'return_to_sender_shipping_fee',
      label: 'Return to Sender Shipping Fee',
    },
    {
      name: 'shipping_fee_refund',
      label: 'Shipping Fee Refund',
    },
  ];

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">
          Rincian Biaya (Fees)
        </CardTitle>
        <CardDescription>
          Pengaturan biaya admin, pelayanan, ongkir, dll.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {feeFields.map((f) => (
            <form.AppField
              key={f.name}
              name={`fee.${f.name}`}
              children={(field: any) => (
                <field.TextField
                  type="number"
                  label={f.label}
                  value={field.state.value ?? ''}
                  onChange={(e: any) =>
                    field.handleChange(
                      e.target.value === ''
                        ? 0
                        : Number(e.target.value)
                    )
                  }
                />
              )}
            />
          ))}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
