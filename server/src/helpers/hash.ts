import bcrypt from "bcrypt";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  const passHash = await bcrypt.hash(password, salt);

  return passHash;
}

export async function checkPassword(password: string, passwordHas: string) {
  return await bcrypt.compare(password, passwordHas);
}
