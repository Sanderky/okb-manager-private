export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  regex?: RegExp;
  errorMessage: string;
}

export type ValidationFields = 'email' | 'password';

export const getRules = (
  field: ValidationFields,
  t: (key: string) => string
): ValidationRule[] => {
  if (field === 'email') {
    return [
      { required: true, errorMessage: t('login.formValidate.emailRequired') },
      {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessage: t('login.formValidate.emailInvalid'),
      },
      { maxLength: 254, errorMessage: t('login.formValidate.emailMaxLength') },
    ];
  }

  if (field === 'password') {
    return [
      {
        required: true,
        errorMessage: t('login.formValidate.passwordRequired'),
      },
      { minLength: 6, errorMessage: t('login.formValidate.passwordMinLength') },
    ];
  }

  return [];
};

export const validateField = (
  value: string,
  rules: ValidationRule[]
): string | null => {
  for (const rule of rules) {
    if (rule.required && !value) return rule.errorMessage;
    if (rule.minLength && value.length < rule.minLength)
      return rule.errorMessage;
    if (rule.maxLength && value.length > rule.maxLength)
      return rule.errorMessage;
    if (rule.regex && !rule.regex.test(value)) return rule.errorMessage;
  }
  return null;
};
