import json
import gzip
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler

from server.overture_search import normalize, search_overture

STATES = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
    'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
    'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
    'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
    'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
    'SE': 'Sergipe', 'TO': 'Tocantins',
}


class RequestError(Exception):
    def __init__(self, message, status):
        super().__init__(message)
        self.status = status


def get_json(url, headers=None):
    request = urllib.request.Request(url, headers={'User-Agent': 'VibeAfiacoesLeadFinder/1.0', **(headers or {})})
    with urllib.request.urlopen(request, timeout=15) as response:
        body = response.read()
        if response.headers.get('Content-Encoding', '').lower() == 'gzip' or body.startswith(b'\x1f\x8b'):
            body = gzip.decompress(body)
        return json.loads(body)


def authenticate(authorization):
    url = os.environ.get('VITE_SUPABASE_URL', '').rstrip('/')
    key = os.environ.get('VITE_SUPABASE_ANON_KEY', '')
    if not url or not key:
        raise RequestError('Supabase não configurado no servidor.', 503)
    if not authorization or not re.fullmatch(r'Bearer [^\s]+', authorization, re.IGNORECASE):
        raise RequestError('Entre no sistema para buscar clientes.', 401)
    try:
        get_json(url + '/auth/v1/user', {'apikey': key, 'Authorization': authorization})
    except urllib.error.HTTPError as error:
        if error.code in (400, 401, 403):
            raise RequestError('Sessão inválida. Entre novamente.', 401) from error
        raise RequestError('Não foi possível validar a sessão. Tente novamente.', 503) from error
    except (OSError, ValueError) as error:
        raise RequestError('Não foi possível validar a sessão. Tente novamente.', 503) from error


def find_city_and_bounds(region):
    match = re.fullmatch(r'(.+?)[,\s]+([a-zA-Z]{2})', region)
    if not match or match.group(2).upper() not in STATES:
        raise RequestError('Informe a região como Cidade, UF. Ex.: Palhoça, SC.', 400)
    city_name, uf = match.group(1).strip(), match.group(2).upper()
    state = STATES[uf]
    query = urllib.parse.urlencode({'q': f'{city_name}, {state}', 'countrycode': 'BR', 'limit': 10})
    data = get_json('https://photon.komoot.io/api/?' + query)
    match = next((feature['properties'] for feature in data.get('features', [])
                  if normalize(feature['properties'].get('name')) == normalize(city_name)
                  and normalize(feature['properties'].get('state')) == normalize(state)
                  and feature['properties'].get('countrycode') == 'BR'
                  and feature['properties'].get('type') == 'city'
                  and len(feature['properties'].get('extent', [])) == 4), None)
    if not match:
        raise RequestError('Não foi possível localizar os limites dessa cidade no mapa aberto.', 404)
    west, north, east, south = match['extent']
    return match['name'], uf, [west, south, east, north]


def search(input_data):
    keyword = input_data.get('keyword')
    region = input_data.get('region')
    limit = input_data.get('limit')
    if not isinstance(keyword, str) or not keyword.strip() or len(keyword.strip()) > 80 or not isinstance(region, str) or not region.strip() or len(region.strip()) > 120 or isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 60:
        raise RequestError('Informe palavra-chave, região e quantidade de 1 a 60 resultados.', 400)
    city, uf, bbox = find_city_and_bounds(region.strip())
    result = search_overture({'keyword': keyword.strip(), 'city': city, 'uf': uf, 'bbox': bbox})
    places = []
    for place in result['places']:
        places.append({
            'id': place['id'], 'name': place['name'], 'address': place['address'],
            'phone': place['phone'], 'website': place['website'], 'social': place['social'],
            'category': place['category'],
            'mapsUrl': 'https://www.google.com/maps/search/?api=1&query=' + urllib.parse.quote(f"{place['name']}, {place['address']}", safe=''),
        })
    return {'places': places, 'total': len(places)}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            authenticate(self.headers.get('Authorization'))
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > 10000:
                raise RequestError('Dados da busca inválidos.', 400)
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise RequestError('Dados da busca inválidos.', 400)
            body = json.dumps(search(data), ensure_ascii=False).encode('utf-8')
            if len(body) > 4 * 1024 * 1024:
                raise RequestError('A busca encontrou dados demais. Use uma atividade mais específica.', 413)
            self.respond(200, body)
        except RequestError as error:
            self.respond(error.status, json.dumps({'error': str(error)}, ensure_ascii=False).encode('utf-8'))
        except (ValueError, json.JSONDecodeError):
            self.respond(400, json.dumps({'error': 'Dados da busca inválidos.'}, ensure_ascii=False).encode('utf-8'))
        except Exception as error:
            print(f'Erro na busca de clientes: {error}', flush=True)
            self.respond(503, json.dumps({'error': 'A busca está indisponível. Tente novamente em alguns instantes.'}, ensure_ascii=False).encode('utf-8'))

    def respond(self, status, body):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
