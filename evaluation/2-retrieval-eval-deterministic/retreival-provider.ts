import promptfoo from "promptfoo";
import type { ApiProvider, ProviderResponse } from "promptfoo";
import { performSemanticSearch } from "../../scripts/semantic-search";

export default class RetrievalProvider implements ApiProvider {
  id(): string {
    return "retrieval-provider";
  }

  async callApi(prompt: string): Promise<ProviderResponse> {
    const cache = await promptfoo.cache.getCache();

    const cachedResult =
      ((await cache.get(prompt)) as ProviderResponse) || undefined;

    if (cachedResult) return cachedResult;

    const results = await performSemanticSearch(prompt);
    const formattedResult = {
      output: results,
    };
    await cache.set(prompt, formattedResult, { ttl: 3600 }); // TTL in seconds

    return formattedResult;
  }
}
