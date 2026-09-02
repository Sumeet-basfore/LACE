"""calc.py FIXED"""
def merge_intervals(intervals):
    if not intervals:
        return []
    # copy and sort, do not mutate input
    sorted_intervals = sorted([x[:] for x in intervals], key=lambda x: x[0])
    merged = [sorted_intervals[0][:]]
    for cur in sorted_intervals[1:]:
        last = merged[-1]
        if cur[0] > last[1]:
            merged.append(cur[:])
        else:
            last[1] = max(last[1], cur[1])
    return merged
