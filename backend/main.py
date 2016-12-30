# [START imports]

import endpoints
import models
from protorpc import message_types, messages, remote

# [END imports]


class Image(messages.Message):
    name = messages.StringField(1, required=True)
    height = messages.IntegerField(2)
    width = messages.IntegerField(3)


class ImageCollection(messages.Message):
    items = messages.MessageField(Image, 1, repeated=True)


WEB_CLIENT_ID = '552722976411-cdl5bddfvaf0fh9djhvetr47j59prgp8.apps.googleusercontent.com'
ALLOWED_CLIENT_IDS = [
    WEB_CLIENT_ID,
    endpoints.API_EXPLORER_CLIENT_ID]

# firebase_issuer = endpoints.Issuer(
#   issuer='https://securetoken.google.com/wessex-saxonics',
#   jwks_uri='https://www.googleapis.com/service_accounts/v1/metadata/x509/securetoken@system.gserviceaccount.com')

@endpoints.api(name='wessexsaxonics',
               version='v1',
               allowed_client_ids=ALLOWED_CLIENT_IDS,
               scopes=[endpoints.EMAIL_SCOPE])
#               issuers=[firebase_issuer])
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

        # Retrieve current user
        user = endpoints.get_current_user()

        # If user is logged in
        if user:

            # Store e-mail and use to retrieve user associated images
            user_id = user.email()
            images = models.Image.get_all_by_user(user_id).fetch(self.ITEMS_PER_PAGE)

            # Append all images to a return ImageCollection
            ret_images = ImageCollection()
            for image in images:

                ret_images.items.append(Image(name=image.name,
                                        height=image.height,
                                        width=image.width))

            return ret_images

        # If user is not logged in
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

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

        # Retrieve current user
        user = endpoints.get_current_user()

        # If user is logged in
        if user:

            # Store e-mail and use to retrieve image
            user_id = user.email()

            try:
                image = models.Image.get_image_by_user(request.image_id, user_id)

                if image:
                    return Image(name=image.name,
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
        name='image.upload')
    def upload_image(self, request):

        # Retrieve current user
        user = endpoints.get_current_user()

        # If user is logged in
        if user:

            # Store e-mail and use to retrieve user associated images
            user_id = user.email()

            image = models.Image(name=request.name,
                                user_id=user_id,
                                height=request.height,
                                width=request.width,
                                bucket_name="wessex-saxonics")
            image.put()
            return message_types.VoidMessage()

        # If user is not logged in
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

    EDIT_IMAGE_RESOURCE = endpoints.ResourceContainer(
        message_types.VoidMessage,
        image_id=messages.StringField(1, required=True),
        scale_factor=messages.IntegerField(2),
        height=messages.IntegerField(3),
        width=messages.IntegerField(4)
    )

    @endpoints.method(
        EDIT_IMAGE_RESOURCE,
        Image,
        path='images/{image_id}',
        http_method='POST',
        name='image.edit')
    def edit_image(self, request):

        # Retrieve current user
        user = endpoints.get_current_user()

        # If user is logged in
        if user:

            # Store e-mail and use to retrieve user associated images
            user_id = user.email()

            try:
                image = models.Image.get_image_by_user(request.image_id, user_id)

                # No case statements Python? Seriously?
                if (request.scale_factor and request.height) or (request.scale_factor and request.width):
                     raise endpoints.BadRequestException(
                        'Please provide image height and width OR scale factor, not both.')

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

                return Image(name=image.name,
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

        # Retrieve current user
        user = endpoints.get_current_user()

        # If user is logged in
        if user:

            # Store e-mail and use to retrieve user associated images
            user_id = user.email()

            try:
                # Delete metadata from datastore
                models.Image.delete_user_image(request.image_id, user_id)

                # Delete image from cloud storage
                # crud.delete_file('/' + user_image.bucket_name + '/' + user_image.name)
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
