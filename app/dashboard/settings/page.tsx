import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { settingsSectionGroups } from './_lib/settings-sections';

const plannedSections = settingsSectionGroups
  .flatMap((group) => group.sections)
  .filter((section) => section.availability === 'planned');

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Area pengaturan
        </h2>
        <p className="text-muted-foreground text-sm">
          Bagian yang belum tersedia ditampilkan sebagai
          informasi dan belum bisa diubah.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {plannedSections.map((section) => {
          const Icon = section.icon;

          return (
            <Card key={section.id} className="h-full">
              <CardHeader className="gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="bg-muted text-foreground flex size-10 items-center justify-center rounded-lg">
                    <Icon
                      aria-hidden="true"
                      className="size-5"
                    />
                  </div>
                  <Badge variant="outline">
                    Belum tersedia
                  </Badge>
                </div>
                <div className="grid gap-1">
                  <CardTitle>{section.label}</CardTitle>
                  <CardDescription>
                    {section.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-xs">
                  Bagian ini akan ditambahkan pada fase
                  berikutnya.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
