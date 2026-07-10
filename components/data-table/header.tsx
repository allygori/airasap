'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type CollectionHeaderProps = {
  title: string;
  count?: number;
  showCreateButton?: boolean;
  createUrl?: string;
  createText?: string;
};

export function CollectionHeader({
  title,
  count,
  showCreateButton,
  createUrl,
  createText = 'Create New',
}: CollectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">{title}</h1>
        {count !== undefined && (
          <Badge variant="secondary">{count}</Badge>
        )}
      </div>
      {showCreateButton && createUrl && (
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              (window.location.href = createUrl)
            }
          >
            <Plus className="size-4" />
            <span className="inline">{createText}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
