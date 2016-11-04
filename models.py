from google.appengine.api import users
from google.appengine.ext import ndb


class Image(ndb.Model):
    name = ndb.StringProperty()
    bucket_name = ndb.StringProperty()
    height = ndb.FloatProperty()
    width = ndb.FloatProperty()
    user = ndb.UserProperty(auto_current_user_add=True)

    # Retrieve public URL for image
    @property
    def public_url(self):

        """
        :rtype: object
        """
        if self.bucket_name is None or self.name is None:
            return None

        else:
            # Return public image URL
            return 'https://%(bucket)s.storage.googleapis.com/%(file)s' % {'bucket': self.bucket_name,
                                                                           'file': self.name}


def get_user_image(user_id=None):

    # If no user ID given, get user to login
    if not user_id:
        user = users.get_current_user()

        # If user not logged in, return None
        if not user:
            return None

        # Else set user ID
        user_id = user.user_id()

    # Create datastore key
    key = ndb.Key('Image', user_id)

    # Retrieve image metadata from datastore
    user_image = key.get()

    # If no profile picture found, return blank new image
    if not user_image:
        user_image = Image(id=user_id)

    # Return profile picture
    return user_image