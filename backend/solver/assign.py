"""Private JSON stdin/stdout worker. Express owns authentication and persistence."""
import json
import sys
from ortools.sat.python import cp_model


def assign_mentors(mentors, tracks, *, locked=(), banned=(), previous=(), time_limit=10):
    model = cp_model.CpModel()
    by_id = {m['id']: m for m in mentors}
    x = {(m['id'], t['id']): model.new_bool_var(f"x_{m['id']}_{t['id']}")
         for m in mentors for t in tracks if t['id'] in m['scores']}
    locked, banned, previous = (set(map(tuple, pairs)) for pairs in (locked, banned, previous))
    if locked & banned:
        return {'status': 'INFEASIBLE', 'error': 'A pair is both locked and excluded.', 'assignments': {}, 'gaps': []}
    if any(pair not in x for pair in locked | banned):
        raise ValueError('Locks and exclusions must reference an approved mentor application.')
    for m in mentors:
        model.add(sum(v for (mid, _), v in x.items() if mid == m['id']) <= m['max_tracks'])
    for pair in locked:
        model.add(x[pair] == 1)
    for pair in banned:
        model.add(x[pair] == 0)
    penalties, spares = [], []
    total_seats = sum(m['seats_per_track'] for m in mentors)
    demand_bound = max([t['mentees'] for t in tracks] + [0])
    for t in tracks:
        pairs = [(mid, v) for (mid, tid), v in x.items() if tid == t['id']]
        count = sum(v for _, v in pairs)
        seats = sum(by_id[mid]['seats_per_track'] * v for mid, v in pairs)
        model.add(count <= t['max_mentors'])
        missing_m = model.new_int_var(0, t['min_mentors'], 'missing_mentors_' + t['id'])
        missing_s = model.new_int_var(0, t['mentees'], 'missing_seats_' + t['id'])
        model.add(missing_m >= t['min_mentors'] - count)
        model.add(missing_s >= t['mentees'] - seats)
        penalties.append(1000 * missing_m + 20 * missing_s)
        spare = model.new_int_var(-t['mentees'], total_seats, 'spare_' + t['id'])
        model.add(spare == seats - t['mentees'])
        spares.append(spare)
    quality = sum(by_id[mid]['scores'][tid] * v for (mid, tid), v in x.items())
    stability = sum(50 * x[p] for p in previous if p in x)
    fairness = model.new_int_var(-demand_bound, total_seats, 'minimum_spare')
    if spares:
        model.add_min_equality(fairness, spares)
    else:
        model.add(fairness == 0)
    model.maximize(quality + stability + 5 * fairness - sum(penalties))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = min(max(time_limit, 1), 30)
    solver.parameters.num_search_workers = 1
    solver.parameters.random_seed = 42
    status = solver.solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {'status': solver.status_name(status), 'assignments': {}, 'gaps': [],
                'error': 'The locked pairs exceed a mentor load or track limit. Adjust locks and try again.'}
    assignments = {t['id']: [] for t in tracks}
    matches = []
    for (mid, tid), var in x.items():
        if solver.value(var):
            assignments[tid].append(mid)
            scores = by_id[mid]['scores']
            matches.append({'mentorId': mid, 'programId': tid, 'score': scores[tid],
                            'firstChoice': scores[tid] == max(scores.values()),
                            'retained': (mid, tid) in previous, 'locked': (mid, tid) in locked})
    coverage, gaps = [], []
    for t in tracks:
        mids = assignments[t['id']]
        seats = sum(by_id[mid]['seats_per_track'] for mid in mids)
        item = {'track': t['id'], 'mentors': len(mids), 'needed_mentors': t['min_mentors'],
                'seats': seats, 'mentees': t['mentees'],
                'missingMentors': max(0, t['min_mentors'] - len(mids)),
                'missingSeats': max(0, t['mentees'] - seats)}
        coverage.append(item)
        if item['missingMentors'] or item['missingSeats']:
            gaps.append(item)
    assigned = {mid for mids in assignments.values() for mid in mids}
    return {'status': solver.status_name(status), 'objective': solver.objective_value,
            'assignments': assignments, 'matches': matches, 'coverage': coverage, 'gaps': gaps,
            'unassigned_mentors': [m['id'] for m in mentors if m['id'] not in assigned],
            'firstChoiceCount': sum(m['firstChoice'] for m in matches)}


if __name__ == '__main__':
    try:
        print(json.dumps(assign_mentors(**json.load(sys.stdin))))
    except Exception as error:
        print(json.dumps({'error': str(error)}))
        sys.exit(1)
