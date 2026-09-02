"""bank.py FIXED"""
from typing import Dict

def transfer(accounts: Dict[str, int], frm: str, to: str, amount: int):
    if amount <= 0:
        raise ValueError("amount must be >0")
    if frm == to:
        raise ValueError("cannot transfer to self")
    if frm not in accounts:
        raise KeyError(frm)
    if to not in accounts:
        raise KeyError(to)
    if accounts[frm] < amount:
        raise ValueError("insufficient funds")
    # atomic: all validations passed, now mutate
    accounts[frm] -= amount
    accounts[to] += amount
