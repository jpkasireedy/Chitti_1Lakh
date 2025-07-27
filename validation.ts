export interface PasswordValidationResult {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  specialChar: boolean;
  isValid: boolean;
  message: string;
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const result: PasswordValidationResult = {
    length: password.length >= 5 && password.length <= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[@#]/.test(password),
    isValid: false,
    message: ''
  };

  const checks = {
      length: result.length,
      uppercase: result.uppercase,
      lowercase: result.lowercase,
      number: result.number,
      specialChar: result.specialChar
  }

  result.isValid = Object.values(checks).every(v => v === true);

  if (!result.isValid) {
      if (!result.length) result.message = 'Password must be 5 to 12 characters long.';
      else if (!result.uppercase) result.message = 'Password must contain an uppercase letter.';
      else if (!result.lowercase) result.message = 'Password must contain a lowercase letter.';
      else if (!result.number) result.message = 'Password must contain a number.';
      else if (!result.specialChar) result.message = 'Password must contain @ or #.';
  } else {
      result.message = 'Password meets all requirements.';
  }

  return result;
};
