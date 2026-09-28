import Link from 'next/link';
import { Chart03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import type { IconSvgObject } from '@/types/icon';

type FinanceNotReadyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  icon?: IconSvgObject;
};

export function FinanceNotReadyState({
  title,
  description,
  actionLabel = 'Buka setup Finance',
  icon = Chart03Icon,
}: FinanceNotReadyStateProps) {
  return (
    <div className="@container/main flex flex-1 items-center justify-center p-4 md:p-6">
      <Empty className="bg-card mx-auto min-h-96 w-full max-w-3xl justify-center rounded-3xl border-solid px-6 py-10 shadow-sm sm:px-12 sm:py-14">
        <EmptyHeader className="max-w-xl gap-4">
          <Badge variant="secondary">
            Finance · Fitur opsional
          </Badge>
          <EmptyMedia
            variant="icon"
            className="bg-primary/10 text-primary size-16 rounded-2xl"
          >
            <HugeiconsIcon icon={icon} size={28} />
          </EmptyMedia>
          <EmptyTitle className="text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </EmptyTitle>
          <EmptyDescription className="max-w-lg text-sm leading-6 text-pretty sm:text-base sm:leading-7">
            {description}
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="mt-2 w-full max-w-sm">
          <Link
            href="/dashboard/finance/onboarding"
            className={buttonVariants({
              size: 'lg',
              className: 'h-12 w-full',
            })}
          >
            {actionLabel}
          </Link>
          <p className="text-muted-foreground text-xs leading-5">
            Selesaikan setup Finance untuk membuka fitur
            ini. Orders, Products, dan Reports tetap dapat
            digunakan.
          </p>
        </EmptyContent>
      </Empty>
    </div>
  );
}
