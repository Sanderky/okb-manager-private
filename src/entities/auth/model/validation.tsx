import type { TFunction } from 'i18next';

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
  t: TFunction
): ValidationRule[] => {
  if (field === 'email') {
    return [
      { required: true, errorMessage: t('auth:validation.emailRequired') },
      {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessage: t('auth:validation.emailFormat'),
      },
      {
        maxLength: 254,
        errorMessage: t('auth:validation.emailMaxLength'),
      },
    ];
  }

  if (field === 'password') {
    return [
      {
        required: true,
        errorMessage: t('auth:validation.passwordRequired'),
      },
      { minLength: 6, errorMessage: t('auth:validation.passwordMinLength') },
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
