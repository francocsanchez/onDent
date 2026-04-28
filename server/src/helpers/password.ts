const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const NUMBERS = "23456789";

function pickRandomChar(charset: string) {
  return charset[Math.floor(Math.random() * charset.length)];
}

function shuffle(values: string[]) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[randomIndex]] = [values[randomIndex], values[index]];
  }

  return values;
}

export function generateTemporaryPassword(length = 12) {
  const normalizedLength = Math.max(length, 8);
  const allChars = `${UPPERCASE}${LOWERCASE}${NUMBERS}`;

  const passwordChars = [
    pickRandomChar(UPPERCASE),
    pickRandomChar(LOWERCASE),
    pickRandomChar(NUMBERS),
  ];

  while (passwordChars.length < normalizedLength) {
    passwordChars.push(pickRandomChar(allChars));
  }

  return shuffle(passwordChars).join("");
}
