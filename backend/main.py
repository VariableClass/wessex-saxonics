# [START imports]

import base64
import calendar
import crud
import datetime
import endpoints
import imageManipulation
import json
import models
import re
import tokenHandler
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
    authorised_users = messages.StringField(10, repeated=True)


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
    authorised_users = messages.StringField(8, repeated=True)


class ShareURL(messages.Message):
    url = messages.StringField(1, required=True)
    expiry = message_types.DateTimeField(2, required=True)


accepted_mime_types = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/tiff", "image/ico"]


WEB_CLIENT_ID = '552722976411-cdl5bddfvaf0fh9djhvetr47j59prgp8.apps.googleusercontent.com'
ALLOWED_CLIENT_IDS = [
    WEB_CLIENT_ID,
    endpoints.API_EXPLORER_CLIENT_ID]

@endpoints.api(name='wessexsaxonics',
               version='v1',
               allowed_client_ids=ALLOWED_CLIENT_IDS,
               scopes=[endpoints.EMAIL_SCOPE])
class WessexSaxonicsApi(remote.Service):

    GET_ALL_IMAGES_RESOURCE = endpoints.ResourceContainer(
        message_types.VoidMessage,
    )


    GET_IMAGE_RESOURCE = endpoints.ResourceContainer(
        message_types.VoidMessage,
        image_id=messages.StringField(1, required=True)
    )


    EDIT_IMAGE_RESOURCE = endpoints.ResourceContainer(
        EditMessage,
        image_id=messages.StringField(1, required=True)
    )

    SHARE_IMAGE_RESOURCE = endpoints.ResourceContainer(
        message_types.VoidMessage,
        share_user_id=messages.StringField(1, required=True),
        image_id=messages.StringField(2, required=True)
    )

    @endpoints.method(
        GET_ALL_IMAGES_RESOURCE,
        ImageCollection,
        path='images',
        http_method='GET',
        name='images.list')
    def list_images(self, request):

        try:
            # Retrieve user token
            id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

            # Get user ID from token
            user_id = tokenHandler.get_user_from_token(id_token)

        except(IndexError):
            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')


        # If user retrieved
        if user_id:

            # Create new user if user does not already exist
            models.User.if_new_create(user_id)

            # Retrieve user images' metadata
            images = models.Image.get_all_by_user(user_id).fetch()

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
                'Please provide user credentials')


    @endpoints.method(
        GET_IMAGE_RESOURCE,
        Image,
        path='images/{image_id}',
        http_method='GET',
        name='image.get')
    def get_image(self, request):

        try:
            # Retrieve user token
            id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

            # Get user ID from token
            user_id = tokenHandler.get_user_from_token(id_token)

        except(IndexError):
            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

        if user_id:

            # Create new user if user does not already exist
            models.User.if_new_create(user_id)

            try:
                # Retrieve image metadata
                image_metadata = models.Image.get_image_by_user(request.image_id, user_id)

            except (IndexError, TypeError):
                raise endpoints.NotFoundException(
                    'Image ID {} not found'.format(request.image_id))

            # Retrieve image
            image_file = crud.retrieve_image_file(user_id + "/" + request.image_id)

            # Retrieve metadata
            metadata = imageManipulation.get_metadata(image_file)

            # Perform appropriate transformations on image
            image_file = imageManipulation.transform(image_metadata, image_file)

            # Encode image to return
            base64_prefix = "data:" + image_metadata.mime_type + ";base64,"
            encoded_image = base64_prefix + base64.b64encode(image_file)

            return Image(name=image_metadata.name,
                         image=encoded_image,
                         height=image_metadata.height,
                         width=image_metadata.width,
                         metadata=json.dumps(metadata),
                         auto=image_metadata.auto,
                         degreesToRotate=image_metadata.rotatedDegrees,
                         flipv=image_metadata.flip_vertical,
                         fliph=image_metadata.flip_horizontal,
                         authorised_users=json.dumps(image_metadata.authorised_users))

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

        try:
            # Retrieve user token
            id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

            # Get user ID from token
            user_id = tokenHandler.get_user_from_token(id_token)

        except(IndexError):
            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

        if user_id:

            # Create new user if user does not already exist
            user = models.User.if_new_create(user_id)

            if len(request.name) == 0:
                raise endpoints.BadRequestException(
                    'Please enter a name for the file')

            if models.Image.get_image_by_user(request.name, user_id) is None:

                # Knock mime type off start of image base64 and store it
                request_data = request.image.split(',')
                mime_type = re.split('[:;]+', request_data[0])[1]

                # Validate mime type
                if mime_type in accepted_mime_types:

                    # Write image metadata to datastore, initialising adjustment values
                    image = models.Image(parent=user.key,
                                        name=request.name,
                                        mime_type=mime_type,
                                        height=request.height,
                                        width=request.width,
                                        auto=False,
                                        rotatedDegrees=0,
                                        flip_vertical=False,
                                        flip_horizontal=False,
                                        authorised_users=[])

                    image.put()

                    # Decode base64 image
                    image_file = request_data[1].decode('base64')

                    # Upload image to cloud storage
                    crud.upload_image_file(image_file, user_id + "/" + request.name, mime_type)

                    return message_types.VoidMessage()

                else:
                    raise endpoints.BadRequestException(
                        "'" + mime_type + "' is not an accepted type. Please upload an image of one of the following formats:" + ", ".join(accepted_mime_types))

            else:
                raise endpoints.BadRequestException(
                    request.name + " already in use. Please use another name.")

        # If user is not logged in
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')


    @endpoints.method(
        EDIT_IMAGE_RESOURCE,
        Image,
        path='images/{image_id}',
        http_method='POST',
        name='image.edit')
    def edit_image(self, request):

        try:
            # Retrieve user token
            id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

            # Get user ID from token
            user_id = tokenHandler.get_user_from_token(id_token)

        except(IndexError):
            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

        if user_id:

            # Create new user if user does not already exist
            models.User.if_new_create(user_id)

            # Set as non-admin user for now
            admin = False

            try:

                # Retrieve image metadata
                image_metadata = models.Image.get_image_by_user(request.image_id, user_id)

                # Can execute admin tasks
                admin = True

                # If metadata not retrieved against user, attempt to retrieve images where they are an authorised user
                if image_metadata is None:

                    # Retrieve image metadata
                    image_metadata = models.Image.get_shared_image_by_user(request.image_id, user_id)

                    # Cannot execute admin tasks
                    admin = False


                # If still no metadata retrieved, they must have removed as an authorised user
                if image_metadata is None:

                    raise endpoints.ForbiddenException(
                        'You do not have the rights to change this image')


                # Otherwise, Retrieve image
                image_file = crud.retrieve_image_file(image_metadata.key.parent().id() + "/" + request.image_id)

            except (IndexError):
                raise endpoints.NotFoundException(
                    'Image ID {} not found'.format(request.image_id))


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
            and request.fliph is None
            and request.authorised_users is None):
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

            if request.authorised_users != None:

                # If user is admin
                if admin:

                    # Update authorised users
                    image_metadata.authorised_users = json.loads(request.authorised_users)


            image_metadata.put()


            # Retrieve metadata
            metadata = imageManipulation.get_metadata(image_file)

            # Perform appropriate transformations on image
            image_file = imageManipulation.transform(image_metadata, image_file)

            # Encode image to return
            base64_prefix = "data:" + image_metadata.mime_type + ";base64,"
            encoded_image = base64_prefix + base64.b64encode(image_file)

            # If admin, return with authorised users
            if admin:
                return Image(name=image_metadata.name,
                             image=encoded_image,
                             height=image_metadata.height,
                             width=image_metadata.width,
                             metadata=json.dumps(metadata),
                             auto=image_metadata.auto,
                             degreesToRotate=image_metadata.rotatedDegrees,
                             flipv=image_metadata.flip_vertical,
                             fliph=image_metadata.flip_horizontal,
                             authorised_users=image_metadata.authorised_users)

            else:
                return Image(name=image_metadata.name,
                             image=encoded_image,
                             height=image_metadata.height,
                             width=image_metadata.width,
                             metadata=json.dumps(metadata),
                             auto=image_metadata.auto,
                             degreesToRotate=image_metadata.rotatedDegrees,
                             flipv=image_metadata.flip_vertical,
                             fliph=image_metadata.flip_horizontal)

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

        try:
            # Retrieve user token
            id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

            # Get user ID from token
            user_id = tokenHandler.get_user_from_token(id_token)

        except(IndexError):
            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

        if user_id:

            # Create new user if user does not already exist
            models.User.if_new_create(user_id)

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


    @endpoints.method(
        GET_IMAGE_RESOURCE,
        ShareURL,
        path='images/{image_id}/getShareURL',
        http_method='GET',
        name='image.getShareURL')
    def get_share_url(self, request):

        try:
            # Retrieve user token
            id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

            # Get user ID from token
            user_id = tokenHandler.get_user_from_token(id_token)

        except(IndexError):
            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

        if user_id:

            # Create new user if user does not already exist
            models.User.if_new_create(user_id)

            try:
                # Retrieve shared image metadata
                image_metadata = models.Image.get_image_by_user(request.image_id, user_id)

            except (IndexError, TypeError):
                raise endpoints.NotFoundException(
                    'Image ID {} not found'.format(request.image_id))

            # Set image as shared for the next 30 minutes
            image_metadata.share_expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
            image_metadata.put()

            # Retrun URL for any user to claim
            return ShareURL(url="https://wessex-saxonics.appspot.com/share/" + user_id + "/" + request.image_id,
                            expiry=image_metadata.share_expiry);

        # If user is not logged in
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')


    @endpoints.method(
        SHARE_IMAGE_RESOURCE,
        message_types.VoidMessage,
        path='shared_images/{share_user_id}/{image_id}',
        http_method='GET',
        name='confirmShare.get')
    def confirm_share(self, request):

        try:
            # Retrieve user token
            id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

            # Get user ID from token
            user_id = tokenHandler.get_user_from_token(id_token)

        except(IndexError):
            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

        if user_id:

            # Create new user if user does not already exist
            user = models.User.if_new_create(user_id)

            try:
                # Retrieve image metadata
                image_metadata = models.Image.get_image_by_user(request.image_id, request.share_user_id)

            except (IndexError, TypeError):
                raise endpoints.NotFoundException(
                    'Image ID {} not found'.format(request.image_id))

            # If share still valid
            if image_metadata.share_expiry > datetime.datetime.now():

                # Add current user to list of authorised users on image
                image_metadata.authorised_users.append(user.key.id())

                # End share period
                image_metadata.share_expiry = datetime.datetime.now()

                # Save changes
                image_metadata.put()

                return message_types.VoidMessage()

            else:

                raise endpoints.BadRequestException(
                    'Share timed out, please request the link again.'
                )

        # If user is not logged in
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')


    @endpoints.method(
        GET_ALL_IMAGES_RESOURCE,
        ImageCollection,
        path='shared_images',
        http_method='GET',
        name='sharedimages.list')
    def list_shared_images(self, request):

        try:
            # Retrieve user token
            id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

            # Get user ID from token
            user_id = tokenHandler.get_user_from_token(id_token)

        except(IndexError):
            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')


        # If user retrieved
        if user_id:

            # Create new user if user does not already exist
            models.User.if_new_create(user_id)

            # Retrieve metadata of images shared with user
            images = models.Image.get_all_shared_with_user(user_id).fetch()

            # Append all images to a return ImageCollection
            ret_images = ImageCollection()
            for image_metadata in images:

                # Retrieve image
                image_file = crud.retrieve_image_file(image_metadata.key.parent().id() + "/" + image_metadata.name)

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
                'Please provide user credentials')


    @endpoints.method(
        GET_IMAGE_RESOURCE,
        Image,
        path='shared_images/{image_id}',
        http_method='GET',
        name='sharedimage.get')
    def get_shared_image(self, request):

        try:
            # Retrieve user token
            id_token = self.request_state.headers.get_all('Authorization')[0].split(' ').pop()

            # Get user ID from token
            user_id = tokenHandler.get_user_from_token(id_token)

        except(IndexError):
            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')

        if user_id:

            # Create new user if user does not already exist
            models.User.if_new_create(user_id)

            try:
                # Retrieve shared image metadata
                image_metadata = models.Image.get_shared_image_by_user(request.image_id, user_id)

            except (IndexError, TypeError):
                raise endpoints.NotFoundException(
                    'Image ID {} not found'.format(request.image_id))

            # Retrieve image
            image_file = crud.retrieve_image_file(image_metadata.key.parent().id() + "/" + request.image_id)

            # Retrieve metadata
            metadata = imageManipulation.get_metadata(image_file)

            # Perform appropriate transformations on image
            image_file = imageManipulation.transform(image_metadata, image_file)

            # Encode image to return
            base64_prefix = "data:" + image_metadata.mime_type + ";base64,"
            encoded_image = base64_prefix + base64.b64encode(image_file)

            return Image(name=image_metadata.name,
                         image=encoded_image,
                         height=image_metadata.height,
                         width=image_metadata.width,
                         metadata=json.dumps(metadata),
                         auto=image_metadata.auto,
                         degreesToRotate=image_metadata.rotatedDegrees,
                         flipv=image_metadata.flip_vertical,
                         fliph=image_metadata.flip_horizontal)

        # If user is not logged in
        else:

            # Return 401 Unauthorized
            raise endpoints.UnauthorizedException(
                'Please provide user credentials')


api = endpoints.api_server([WessexSaxonicsApi])
