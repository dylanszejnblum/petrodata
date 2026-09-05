def max_groups(nums: list[int], target: int = 10) -> int:
    """Max number of disjoint 3-element groups whose sum is <= target."""
    # O(n log n) time (dominated by the sort), O(n) space for the sorted copy.
    sorted_amounts = sorted(nums)
    groups_formed = 0

    for start in range(0, len(sorted_amounts) - 2, 3):   # -2: never a partial chunk
        cheapest_three = sorted_amounts[start:start + 3]
        if sum(cheapest_three) > target:
            break                                        # chunks only get more expensive
        groups_formed += 1

    return groups_formed


def _test() -> None:
    assert max_groups([1, 2, 3, 4, 5, 6]) == 2           # [1,2,3]=6, [4,5,6]=15 -> wait
    assert max_groups([1, 1, 1, 8, 8, 8]) == 1
    assert max_groups([]) == 0
    assert max_groups([1, 2]) == 0                       # fewer than 3
    assert max_groups([1, 2, 3, 4]) == 1                 # partial chunk ignored
    assert max_groups([0, 0, 0]) == 1
    assert max_groups([-5, -5, 20]) == 1                 # negatives still work
    print("ok")
