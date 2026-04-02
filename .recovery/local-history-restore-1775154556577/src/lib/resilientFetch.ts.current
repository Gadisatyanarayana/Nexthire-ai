export type ResilientFetchOptions = {
	retries?: number;
	timeoutMs?: number;
	retryDelayMs?: number;
};

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
		const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
			lastError = error;
			clearTimeout(timeout);
			if (attempt < retries) {
				await wait(retryDelayMs * (attempt + 1));
				continue;
			}
		}
	}

	throw lastError instanceof Error ? lastError : new Error("Request failed");
}
