# [START imports]

import base64
import crud
import endpoints
import google.auth.transport.requests as requests
import imageManipulation
import imghdr
import json
import models
import re
import tokenHandler
from google.auth import exceptions
from protorpc import message_types, messages, remote

# [END imports]


class Image(messages.Message):
    name = messages.StringField(1, required=True)
    image = messages.StringField(2, required=True)
    height = messages.IntegerField(3)
    width = messages.IntegerField(4)
    metadata = messages.StringField(5)
    auto = messages.BooleanField(6)
    degreesToRotate = messages.IntegerField(7)
    flipv = messages.BooleanField(8)
    fliph = messages.BooleanField(9)


class ImageCollection(messages.Message):
    items = messages.MessageField(Image, 1, repeated=True)


class EditMessage(messages.Message):
    scale_factor = messages.IntegerField(1)
    height = messages.IntegerField(2)
    width = messages.IntegerField(3)
    auto = messages.BooleanField(4)
    degreesToRotate = messages.IntegerField(5)
    flipv = messages.BooleanField(6)
    fliph = messages.BooleanField(7)


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
        id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

        # Get user ID from token
        user_id = tokenHandler.get_user_from_token(id_token)

        # If user retrieved
        if user_id:

            # Retrieve user images' metadata
            images = models.Image.get_all_by_user(user_id).fetch(self.ITEMS_PER_PAGE)

            # Append all images to a return ImageCollection
            ret_images = ImageCollection()
            for image_metadata in images:

                # Retrieve image
                image_file = crud.retrieve_image_file(user_id + "/" + image_metadata.name)

                # Perform appropriate transformations on image
                image_file = imageManipulation.transform(image_metadata, image_file)

                # Encode image
                base64_prefix = "data:" + image_metadata.mime_type + ";base64,"
                encoded_image = base64_prefix + base64.b64encode(image_file)

                ret_images.items.append(Image(name=image_metadata.name,
                                                image=encoded_image,
                                                height=image_metadata.height,
                                                width=image_metadata.width))

            return ret_images

        # If user is not verified
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'No credentials found')


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
        id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

        # Get user ID from token
        user_id = tokenHandler.get_user_from_token(id_token)

        if user_id:

            try:
                # Retrieve image metadata
                image_metadata = models.Image.get_image_by_user(request.image_id, user_id)

                if image_metadata:

                    # Retrieve image
                    image_file = crud.retrieve_image_file(user_id + "/" + request.image_id)

                    # Perform appropriate transformations on image
                    image_file = imageManipulation.transform(image_metadata, image_file)

                    # Encode image
                    base64_prefix = "data:" + image_metadata.mime_type + ";base64,"
                    encoded_image = base64_prefix + base64.b64encode(image_file)

                    return Image(name=image_metadata.name,
                                 image=encoded_image,
                                 height=image_metadata.height,
                                 width=image_metadata.width,
                                 metadata = json.dumps(image_metadata.metadata),
                                 auto=image_metadata.auto,
                                 degreesToRotate=image_metadata.rotatedDegrees,
                                 flipv=image_metadata.flip_vertical,
                                 fliph=image_metadata.flip_horizontal)
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
        id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

        # Get user ID from token
        user_id = tokenHandler.get_user_from_token(id_token)

        if user_id:

            if len(request.name) == 0:
                raise endpoints.BadRequestException(
                    'Please enter a name for the file')

            if models.Image.get_image_by_user(request.name, user_id) is None:

                # Knock mime type off start of image base64 and store it
                request_data = request.image.split(',')
                mime_type = re.split('[:;]+', request_data[0])[1]

                # Decode base64 image
                image_file = request_data[1].decode('base64')

                image = models.Image(name=request.name,
                                    user_id=user_id,
                                    mime_type=mime_type,
                                    height=request.height,
                                    width=request.width,
                                    metadata=imageManipulation.get_metadata(image_file))
                image.put()

                # Upload image to cloud storage
                crud.upload_image_file(image_file, user_id + "/" + request.name, mime_type)

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
        id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

        # Get user ID from token
        user_id = tokenHandler.get_user_from_token(id_token)

        if user_id:

            try:
                image_metadata = models.Image.get_image_by_user(request.image_id, user_id)

                # No case statements Python? Seriously?
                if (request.scale_factor and request.height) or (request.scale_factor and request.width):
                     raise endpoints.BadRequestException(
                        'Please provide image height and width OR scale factor, not both.')

                if (request.scale_factor is None
                and request.height is None
                and request.width is None
                and request.auto is None
                and request.degreesToRotate is None
                and request.flipv is None
                and request.fliph is None):
                    raise endpoints.BadRequestException(
                       'Please provide a property to amend.')

                if request.scale_factor:

                    sf = float(request.scale_factor)

                    # Write new values to image
                    sf /= 100

                    # Set new image size
                    image_metadata.width = int(round(image_metadata.width * sf))
                    image_metadata.height = int(round(image_metadata.height * sf))

                if request.height:
                    image_metadata.height = request.height

                if request.width:
                    image_metadata.width = request.width

                if request.auto != None:
                    image_metadata.auto = request.auto

                if request.degreesToRotate != None:
                    image_metadata.rotatedDegrees = request.degreesToRotate

                if request.flipv != None:
                    image_metadata.flip_vertical = request.flipv

                if request.fliph != None:
                    image_metadata.flip_horizontal = request.fliph

                image_metadata.put()

                # Retrieve image
                image_file = crud.retrieve_image_file(user_id + "/" + request.image_id)

                # Perform appropriate transformations on image
                image_file = imageManipulation.transform(image_metadata, image_file)

                # Encode image
                base64_prefix = "data:" + image_metadata.mime_type + ";base64,"
                encoded_image = base64_prefix + base64.b64encode(image_file)

                return Image(name=image_metadata.name,
                             image=encoded_image,
                             height=image_metadata.height,
                             width=image_metadata.width,
                             metadata=image_metadata.metadata,
                             auto=image_metadata.auto,
                             degreesToRotate=image_metadata.rotatedDegrees,
                             flipv=image_metadata.flip_vertical,
                             fliph=image_metadata.flip_horizontal)

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
        id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

        # Get user ID from token
        user_id = tokenHandler.get_user_from_token(id_token)

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
