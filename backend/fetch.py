import urllib.request as r
import urllib.error as e

req = r.Request('http://localhost:8000/api/v1/stores')
req.add_header('Authorization', 'Bearer dummy_token')
try:
    res = r.urlopen(req)
    print("SUCCESS", res.read().decode())
except e.HTTPError as err:
    print("ERROR", err.code)
    print(err.read().decode())
