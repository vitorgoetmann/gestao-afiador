"""Search an Overture city extract without keeping a local copy of the dataset."""
import contextlib
import gzip
import io
import json
import re
import sys
import unicodedata
from urllib.request import urlopen


def normalize(value):
    return ''.join(c for c in unicodedata.normalize('NFD', str(value or '').lower()) if not unicodedata.combining(c))


def match_score(keyword, name, category, hierarchy):
    term = normalize(keyword)
    title = normalize(name)
    categories = ' '.join([category, *hierarchy]).lower()
    if re.search(r'\b(nail|nails|manicure|pedicure|unha|unhas)\b', term):
        if category == 'nail_salon':
            return 100
        if re.search(r'\b(nail|nails|manicure|pedicure|unhas?)\b', title) and category in ('', 'beauty_salon', 'hair_salon', 'spa', 'personal_care_and_beauty', 'personal_or_beauty_service'):
            return 80
        return 0
    if re.search(r'\b(barbeiro|barbearia|barber)\b', term):
        if category == 'barber':
            return 100
        return 80 if re.search(r'\b(barbearia|barbeiro|barber)\b', title) and category in ('', 'barber', 'hair_salon', 'beauty_salon') else 0
    mappings = [
        (r'cabeleireir|salao de beleza|salao', ('hair_salon', 'beauty_salon')),
        (r'padaria|padeiro', ('bakery',)),
        (r'pet shop|petshop', ('pet_store', 'pet_groomer')),
        (r'restaurante', ('restaurant',)),
        (r'mecanico|oficina mecanica', ('auto_repair', 'auto_repair_shop')),
    ]
    for pattern, allowed in mappings:
        if re.search(pattern, term):
            if any(item in category or item in hierarchy for item in allowed):
                return 90
            break
    words = re.findall(r'[a-z0-9]+', term)
    text = title + ' ' + categories.replace('_', ' ')
    return 75 if words and all(re.search(r'\b' + re.escape(word), text) for word in words) else 0


def overture_batches(bbox):
    import pyarrow.compute as pc
    import pyarrow.dataset as ds
    import pyarrow.fs as fs
    import pyarrow.parquet as pq

    with urlopen('https://stac.overturemaps.org/catalog.json', timeout=20) as response:
        catalog = response.read()
    if catalog.startswith(b'\x1f\x8b'):
        catalog = gzip.decompress(catalog)
    release = json.loads(catalog)['latest']
    with urlopen(f'https://stac.overturemaps.org/{release}/collections.parquet', timeout=30) as response:
        index = pq.read_table(io.BytesIO(response.read()))
    west, south, east, north = bbox
    bounds = ((pc.field('bbox', 'xmin') < east) & (pc.field('bbox', 'xmax') > west)
              & (pc.field('bbox', 'ymin') < north) & (pc.field('bbox', 'ymax') > south))
    index = index.filter((pc.field('collection') == 'place') & (pc.field('type') == 'Feature') & bounds)
    paths = [item['aws']['alternate']['s3']['href'].removeprefix('s3://') for item in index.column('assets').to_pylist()]
    if not paths:
        return []
    dataset = ds.dataset(paths, filesystem=fs.S3FileSystem(anonymous=True, region='us-west-2', connect_timeout=15, request_timeout=30))
    columns = [c for c in ('id', 'names', 'addresses', 'phones', 'websites', 'socials', 'taxonomy', 'categories', 'bbox', 'confidence', 'operating_status') if c in dataset.schema.names]
    return dataset.to_batches(columns=columns, filter=bounds, use_threads=True)


def search_overture(request):
    # The library occasionally writes diagnostic messages to stdout.
    with contextlib.redirect_stdout(sys.stderr):
        batches = overture_batches(request['bbox'])
        matches = []
        for batch in batches:
            for row in batch.to_pylist():
                addresses = row.get('addresses') or []
                if row.get('operating_status') in ('closed', 'permanently_closed'):
                    continue
                address = next((a for a in addresses if normalize(a.get('locality')) == normalize(request['city']) and (a.get('region') or '').upper() == request['uf']), None)
                if not address:
                    continue
                name = (row.get('names') or {}).get('primary') or ''
                tax = row.get('taxonomy') or row.get('categories') or {}
                category = tax.get('primary') or ''
                hierarchy = tax.get('hierarchy') or []
                score = match_score(request['keyword'], name, category, hierarchy)
                if not name or not score:
                    continue
                bounds = row.get('bbox') or {}
                lon, lat = bounds.get('xmin'), bounds.get('ymin')
                if lon is None or lat is None:
                    continue
                matches.append({
                    'id': row['id'], 'name': name, 'category': category,
                    'address': ', '.join(filter(None, [address.get('freeform'), address.get('locality'), address.get('region')])),
                    'phone': next(iter(row.get('phones') or []), ''),
                    'website': next(iter(row.get('websites') or []), ''),
                    'social': next(iter(row.get('socials') or []), ''),
                    'lat': lat, 'lon': lon, 'score': score,
                    'confidence': row.get('confidence') or 0,
                })
    matches.sort(key=lambda x: (-x['score'], -int(bool(x['phone'])), -x['confidence'], normalize(x['name'])))
    unique = []
    seen = set()
    for item in matches:
        key = (normalize(item['name']), re.sub(r'\D', '', item['phone']))
        if key in seen:
            continue
        seen.add(key)
        unique.append(item)
    return {'places': unique, 'total': len(unique)}


if __name__ == '__main__':
    try:
        print(json.dumps(search_overture(json.load(sys.stdin)), ensure_ascii=False))
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
