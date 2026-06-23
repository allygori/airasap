import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';

export function AddressFields({ form }: { form: any }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">
          Alamat Pengiriman
        </CardTitle>
        <CardDescription>
          Rincian alamat penerima order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <form.AppField
            name="address.street"
            children={(field: any) => (
              <field.TextField
                label="Jalan"
                value={field.state.value ?? ''}
                onChange={(e: any) =>
                  field.handleChange(e.target.value)
                }
              />
            )}
          />
          <form.AppField
            name="address.city"
            children={(field: any) => (
              <field.TextField
                label="Kota"
                value={field.state.value ?? ''}
                onChange={(e: any) =>
                  field.handleChange(e.target.value)
                }
              />
            )}
          />
          <form.AppField
            name="address.province"
            children={(field: any) => (
              <field.TextField
                label="Provinsi"
                value={field.state.value ?? ''}
                onChange={(e: any) =>
                  field.handleChange(e.target.value)
                }
              />
            )}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
