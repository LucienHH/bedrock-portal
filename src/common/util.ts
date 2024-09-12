export const isXuid = (xuid: string) => /^\d{16}$/.test(xuid)

export const getRandomUint64 = () => {
  // Generate two 32-bit random integers
  const high = Math.floor(Math.random() * 0xFFFFFFFF)
  const low = Math.floor(Math.random() * 0xFFFFFFFF)

  // Combine them to create a 64-bit unsigned integer
  const result = (BigInt(high) << BigInt(32)) | BigInt(low)
  return result
}
