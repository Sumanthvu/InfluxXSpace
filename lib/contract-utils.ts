/**
 * Safely call a contract method and return a default value if it fails
 */
export async function safeContractCall<T>(
  contractCall: () => Promise<any>,
  defaultValue: T,
  errorMessage?: string,
): Promise<T> {
  try {
    const result = await contractCall()
    return result !== undefined && result !== null ? result : defaultValue
  } catch (error) {
    if (errorMessage) {
      console.log(errorMessage)
    }
    return defaultValue
  }
}

/**
 * Safely get a number from a contract call
 */
export async function safeGetNumber(
  contractCall: () => Promise<any>,
  defaultValue = 0,
  errorMessage?: string,
): Promise<number> {
  try {
    const result = await contractCall()
    return Number(result) || defaultValue
  } catch (error) {
    if (errorMessage) {
      console.log(errorMessage)
    }
    return defaultValue
  }
}

/**
 * Safely get a boolean array from a contract call
 */
export async function safeGetBooleanArray(
  contractCall: () => Promise<any>,
  defaultValue: boolean[] = [],
  errorMessage?: string,
): Promise<boolean[]> {
  try {
    const result = await contractCall()
    return result || defaultValue
  } catch (error) {
    if (errorMessage) {
      console.log(errorMessage)
    }
    return defaultValue
  }
}
