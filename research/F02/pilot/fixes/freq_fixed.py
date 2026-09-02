"""freq.py FIXED"""
from collections import Counter
from typing import List

def top_k_frequent(nums: List[int], k: int) -> List[int]:
    if not nums:
        raise ValueError("nums empty")
    uniq = len(set(nums))
    if k < 1 or k > uniq:
        raise ValueError("k out of range")
    c = Counter(nums)
    # sorted by (-freq, value) deterministic
    sorted_items = sorted(c.items(), key=lambda x: (-x[1], x[0]))
    return [x for x, _ in sorted_items[:k]]
