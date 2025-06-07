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