// Model fetcher for OpenAI-compatible providers (OpenAI, Nvidia, OmniRoute).
// Returns a sorted, deduplicated list of model IDs from GET /v1/models.

async function fetchModels({ apiKey, baseURL }) {
  if (!apiKey || !baseURL) return [];
  const url = baseURL.replace(/\/+$/, '') + '/models';

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(8000) // 8s timeout
    });
    if (!res.ok) return [];
    const json = await res.json();
    const models = (json.data || [])
      .map(m => m.id)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return models;
  } catch (e) {
    console.log('[models] fetch error:', e && e.message);
    return [];
  }
}

function getBaseURL(settings) {
  const provider = settings.provider;
  const providerUrls = settings.providerUrls || {};
  if (provider === 'openai') return 'https://api.openai.com/v1';
  if (provider === 'nvidia') return 'https://integrate.api.nvidia.com/v1';
  if (provider === 'omniroute') return providerUrls.omniroute || 'http://localhost:20128/v1';
  return null; // Anthropic & Gemini don't have /v1/models in this format
}

async function fetchModelsForProvider(settings) {
  const provider = settings.provider;
  const keys = settings.apiKeys || {};
  const apiKey = keys[provider];
  const baseURL = getBaseURL(settings);

  // For non-OpenAI-compatible providers, return configured models
  if (!baseURL) {
    const m = settings.models[provider] || {};
    return [m.fast, m.smart].filter(Boolean);
  }

  const fetched = await fetchModels({ apiKey, baseURL });
  // If fetch fails, fall back to configured models
  if (!fetched.length) {
    const m = settings.models[provider] || {};
    return [m.fast, m.smart].filter(Boolean);
  }
  return fetched;
}

module.exports = { fetchModelsForProvider };
