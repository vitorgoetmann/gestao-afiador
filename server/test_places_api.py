import json
import gzip
import io
import os
import threading
import unittest
import urllib.error
import urllib.request
from http.server import HTTPServer
from unittest.mock import patch

from api.places import RequestError, find_city_and_bounds, get_json, handler


def fake_get_json(url, headers=None):
    if '/auth/v1/user' in url:
        if headers['Authorization'] != 'Bearer valid-token':
            raise urllib.error.HTTPError(url, 401, 'invalid', {}, None)
        return {'id': 'user-id'}
    return {'features': [{'properties': {'name': 'Palhoça', 'state': 'Santa Catarina', 'countrycode': 'BR', 'type': 'city', 'extent': [-48.8, -27.6, -48.5, -27.9]}}]}


class PlacesApiTests(unittest.TestCase):
    def test_city_and_state_must_match_the_photon_result(self):
        with patch('api.places.get_json', side_effect=fake_get_json) as fetch:
            city, uf, bbox = find_city_and_bounds('PALHOCA, SC')
            self.assertEqual((city, uf), ('Palhoça', 'SC'))
            self.assertEqual(bbox, [-48.8, -27.9, -48.5, -27.6])
            self.assertIn('photon.komoot.io', fetch.call_args.args[0])
            with self.assertRaises(RequestError):
                find_city_and_bounds('Palhoça, SP')

    def test_compressed_provider_response(self):
        class Response(io.BytesIO):
            headers = {'Content-Encoding': 'gzip'}

        payload = gzip.compress(json.dumps({'nome': 'Palhoça'}).encode('utf-8'))
        with patch('api.places.urllib.request.urlopen', return_value=Response(payload)):
            self.assertEqual(get_json('https://example.test')['nome'], 'Palhoça')

    def test_authentication_and_real_http_response_shape(self):
        place = {'id': '1', 'name': 'Studio Unhas', 'address': 'Rua A, Palhoça, SC', 'phone': '+5548999999999', 'website': '', 'social': '', 'category': 'nail_salon'}
        with patch.dict(os.environ, {'VITE_SUPABASE_URL': 'https://example.supabase.co', 'VITE_SUPABASE_ANON_KEY': 'public-key'}), \
             patch('api.places.get_json', side_effect=fake_get_json), \
             patch('api.places.search_overture', return_value={'places': [place], 'total': 1}):
            server = HTTPServer(('127.0.0.1', 0), handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                url = f'http://127.0.0.1:{server.server_port}/api/places'
                payload = json.dumps({'keyword': 'manicure', 'region': 'Palhoça, SC', 'limit': 10}).encode()
                with self.assertRaises(urllib.error.HTTPError) as unauthenticated:
                    urllib.request.urlopen(urllib.request.Request(url, payload, {'Content-Type': 'application/json'}))
                self.assertEqual(unauthenticated.exception.code, 401)
                request = urllib.request.Request(url, payload, {'Content-Type': 'application/json', 'Authorization': 'Bearer valid-token'})
                with urllib.request.urlopen(request) as response:
                    result = json.load(response)
                self.assertEqual(result['total'], 1)
                self.assertEqual(result['places'][0]['phone'], '+5548999999999')
                self.assertIn('google.com/maps/search/', result['places'][0]['mapsUrl'])
            finally:
                server.shutdown()
                thread.join()
                server.server_close()


if __name__ == '__main__':
    unittest.main()
