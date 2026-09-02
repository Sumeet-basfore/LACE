"""retry.py BASELINE single-shot flawed — simulates common single-agent miss: catches all exceptions not filtering"""
import time, functools

def retry(max_retries=3, delay=0.0, exceptions=(Exception,)):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            last_exc = None
            for i in range(max_retries + 1):
                try:
                    return fn(*args, **kwargs)
                except Exception as e:  # BUG: not filtering to `exceptions`
                    last_exc = e
                    if i < max_retries and delay:
                        time.sleep(delay)
                    if i == max_retries:
                        raise
            raise last_exc
        return wrapper
    return decorator
