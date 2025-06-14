# import requests
# import json
# from django.conf import settings
# def send_bulk_sms(mobile_no, message):
#     url = "https://api.msg91.com/api/v2/sendsms"
#     headers = {
#         "authkey": settings.MSG91_AUTH_KEY,  # Paste your AuthKey here
#         "Content-Type": "application/json"
#     }

#     payload = {
#         "sender": settings.MSG91_SENDER_ID,  # Your approved sender ID from MSG91
#         "route": settings.MSG91_ROUTE, # 4 = transactional, 1 = promotional
#         "country": settings.MSG91_COUNTRY,          # Use '91' for India
#         "sms": [
#             {
#                 "message": message,
#                 "to": [mobile_no]
#             }
#         ]
#     }
#     print("Sending SMS to:", mobile_no)
#     response = requests.post(url, headers=headers, data=json.dumps(payload))
#     print("MSG91 response:", response.status_code, response.text)
#     return response.json()

# utils/msg91.py
import requests
import json
from django.conf import settings

def send_msg91_sms(test_number,OTP):
    url = "https://api.msg91.com/api/v5/flow/"
    
    payload = {
        "flow_id": "",
        # "68495614d6fc05794d588d42",  # from MSG91
        "sender":"DRNKIT",  # e.g., "KAPILT"
        "mobiles": test_number,     # format: "91xxxxxxxxxx"
        "OTP": OTP
        # "VAR1": PasswordReset  # replace with your template variable name
    }

    headers = {
        'accept': "application/json",
        'authkey': settings.MSG91_AUTH_KEY,
        'content-type': "application/json"
    }

    response = requests.post(url, json=payload, headers=headers)
    return response.json()
# utils/msg91.py

# import requests

# def send_msg91_otp(phone_number, otp):
#     url = "https://api.msg91.com/api/v5/flow/"
#     payload = {
#         "flow_id": "YOUR_FLOW_ID_HERE",     # Replace with actual flow_id
#         "sender": "DRNKIT",
#         "mobiles": phone_number,            # Format: 91XXXXXXXXXX
#         "OTP": otp                          # This replaces {{OTP}} in flow
#     }

#     headers = {
#         'authkey': 'YOUR_MSG91_AUTH_KEY',   # from MSG91 dashboard
#         'Content-Type': 'application/json',
#         'accept': 'application/json',
#     }

#     response = requests.post(url, json=payload, headers=headers)
#     return response.json()
