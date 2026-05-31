import { ComponentProps } from 'react';
import { useFormContext } from '../form.hook';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SubmitButtonProps = ComponentProps<typeof Button> & {
  text: string;
};

export const SubmitButton = ({
  text,
  ...props
}: SubmitButtonProps) => {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state) => state.isSubmitting}
    >
      {(isSubmitting) => (
        <Button
          type="submit"
          size={props.size || 'lg'}
          {...props}
          disabled={isSubmitting}
          className={cn('w-full', props.className)}
        >
          {text}
        </Button>
      )}
    </form.Subscribe>
  );
};
