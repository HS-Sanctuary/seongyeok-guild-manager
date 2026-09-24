export function isValidBirthdayMMDD(value: string): boolean {
  if (!/^\d{4}$/.test(value)) return false;
  const month = Number(value.slice(0, 2));
  const day = Number(value.slice(2));
  const maxDay = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  return Boolean(maxDay && day >= 1 && day <= maxDay);
}

const CODE_SPECIAL_CHARS = new Set(["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"]);

export function matchesSignupCode(code: string, favoriteWord: string, birthdayMMDD: string): boolean {
  const prefix = `${favoriteWord}${birthdayMMDD}`;
  const suffix = code.slice(prefix.length);
  return code.startsWith(prefix)
    && suffix.length === 2
    && suffix[0] !== suffix[1]
    && [...suffix].every((character) => CODE_SPECIAL_CHARS.has(character));
}
