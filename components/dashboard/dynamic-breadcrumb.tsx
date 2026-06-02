'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react/jsx-runtime';

export function DynamicBreadcrumb() {
  const pathname = usePathname();

  // Split the path into segments and filter out empty strings
  const segments = pathname
    .split('/')
    .filter((item) => item !== '');

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Always include a link to Home */}
        {/* <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/dashboard">Dashboard</Link>} />
        </BreadcrumbItem>

        {segments.length > 0 && <BreadcrumbSeparator />} */}

        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;

          // Format label (e.g., "blog-post" to "Blog Post")
          const label =
            segment.charAt(0).toUpperCase() +
            segment.slice(1).replace(/-/g, ' ');

          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={
                      <Link href={href}>{label}</Link>
                    }
                  />
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}

        {/* <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/docs/components">Components</Link>} />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem> */}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
