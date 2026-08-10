const BCRYPT_COST = 10

export async function hashPassword(plainPassword: string): Promise<string> {
  return Bun.password.hash(plainPassword, {
    algorithm: 'bcrypt',
    cost: BCRYPT_COST
  })
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return Bun.password.verify(plainPassword, hashedPassword)
}
