'use client';

import { cn } from '@/lib/utils/ui';
import { HugeiconsIcon } from '@/components/icons/hugeicons-icon';
import type { IconSvgObject } from '@/types/icon';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';

export type StepperStep = {
  title: string;
  description?: string;
  icon: IconSvgObject;
};

type StepperProps = {
  steps: StepperStep[];
  currentStep: number;
  onStepChange?: (step: number) => void;
};

export function Stepper({
  steps,
  currentStep,
  onStepChange,
}: StepperProps) {
  return (
    <nav
      aria-label="Progress onboarding"
      className="w-full"
    >
      <ol className="flex min-w-max items-start gap-2 lg:min-w-0 lg:gap-3">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = Boolean(onStepChange);

          return (
            <li
              key={step.title}
              className="flex flex-1 items-start gap-2 lg:gap-3"
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onStepChange?.(index)}
                className={cn(
                  'group flex min-w-28 items-start gap-2 text-left lg:min-w-0',
                  !isClickable && 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full border text-sm transition-colors',
                    isComplete &&
                      'border-primary bg-primary text-primary-foreground',
                    isCurrent &&
                      'border-primary bg-primary/10 text-primary ring-primary/10 ring-4',
                    !isComplete &&
                      !isCurrent &&
                      'border-border bg-background text-muted-foreground'
                  )}
                >
                  {isComplete ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={18}
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={step.icon}
                      size={18}
                    />
                  )}
                </span>
                <span className="hidden min-w-0 flex-col gap-0.5 pt-0.5 lg:flex">
                  <span
                    className={cn(
                      'truncate text-sm font-medium',
                      isCurrent
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description ? (
                    <span className="text-muted-foreground max-w-28 truncate text-xs">
                      {step.description}
                    </span>
                  ) : null}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'bg-border mt-4 h-px flex-1 transition-colors',
                    isComplete && 'bg-primary/50'
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
