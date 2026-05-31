import { FieldError } from '@/components/ui/field';
import {
  AnyFieldApi,
  useStore,
} from '@tanstack/react-form';

export const FieldInfo = ({
  field,
}: {
  field: AnyFieldApi;
}) => {
  const errors = useStore(
    field.store,
    (state) => state.meta.errors
  );

  return (
    <>
      {field.state.meta.isTouched &&
      !field.state.meta.isValid ? (
        <FieldError errors={errors} />
      ) : // field.state.meta.errors.map((err) => (
      //   <FieldError key={err.message} errors={err.message} />
      //   // <em key={err.message}>{err.message}</em>
      // ))
      null}
      {field.state.meta.isValidating
        ? 'Validating...'
        : null}
    </>
  );
};
