// utils.ts
export const patterns = {
  dateOnly: /^[0-9/.-]+$/,
  digitsOnly: /^[0-9]+$/,
  floatOnly: /^[0-9.,]+$/,
  alphaOnly: /^[a-z]+$/i,
  alphaNumericOnly: /^[a-z0-9]+$/i,
  urlOnly: /^[a-z0-9.\-:/?=&#]+$/i,
  emailOnly: /^[a-z0-9@_\-+.]+$/i,
  telOnly: /^[0-9 ()/+]+$/i,
};

export function isValidEmail(email: string): boolean {
  const pattern = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
  return pattern.test(email);
}

export function isValidURL(url: string): boolean {
  const pattern = /^(https?:\/\/)([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;
  return pattern.test(url);
}

export function isValidTel(tel: string): boolean {
  const pattern = /^\+?[0-9\s\-()]{7,15}$/;
  return pattern.test(tel);
}

export function trim(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}
