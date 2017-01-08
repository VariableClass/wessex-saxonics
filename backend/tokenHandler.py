import base64
import json
import jwt
import time
from binascii import a2b_base64
from Crypto.Util.asn1 import DerSequence
from Crypto.PublicKey import RSA
from google.appengine.api import urlfetch
from jwt.contrib.algorithms.py_ecdsa import ECAlgorithm
from jwt.contrib.algorithms.pycrypto import RSAAlgorithm
from six.moves import http_client


# Import algorithms as app engine jwt does not provide them
jwt.register_algorithm('RS256', RSAAlgorithm(RSAAlgorithm.SHA256))
jwt.register_algorithm('ES256', ECAlgorithm(ECAlgorithm.SHA256))


def get_user_from_token(encoded_token):

    # Retrieve certificate key from token header
    key_id = _get_key_id_from_token_header(encoded_token)

    # Retrieve appropriate certificate from Firebase authentication server
    cert = _get_certificate_from_auth_server(key_id)

    # Retrieve key from certificate
    public_key = _get_public_key_from_certificate(cert)

    # Decode token using obtained key
    user_id_token = jwt.decode(encoded_token, public_key, audience='wessex-saxonics')

    if user_id_token.get('exp') - time.time() <= 0:
        # Return 401 Unauthorized
        raise endpoints.UnauthorizedException(
            'Token expired')

    if time.time() - user_id_token.get('iat') < 0:
        # Return 401 Unauthorized
        raise endpoints.UnauthorizedException(
            'Token not valid')

    if user_id_token.get('aud') != "wessex-saxonics":
        # Return 401 Unauthorized
        raise endpoints.UnauthorizedException(
            'Credentials not recognised')

    if user_id_token.get('iss') != ("https://securetoken.google.com/" + user_id_token.get('aud')):
        # Return 401 Unauthorized
        raise endpoints.UnauthorizedException(
            'Credentials not recognised')

    return user_id_token.get('sub')


def _get_key_id_from_token_header(encoded_token):

    # Split token up into header, payload and signature
    token_parts = encoded_token.split('.')

    # Assert whether padding needs to be added to the header base64
    missing_padding = 4 - len(token_parts[0])%4
    if missing_padding:
        encoded_header = token_parts[0] + b'='*missing_padding

    # Decode header
    decoded_header_json = base64.b64decode(encoded_header)
    token_header = json.loads(decoded_header_json)

    # Get certificate key id from the header
    key_id = token_header['kid']

    return key_id


def _get_certificate_from_auth_server(key_id):

    # Extend response wait for slower clients
    urlfetch.set_default_fetch_deadline(30)

    # Fetch authentication certificates
    response = urlfetch.fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
    if response.status_code != 200:
        raise exceptions.TransportError(
            'Could not fetch certificates at {}'.format(certs_url))

    # Parse response
    certs =  json.loads(response.content.decode('utf-8'))

    # Retrieve appropriate certificate
    cert = certs.get(key_id)

    return cert


def _get_public_key_from_certificate(cert):

    # Return public key from certificate
    lines = cert.replace(" ",'').split()
    der = a2b_base64(''.join(lines[1:-1]))

    # Extract subjectPublicKeyInfo field from X.509 certificate (see RFC3280)
    cert = DerSequence()
    cert.decode(der)
    tbsCertificate = DerSequence()
    tbsCertificate.decode(cert[0])
    subjectPublicKeyInfo = tbsCertificate[6]

    # Initialize RSA key
    rsa_key = RSA.importKey(subjectPublicKeyInfo)

    return rsa_key
