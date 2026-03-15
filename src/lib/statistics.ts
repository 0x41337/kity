/**
 * Lanczos approximation coefficients for the log-gamma function.
 * Source: Numerical Recipes in C, Chapter 6
 */
const LANCZOS_COEFFICIENTS = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    1.208650973866179e-3,
    -5.395239384953e-6,
] as const

/**
 * Computes the natural logarithm of the Gamma function using the Lanczos approximation.
 * Accurate to ~15 significant digits for x > 0.
 */
function logGamma(x: number): number {
    let y = x
    let ser = 1.000000000190015
    const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5)

    for (const coef of LANCZOS_COEFFICIENTS) {
        ser += coef / ++y
    }

    return -tmp + Math.log(2.5066282746310005 * ser / x)
}

/**
 * Evaluates the continued fraction expansion used in the regularized incomplete beta function.
 * Uses Lentz's method for numerical stability.
 */
function continuedFraction(x: number, a: number, b: number): number {
    const qab = a + b
    const qap = a + 1
    const qam = a - 1

    let am = 1
    let bm = 1
    let az = 1
    let bz = 1 - (qab * x) / qap

    for (let m = 1; m <= 100; m++) {
        const tem = 2 * m

        let d = (m * (b - m) * x) / ((qam + tem) * (a + tem))
        const nextAz = bz + d * am
        am = bz

        d = -((a + m) * (qab + m) * x) / ((a + tem) * (qap + tem))
        const nextBz = nextAz + d * bm
        bm = nextAz
        az = nextBz
        bz = nextAz

        if (Math.abs(az - am) < 1e-10 * Math.abs(az)) break
    }

    return az
}

/**
 * Computes the regularized incomplete beta function I_x(a, b).
 * Used as the CDF of the Beta distribution.
 *
 * @param x - Value in [0, 1]
 * @param a - Shape parameter alpha (a > 0)
 * @param b - Shape parameter beta (b > 0)
 */
export function regularizedIncompleteBeta(x: number, a: number, b: number): number {
    if (x < 0 || x > 1) return 0

    const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b)
    const symmetryThreshold = (a + 1) / (a + b + 2)

    if (x < symmetryThreshold) {
        const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - logBeta) / a
        return front * continuedFraction(x, a, b)
    }

    // Use symmetry relation to improve convergence: I_x(a,b) = 1 - I_(1-x)(b,a)
    const front = Math.exp(Math.log(1 - x) * b + Math.log(x) * a - logBeta) / b
    return 1 - front * continuedFraction(1 - x, b, a)
}

/**
 * Computes the inverse of the regularized incomplete beta function (quantile function).
 * Uses binary search — 30 iterations yield precision of ~10^-9, sufficient for confidence intervals.
 *
 * @param p - Probability in [0, 1]
 * @param a - Shape parameter alpha (a > 0)
 * @param b - Shape parameter beta (b > 0)
 * @returns x such that I_x(a, b) ≈ p
 */
export function inverseBeta(p: number, a: number, b: number): number {
    let low = 0
    let high = 1

    for (let i = 0; i < 30; i++) {
        const mid = (low + high) / 2
        if (regularizedIncompleteBeta(mid, a, b) < p) {
            low = mid
        } else {
            high = mid
        }
    }

    return (low + high) / 2
}

/**
 * Computes the lower bound of a one-sided 99% confidence interval for a proportion
 * using the Clopper-Pearson exact method (Beta distribution).
 *
 * The prior is Beta(hits, total - hits), which corresponds to a
 * Bayesian estimate with a uniform prior — robust for small sample sizes.
 *
 * @param hits  - Number of successes
 * @param total - Number of trials
 * @returns Lower bound in [0, 1], or 0 for degenerate cases
 */
export function lowerConfidenceBound(hits: number, total: number): number {
    if (total === 0 || hits < 0 || hits > total) return 0

    // Edge case: 0 hits — the lower bound is 0 by definition
    if (hits === 0) return 0

    // alpha = 0.01 → one-sided 99% lower confidence bound
    return inverseBeta(0.01, hits, total - hits + 1)
}

export interface RevisionMetrics {
    /** Raw accuracy as a percentage (0–100) */
    accuracyRate: number
    /** Conservative knowledge estimate: lower bound of 99% CI, as a percentage (0–100) */
    knowledgeRate: number
    /** Difference between raw accuracy and the lower CI bound, as percentage points (always >= 0) */
    marginOfError: number
}

/**
 * Calculates performance metrics for a revision session.
 *
 * - `accuracyRate`: simple hit ratio (hits / total)
 * - `knowledgeRate`: conservative estimate using the lower bound of a 99% Bayesian
 *    confidence interval. This penalizes low sample sizes — with few questions,
 *    a high score is less trustworthy and knowledgeRate reflects that.
 * - `marginOfError`: how far the conservative estimate is from the raw accuracy.
 *    A large margin signals low statistical confidence (small sample).
 *
 * @param hits  - Number of correct answers
 * @param total - Total number of questions
 */
export function calculateMetrics(hits: number, total: number): RevisionMetrics {
    if (total === 0) return { accuracyRate: 0, knowledgeRate: 0, marginOfError: 0 }

    const accuracyRate = Number(((hits / total) * 100).toFixed(2))
    const knowledgeRate = Number((lowerConfidenceBound(hits, total) * 100).toFixed(2))

    // Clamped to 0 to avoid floating-point negatives in edge cases (e.g. hits = 0)
    const marginOfError = Number(Math.max(0, accuracyRate - knowledgeRate).toFixed(2))

    return { accuracyRate, knowledgeRate, marginOfError }
}