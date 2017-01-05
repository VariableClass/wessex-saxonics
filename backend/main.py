# [START imports]

import base64
import crud
import endpoints
import google.auth.transport.requests as requests
import imghdr
import json
import jwt
import models
import re
import time
from google.auth import exceptions
from jwt.contrib.algorithms.py_ecdsa import ECAlgorithm
from jwt.contrib.algorithms.pycrypto import RSAAlgorithm
from protorpc import message_types, messages, remote
from six.moves import http_client

# [END imports]

jwt.register_algorithm('RS256', RSAAlgorithm(RSAAlgorithm.SHA256))
jwt.register_algorithm('ES256', ECAlgorithm(ECAlgorithm.SHA256))


class Image(messages.Message):
    name = messages.StringField(1, required=True)
    image = messages.StringField(2, required=True)
    height = messages.IntegerField(3)
    width = messages.IntegerField(4)


class ImageCollection(messages.Message):
    items = messages.MessageField(Image, 1, repeated=True)


class EditMessage(messages.Message):
    scale_factor = messages.IntegerField(1)
    height = messages.IntegerField(2)
    width = messages.IntegerField(3)


def get_user_from_token(encoded_token, certs=None):

    if certs is None:
        user_id_token = jwt.decode(encoded_token, verify=False);
    else:
        user_id_token = jwt.decode(encoded_token, certs=certs, audience='wessex-saxonics');

    if user_id_token.get('exp') - time.time() <= 0:
        # Return 401 Unauthorized
        raise endpoints.UnauthorizedException(
            'Token expired');

    if time.time() - user_id_token.get('iat') < 0:
        # Return 401 Unauthorized
        raise endpoints.UnauthorizedException(
            'Token not valid');

    if user_id_token.get('aud') != "wessex-saxonics":
        # Return 401 Unauthorized
        raise endpoints.UnauthorizedException(
            'Credentials not recognised');

    if user_id_token.get('iss') != ("https://securetoken.google.com/" + user_id_token.get('aud')):
        # Return 401 Unauthorized
        raise endpoints.UnauthorizedException(
            'Credentials not recognised');

    return user_id_token.get('sub');


def get_user_from_signed_token(encoded_token):

    HTTP_REQUEST = requests.Request();

    response = HTTP_REQUEST('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com')
    if response.status != http_client.OK:
        raise exceptions.TransportError(
            'Could not fetch certificates at {}'.format(certs_url))

    certs =  json.loads(response.data.decode('utf-8'))

    return get_user_from_token(encoded_token, certs)


WEB_CLIENT_ID = '552722976411-cdl5bddfvaf0fh9djhvetr47j59prgp8.apps.googleusercontent.com'
ALLOWED_CLIENT_IDS = [
    WEB_CLIENT_ID,
    endpoints.API_EXPLORER_CLIENT_ID]

@endpoints.api(name='wessexsaxonics',
               version='v1',
               allowed_client_ids=ALLOWED_CLIENT_IDS,
               scopes=[endpoints.EMAIL_SCOPE])
