export function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}
