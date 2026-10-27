import unittest
from server.overture_search import match_score


class LeadRelevanceTests(unittest.TestCase):
    def test_nail_search_prefers_matching_category(self):
        self.assertGreater(match_score('nail designer', 'Studio Ana', 'nail_salon', []), 0)
        self.assertGreater(match_score('manicure', 'Unhas da Maria', 'beauty_salon', []), 0)
        self.assertEqual(match_score('nail designer', 'Fadesc Uniasselvi', 'college', []), 0)
        self.assertEqual(match_score('nail designer', 'Biblioteca de Nail Art', 'college', []), 0)

    def test_barber_and_generic_searches(self):
        self.assertGreater(match_score('barbeiro', 'Studio Pedro', 'barber', []), 0)
        self.assertEqual(match_score('barbeiro', 'Padaria Central', 'bakery', []), 0)
        self.assertGreater(match_score('clínica dental', 'Clínica Dental Joana', 'dentist', []), 0)


if __name__ == '__main__':
    unittest.main()
