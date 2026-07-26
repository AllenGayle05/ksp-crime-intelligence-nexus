import os
import joblib
import json
import urllib.request

base_dir = os.path.join(os.getcwd(), 'backend')
# Determine encoder path using same priority as predict_api
enc_v3 = os.path.join(base_dir, 'models', 'label_encoders_v3.pkl')
enc_v2 = os.path.join(base_dir, 'models', 'label_encoders_v2.pkl')
enc_base = os.path.join(base_dir, 'models', 'label_encoders.pkl')

enc_path = None
for p in [enc_v3, enc_v2, enc_base]:
    if os.path.exists(p):
        enc_path = p
        break

print('Using encoder file:', enc_path)

encoders = None
if enc_path:
    try:
        encoders = joblib.load(enc_path)
    except Exception as e:
        print('Failed to load encoders:', e)

# Counts from encoder file
district_count = 0
crimehead_count = 0
crimegroup_count = 0
if encoders:
    dn = encoders.get('District_Name')
    ch = encoders.get('CrimeHead_Name')
    cg = encoders.get('CrimeGroup_Name')
    district_count = len(getattr(dn, 'classes_', []))
    crimehead_count = len(getattr(ch, 'classes_', []))
    crimegroup_count = len(getattr(cg, 'classes_', []))

# Call /encoders endpoint
encoders_url = 'http://localhost:5000/encoders'
enc_resp = None
try:
    with urllib.request.urlopen(encoders_url, timeout=5) as r:
        enc_resp = json.load(r)
except Exception as e:
    enc_resp = {'error': str(e)}

# Call /predict endpoint with a sample
predict_url = 'http://localhost:5000/predict'
predict_test = {
    'FIR_YEAR': 2022,
    'FIR_MONTH': 5,
    'District_Name': 'Belagavi',
    'CrimeHead_Name': 'Rape'
}
pred_resp = None
try:
    req = urllib.request.Request(predict_url, data=json.dumps(predict_test).encode('utf-8'), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=5) as r:
        pred_resp = json.load(r)
except Exception as e:
    pred_resp = {'error': str(e)}

# Simple log scan: check recent Flask stdout captured? Not available here; we'll infer from responses.

print('\n--- BACKEND HEALTH REPORT ---')
print('Encoder file used:', enc_path)
print('1) Number of districts loaded (encoder file):', district_count)
print('2) Number of crime heads loaded (encoder file):', crimehead_count)
print('3) Number of crime groups available for prediction (encoder file):', crimegroup_count)

print('\n/check /encoders response status:')
if isinstance(enc_resp, dict) and 'error' in enc_resp:
    print('  /encoders request failed:', enc_resp['error'])
else:
    ed = enc_resp.get('District_Name', [])
    chs = enc_resp.get('CrimeHead_Name', [])
    print('  /encoders returned districts:', len(ed))
    print('  /encoders returned crime heads:', len(chs))

print('\n/check /predict response:')
if isinstance(pred_resp, dict) and 'error' in pred_resp:
    print('  /predict request failed:', pred_resp['error'])
else:
    print('  /predict status: 200 OK')
    print('  Response keys:', list(pred_resp.keys()))
    print('  Predicted label:', pred_resp.get('predicted_crime_group'))
    print('  Confidence pct:', pred_resp.get('confidence_pct'))

# Final verification summary
healthy = True
if isinstance(enc_resp, dict) and 'error' in enc_resp:
    healthy = False
if isinstance(pred_resp, dict) and 'error' in pred_resp:
    healthy = False

print('\nOverall health: {}'.format('OK' if healthy else 'ISSUES'))
print('--- END REPORT ---')
