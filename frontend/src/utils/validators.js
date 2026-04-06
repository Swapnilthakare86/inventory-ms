const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_DOMAINS = ['.in', '.com'];
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;

export const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Enter a valid email address';
  } else {
    const domain = email.trim().split('@')[1];
    if (!ALLOWED_DOMAINS.includes(domain)) {
      errors.email = `Email must be from an allowed domain (e.g. @xtsworld.in or @test.com)`;
    }
  }
  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  return errors;
};

export const validateRegister = ({ name, email, password, confirmPassword, address }) => {
  const errors = {};
  if (!name.trim()) errors.name = 'Name is required';
  else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  else if (/\d/.test(name)) errors.name = 'Name must not contain numbers';

  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Enter a valid email address';

  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (!PASSWORD_REGEX.test(password)) errors.password = 'Must include uppercase, number & special character';

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

  if (!address.trim()) errors.address = 'Address is required';
  else if (address.trim().length < 5) errors.address = 'Address must be at least 5 characters';

  return errors;
};

export const passwordStrength = (password) => {
  if (!password) return null;
  const strong = password.length >= 8 && PASSWORD_REGEX.test(password);
  const medium = password.length >= 8 || /[A-Z]/.test(password) || /\d/.test(password);
  if (strong) return { label: 'Strong', color: 'success' };
  if (medium) return { label: 'Medium', color: 'warning' };
  return { label: 'Weak', color: 'danger' };
};
