import { createFormHook } from '@tanstack/react-form';
import { lazy } from 'react';
import { createFormHookContexts } from '@tanstack/react-form';

export const {
  fieldContext,
  useFieldContext,
  formContext,
  useFormContext,
} = createFormHookContexts();

const TextField = lazy(() =>
  import('../form/fields/input').then((m) => ({
    default: m.InputField,
  }))
);
const PasswordField = lazy(() =>
  import('../form/fields/password').then((m) => ({
    default: m.PasswordField,
  }))
);
const TextareaField = lazy(() =>
  import('../form/fields/textarea').then((m) => ({
    default: m.TextareaField,
  }))
);
const SelectField = lazy(() =>
  import('../form/fields/select').then((m) => ({
    default: m.SelectField,
  }))
);
const MultiselectField = lazy(() =>
  import('../form/fields/multiselect').then((m) => ({
    default: m.MultiselectField,
  }))
);
const DateTimeField = lazy(() =>
  import('./fields/date-time').then((m) => ({
    default: m.DateTimeField,
  }))
);
const DateRangePresetsField = lazy(() =>
  import('./fields/date-range-presets').then((m) => ({
    default: m.DateRangePresetsField,
  }))
);
const AvatarField = lazy(() =>
  import('./fields/avatar').then((m) => ({
    default: m.AvatarField,
  }))
);

const SubmitButton = lazy(() =>
  import('../form/button/submit-button').then((m) => ({
    default: m.SubmitButton,
  }))
);

export const { useAppForm, withForm, withFieldGroup } =
  createFormHook({
    fieldComponents: {
      TextField,
      PasswordField,
      TextareaField,
      SelectField,
      MultiselectField,
      DateTimeField,
      DateRangePresetsField,
      AvatarField,
    },
    formComponents: {
      SubmitButton,
    },
    fieldContext,
    formContext,
  });
