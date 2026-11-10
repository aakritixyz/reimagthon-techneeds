import unittest
from assign import assign_mentors

class AllocationTests(unittest.TestCase):
    def setUp(self):
        self.tracks = [{'id': 'web', 'min_mentors': 2, 'max_mentors': 3, 'mentees': 30}]
        self.mentors = [{'id': 'a', 'max_tracks': 1, 'seats_per_track': 8, 'scores': {'web': 90}},
                        {'id': 'b', 'max_tracks': 1, 'seats_per_track': 10, 'scores': {}}]

    def test_shortage_and_no_application(self):
        plan = assign_mentors(self.mentors, self.tracks)
        self.assertEqual(plan['status'], 'OPTIMAL')
        self.assertEqual(plan['gaps'][0]['missingSeats'], 22)
        self.assertEqual(plan['unassigned_mentors'], ['b'])

    def test_conflicting_rules(self):
        self.assertEqual(assign_mentors(self.mentors, self.tracks, locked=[['a', 'web']], banned=[['a', 'web']])['status'], 'INFEASIBLE')

    def test_locks_respect_load(self):
        tracks = self.tracks + [{'id': 'app', 'min_mentors': 1, 'max_mentors': 2, 'mentees': 10}]
        self.mentors[0]['scores']['app'] = 80
        plan = assign_mentors(self.mentors, tracks, locked=[['a', 'web'], ['a', 'app']])
        self.assertEqual(plan['status'], 'INFEASIBLE')

    def test_zero_mentors(self):
        self.assertEqual(assign_mentors([], self.tracks)['gaps'][0]['missingMentors'], 2)

    def test_deterministic_result(self):
        self.assertEqual(assign_mentors(self.mentors, self.tracks), assign_mentors(self.mentors, self.tracks))

    def test_best_pairs_with_caps(self):
        tracks = [{'id': name, 'min_mentors': 1, 'max_mentors': 1, 'mentees': 10} for name in ['web', 'app']]
        mentors = [{'id': 'a', 'max_tracks': 1, 'seats_per_track': 10, 'scores': {'web': 95, 'app': 60}},
                   {'id': 'b', 'max_tracks': 1, 'seats_per_track': 10, 'scores': {'web': 50, 'app': 90}}]
        plan = assign_mentors(mentors, tracks)
        self.assertEqual(plan['assignments'], {'web': ['a'], 'app': ['b']})
        self.assertEqual(plan['gaps'], [])

if __name__ == '__main__':
    unittest.main()
