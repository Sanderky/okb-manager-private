export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  regex?: RegExp;
  errorMessage: string;
}

export type ValidationFields = 'email' | 'password';

export const getRules = (field: ValidationFields): ValidationRule[] => {
  if (field === 'email') {
    return [
      { required: true, errorMessage: 'Email jest wymagany' },
      {
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessage: 'Niepoprawny format adresu email',
      },
      {
        maxLength: 254,
        errorMessage: 'Maksymalna długość adresu email to 254 znaki',
      },
    ];
  }

  if (field === 'password') {
    return [
      {
        required: true,
        errorMessage: 'Hasło jest wymagane',
      },
      { minLength: 6, errorMessage: 'Minimalna długość hasła to 6 znaków' },
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
