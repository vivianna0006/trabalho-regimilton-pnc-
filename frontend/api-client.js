(function (window) {
  const FALLBACK_HOSTS = ['localhost', '127.0.0.1'];
  const DEFAULT_PORTS = ['3000'];

  const unique = (values) => Array.from(new Set(values.filter(Boolean)));

  const buildCandidates = () => {
    const hostnames = unique([window.location.hostname, ...FALLBACK_HOSTS]);
    const baseProtocols = window.location.protocol === 'https:' ? ['https:', 'http:'] : ['http:', 'https:'];
    const protocols = unique(baseProtocols);
    const ports = unique([window.location.port, ...DEFAULT_PORTS, null]);
    const candidates = new Set();

    hostnames.forEach((host) => {
      protocols.forEach((protocol) => {
        ports.forEach((port) => {
          if (port) {
            candidates.add(`${protocol}//${host}:${port}/api`);
            candidates.add(`${protocol}//${host}:${port}`);
          } else {
            candidates.add(`${protocol}//${host}/api`);
            candidates.add(`${protocol}//${host}`);
          }
        });
      });
    });

    candidates.add('http://localhost:3000/api');
    candidates.add('http://localhost:3000');
    candidates.add('http://127.0.0.1:3000/api');
    candidates.add('http://127.0.0.1:3000');

    return Array.from(candidates);
  };

  const cloneOptions = (options) => {
    if (!options) {
      return {};
    }

    const cloned = { ...options };

    if (options.headers instanceof Headers) {
      cloned.headers = new Headers(options.headers);
    } else if (options.headers) {
      cloned.headers = { ...options.headers };
    }

    return cloned;
  };

  const wrapError = (error) => {
    if (error && (error.message?.includes('Failed to fetch') || error.name === 'TypeError')) {
      return new Error('Nao foi possivel conectar ao servidor. Verifique se o back-end esta em execucao.');
    }
    return error || new Error('Nao foi possivel completar a requisicao.');
  };

  let cachedBaseUrl = null;
  let discoveryPromise = null;
  let discoveryResponse = null;
  const candidates = buildCandidates();

  const resolveBase = async (path, options) => {
    if (cachedBaseUrl) {
      return cachedBaseUrl;
    }

    if (discoveryPromise) {
      return discoveryPromise;
    }

    discoveryPromise = (async () => {
      let lastError = null;

      for (const candidate of candidates) {
        try {
          const response = await fetch(`${candidate}${path}`, options);
          const contentType = response.headers?.get('content-type') || '';

          if (!response.ok || (response.status !== 204 && !contentType.includes('application/json'))) {
            lastError = new Error(`Endpoint ${candidate}${path} respondeu ${response.status}.`);
            continue;
          }

          cachedBaseUrl = candidate;
          discoveryResponse = response;
          return cachedBaseUrl;
        } catch (error) {
          lastError = error;
        }
      }

      throw wrapError(lastError);
    })();

    try {
      return await discoveryPromise;
    } finally {
      discoveryPromise = null;
    }
  };

  const apiFetch = async (path, options = {}) => {
    if (typeof path !== 'string' || !path.startsWith('/')) {
      throw new Error(`ApiClient.fetch requer um path iniciado por "/". Recebido: ${path}`);
    }

    if (cachedBaseUrl) {
      try {
        return await fetch(`${cachedBaseUrl}${path}`, options);
      } catch (error) {
        throw wrapError(error);
      }
    }

    const discoveryOptions = cloneOptions(options);
    let baseUrl;

    try {
      baseUrl = await resolveBase(path, discoveryOptions);
    } catch (error) {
      throw wrapError(error);
    }

    if (discoveryResponse) {
      const responseToReturn = discoveryResponse;
      discoveryResponse = null;
      return responseToReturn;
    }

    try {
      return await fetch(`${baseUrl}${path}`, options);
    } catch (error) {
      throw wrapError(error);
    }
  };

  window.ApiClient = {
    fetch: apiFetch,
    getBaseUrl: () => cachedBaseUrl,
    resetBaseUrl: () => {
      cachedBaseUrl = null;
      discoveryResponse = null;
    }
  };
})(window);

