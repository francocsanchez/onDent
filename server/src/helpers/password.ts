import { randomInt } from "node:crypto";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const DEFAULT_TEMPORARY_PASSWORD_LENGTH = 8;

function pickRandomChar(charset: string) {
  return charset[randomInt(0, charset.length)];
}

function shuffle(values: string[]) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(0, index + 1);
    [values[index], values[randomIndex]] = [values[randomIndex], values[index]];
  }

  return values;
}

export function generateTemporaryPassword(length = DEFAULT_TEMPORARY_PASSWORD_LENGTH) {
  if (length !== DEFAULT_TEMPORARY_PASSWORD_LENGTH) {
    throw new Error(`La contraseña temporal debe tener exactamente ${DEFAULT_TEMPORARY_PASSWORD_LENGTH} caracteres`);
  }

  const allChars = `${UPPERCASE}${LOWERCASE}${NUMBERS}`;
  const passwordChars = [
    pickRandomChar(UPPERCASE),
    pickRandomChar(LOWERCASE),
    pickRandomChar(NUMBERS),
  ];

  while (passwordChars.length < length) {
    passwordChars.push(pickRandomChar(allChars));
  }

  return shuffle(passwordChars).join("");
}
