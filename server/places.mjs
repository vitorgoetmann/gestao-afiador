import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const STATES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resultCache = new Map();

export class PlacesError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const normalized = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

async function getJson(url) {
  let response;
  try {
    response = await fetch(url, { headers: { 'User-Agent': 'VibeAfiacoesLeadFinder/1.0' }, signal: AbortSignal.timeout(15000) });
  } catch {
    throw new PlacesError('Não foi possível conectar ao serviço de localização. Tente novamente.', 502);
  }
  if (!response.ok) throw new PlacesError('O serviço de localização não respondeu. Tente novamente.', 502);
  return response.json();
}

function findCity(region) {
  const match = region.match(/^(.+?)[,\s]+([a-zA-Z]{2})$/);
  if (!match || !Object.hasOwn(STATES, match[2].toUpperCase())) throw new PlacesError('Informe a região como Cidade, UF. Ex.: Palhoça, SC.');
  const uf = match[2].toUpperCase();
  return { name: match[1].trim(), state: STATES[uf], uf };
}

async function getCityBounds(city) {
  const url = new URL('https://photon.komoot.io/api/');
  url.search = new URLSearchParams({ q: `${city.name}, ${city.state}`, countrycode: 'BR', limit: '10' }).toString();
  const data = await getJson(url);
  const match = data.features?.find(({ properties: p }) =>
    normalized(p.name ?? '') === normalized(city.name) && normalized(p.state ?? '') === normalized(city.state)
      && p.countrycode === 'BR' && p.type === 'city' && p.extent?.length === 4);
  if (!match) throw new PlacesError('Não foi possível localizar os limites dessa cidade no mapa aberto.', 404);
  const [west, north, east, south] = match.properties.extent;
  return { bbox: [west, south, east, north], name: match.properties.name };
}

function queryOverture(input) {
  const executable = process.env.VIBE_LEADS_PYTHON || path.join(root, '.venv-leads', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  return new Promise((resolve, reject) => {
    const child = execFile(executable, [path.join(root, 'server', 'overture_search.py')], {
      timeout: 120000, maxBuffer: 32 * 1024 * 1024, windowsHide: true,
      env: { ...process.env, PYTHONUTF8: '1' },
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Busca Overture:', stderr || error.message);
        reject(new PlacesError(error.code === 'ENOENT'
          ? 'A busca precisa da instalação local de dependências. Consulte o README do projeto.'
          : 'A base de estabelecimentos está indisponível ou demorou demais para responder. Tente novamente.', 503));
        return;
      }
      try { resolve(JSON.parse(stdout)); } catch { reject(new PlacesError('A base retornou uma resposta inválida.', 502)); }
    });
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify(input));
  });
}

export async function searchPlaces(input) {
  const keyword = typeof input?.keyword === 'string' ? input.keyword.trim() : '';
  const region = typeof input?.region === 'string' ? input.region.trim() : '';
  const limit = Number(input?.limit);
  if (!keyword || keyword.length > 80 || !region || region.length > 120 || !Number.isInteger(limit) || limit < 1 || limit > 60) {
    throw new PlacesError('Informe palavra-chave, região e quantidade de 1 a 60 resultados.');
  }
  const city = findCity(region);
  const key = `${city.uf}:${normalized(city.name)}:${normalized(keyword)}`;
  const cached = resultCache.get(key);
  let places = cached?.expires > Date.now() ? cached.places : undefined;
  if (!places) {
    const location = await getCityBounds(city);
    const data = await queryOverture({ keyword, city: location.name, uf: city.uf, bbox: location.bbox });
    places = data.places.map((place) => ({
      ...place,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.address}`)}`,
    }));
    if (resultCache.size >= 10) resultCache.delete(resultCache.keys().next().value);
    resultCache.set(key, { places, expires: Date.now() + 600000 });
  }
  return { places, total: places.length };
}