class WessexSaxonicsApi(remote.Service):

    ITEMS_PER_PAGE = 20

    GET_ALL_IMAGES_RESOURCE = endpoints.ResourceContainer(
        message_types.VoidMessage,
    )


    @endpoints.method(
        GET_ALL_IMAGES_RESOURCE,
        ImageCollection,
        path='images',
        http_method='GET',
        name='images.list')
    def list_images(self, request):

        # Retrieve user token
        id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop();

        # Get user ID from token
        user_id = get_user_from_token(id_token);

        if user_id:

            # Retrieve user images' metadata
            images = models.Image.get_all_by_user(user_id).fetch(self.ITEMS_PER_PAGE);

            # Append all images to a return ImageCollection
            ret_images = ImageCollection();
            for image in images:

                # Retrieve image
                image_file = crud.retrieve_image_file(image.name);

                # Encode image
                base64_prefix = "data:" + image.mime_type + ";base64,";
                encoded_image = base64_prefix + base64.b64encode(image_file);

                ret_images.items.append(Image(name=image.name,
                                                image=encoded_image,
                                                height=image.height,
                                                width=image.width));

            return ret_images;

        # If user is not verified
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'No credentials found');


    GET_IMAGE_RESOURCE = endpoints.ResourceContainer(
        message_types.VoidMessage,
        image_id=messages.StringField(1, required=True)
    )

    @endpoints.method(
        GET_IMAGE_RESOURCE,
        Image,
        path='images/{image_id}',
        http_method='GET',
        name='image.get')
    def get_image(self, request):

        # Retrieve user token
        id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop();

        # Get user ID from token
        user_id = get_user_from_token(id_token);

        if user_id:

            try:
                # Retrieve image metadata
                image = models.Image.get_image_by_user(request.image_id, user_id)

                if image:

                    # Retrieve image
                    image_file = crud.retrieve_image_file(request.image_id);

                    # Encode image
                    base64_prefix = "data:" + image.mime_type + ";base64,";
                    encoded_image = base64_prefix + base64.b64encode(image_file);

                    return Image(name=image.name,
                                 image=encoded_image,
                                 height=image.height,
                                 width=image.width)
                else:
                    raise endpoints.NotFoundException(
                    'Image ID {} not found'.format(request.image_id))

            except (IndexError, TypeError):
                raise endpoints.NotFoundException(
                    'Image ID {} not found'.format(request.image_id))

        # If user is not logged in
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')


    @endpoints.method(
        Image,
        message_types.VoidMessage,
        path='images',
        http_method='POST',
        name='images.upload')
    def upload_image(self, request):

        # Retrieve user token
        id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop();

        # Get user ID from token
        user_id = get_user_from_token(id_token);

        if user_id:

            if models.Image.get_image_by_user(request.name, user_id) is None:

                # Knock mime type off start of image base64 and store it
                request_data = request.image.split(',');
                mime_type = re.split('[:;]+', request_data[0])[1];

                image = models.Image(name=request.name,
                                    user_id=user_id,
                                    mime_type=mime_type,
                                    height=request.height,
                                    width=request.width)
                image.put()

                # Decode base64 image
                image = request_data[1].decode('base64')

                # Upload image to cloud storage
                crud.upload_image_file(image, request.name, mime_type)
                return message_types.VoidMessage()

            else:
                raise endpoints.BadRequestException(
                    request.name + " already in use. Please use another name.")

        # If user is not logged in
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

    EDIT_IMAGE_RESOURCE = endpoints.ResourceContainer(
        EditMessage,
        image_id=messages.StringField(1, required=True)
    )

    @endpoints.method(
        EDIT_IMAGE_RESOURCE,
        Image,
        path='images/{image_id}',
        http_method='POST',
        name='image.edit')
    def edit_image(self, request):

        # Retrieve user token
        id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop();

        # Get user ID from token
        user_id = get_user_from_token(id_token);

        if user_id:

            try:
                image = models.Image.get_image_by_user(request.image_id, user_id)

                # No case statements Python? Seriously?
                if (request.scale_factor and request.height) or (request.scale_factor and request.width):
                     raise endpoints.BadRequestException(
                        'Please provide image height and width OR scale factor, not both.')

                if request.scale_factor is None and request.height is None and request.width is None:
                    raise endpoints.BadRequestException(
                       'Please provide image height, width or scale factor.')

                if request.scale_factor:

                    sf = float(request.scale_factor)

                    # Write new values to image
                    sf /= 100

                    # Set new image size
                    image.width = int(round(image.width * sf))
                    image.height = int(round(image.height * sf))

                if request.height:
                    image.height = request.height

                if request.width:
                    image.width = request.width

                image.put()

                # Retrieve image
                image_file = crud.retrieve_image_file(request.image_id);

                # Encode image
                base64_prefix = "data:" + image.mime_type + ";base64,";
                encoded_image = base64_prefix + base64.b64encode(image_file);

                return Image(name=image.name,
                             image=encoded_image,
                             height=image.height,
                             width=image.width)

            except (IndexError, TypeError):
                raise endpoints.NotFoundException(
                    'Image ID {} not found'.format(request.image_id))

        # If user is not logged in
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

    @endpoints.method(
        GET_IMAGE_RESOURCE,
        message_types.VoidMessage,
        path='images/{image_id}',
        http_method='DELETE',
        name='image.delete')
    def delete_image(self, request):

        # Retrieve user token
        id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop();

        # Get user ID from token
        user_id = get_user_from_token(id_token);

        if user_id:

            try:
                # Delete metadata from datastore
                models.Image.delete_user_image(request.image_id, user_id)

                # Delete image from cloud storage
                crud.delete_file(request.image_id)

                return message_types.VoidMessage()

            except (IndexError, TypeError):
                raise endpoints.NotFoundException(
                    'Image ID {} not found'.format(request.image_id))

        # If user is not logged in
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

api = endpoints.api_server([WessexSaxonicsApi])
