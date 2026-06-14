import { ComponentProps } from 'react';
import { useFormContext } from '../form.hook';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

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
          {isSubmitting && <Spinner className="mr-2" />}
          {text}
        </Button>
      )}
    </form.Subscribe>
  );
};
