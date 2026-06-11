export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
  fallback: T
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => {
          console.log(`[loader] timeout ${label} after ${timeoutMs}ms`);
          resolve(fallback);
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    console.log(`[loader] error ${label}:`, error);
    return fallback;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const logLoaderStart = (label: string) => {
  console.log(`[loader] start ${label}`);
};

export const logLoaderDone = (label: string) => {
  console.log(`[loader] done ${label}`);
};
