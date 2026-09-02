"""retry.py FIXED"""
import time, functools

def retry(max_retries=3, delay=0.0, exceptions=(Exception,)):
    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            last_exc = None
            for i in range(max_retries + 1):
                try:
                    return fn(*args, **kwargs)
                except exceptions as e:
                    last_exc = e
                    if i < max_retries and delay:
                        time.sleep(delay)
                    if i == max_retries:
                        raise
                except Exception as e:
                    # non-matching exception → do not retry, re-raise immediately
                    raise
            raise last_exc if last_exc else RuntimeError("no attempt")
        return wrapper
    return decorator
