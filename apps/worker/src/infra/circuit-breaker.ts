import CircuitBreaker from "opossum";

export const createCircuitBreaker = <T extends (...args: any[]) => any>(
  action: T,
  options: CircuitBreaker.Options = {},
) => {
  const breaker = new CircuitBreaker(action, {
    timeout: 5000, // If the function takes longer than 5 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
    resetTimeout: 30000, // After 30 seconds, try again
    volumeThreshold: 5, // Minimum number of requests before circuit breaker kicks in
    ...options,
  });

  return breaker;
};
