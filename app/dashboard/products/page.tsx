'use client';

import * as React from 'react';
import { CollectionShell } from '@/components/dashboard/collection/shell';
import { ColumnDef } from '@tanstack/react-table';
// import { BlogPostType } from '@/components/blog/types';
import { getPostColumns } from './_components/columns';
import { FileText } from 'lucide-react';

export default function PostIndexPage() {
  const columns = React.useMemo(
    () => getPostColumns(false),
    []
    // ) as ColumnDef<BlogPostType>[];
  ) as ColumnDef<Record<string, any>>[];

  return (
    <>
      <div className="animate-in fade-in flex flex-1 flex-col space-y-8 p-4 duration-700 md:p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="space-y-1.5">
            <div className="text-primary animate-in slide-in-from-left-4 flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase duration-500">
              <FileText className="h-4 w-4" />
              Blog Posts
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl dark:text-white">
              Articles
            </h1>
            <p className="max-w-lg font-medium text-slate-500 dark:text-slate-400">
              Manage title, excerpt, article body, author,
              category, tags, featured image and many.
            </p>
          </div>
        </div>
      </div>

      <CollectionShell
        title="Articles"
        endpoint="/api/posts?sort=-updated_at"
        // columns={columns}
        columns={[]}
        searchFields={['title', 'slug', 'excerpt']}
        primarySearchField="title"
        createUrl="/dashboard/posts/create"
        createText="Create Post"
        isSortable={false}
      />
    </>
  );
}
