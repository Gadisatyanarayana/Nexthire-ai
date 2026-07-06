export type ResilientFetchOptions = {
	retries?: number;
	timeoutMs?: number;
	retryDelayMs?: number;
};

function isAbortError(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	const maybeError = error as { name?: string };
	return maybeError.name === "AbortError";
}

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resilientFetch(
	input: RequestInfo | URL,
	init: RequestInit = {},
	options: ResilientFetchOptions = {}
): Promise<Response> {
	const retries = Math.max(0, options.retries ?? 1);
	const timeoutMs = Math.max(1000, options.timeoutMs ?? 7000);
	const retryDelayMs = Math.max(50, options.retryDelayMs ?? 250);

	let lastError: unknown;

	for (let attempt = 0; attempt <= retries; attempt++) {
		const controller = new AbortController();
		let timedOut = false;
		const timeout = setTimeout(() => {
			timedOut = true;
			controller.abort();
		}, timeoutMs);

		if (init.signal) {
			const onAbort = () => controller.abort();
			if (init.signal.aborted) {
				controller.abort();
			} else {
				init.signal.addEventListener("abort", onAbort, { once: true });
			}
		}

		try {
			const response = await fetch(input, {
				...init,
				signal: controller.signal,
			});

			if (response.status >= 500 && attempt < retries) {
				clearTimeout(timeout);
				await wait(retryDelayMs * (attempt + 1));
				continue;
			}

			clearTimeout(timeout);
			return response;
		} catch (error) {
			if (isAbortError(error)) {
				lastError = timedOut
					? new Error(`Request timed out after ${timeoutMs}ms`)
					: new Error("Request was cancelled");
			} else {
				lastError = error;
			}
			clearTimeout(timeout);
			if (attempt < retries) {
				await wait(retryDelayMs * (attempt + 1));
				continue;
			}
		}
	}

	throw lastError instanceof Error ? lastError : new Error("Request failed");
}
