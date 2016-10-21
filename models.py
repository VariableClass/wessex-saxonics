from google.appengine.api import users
from google.appengine.ext import ndb


class Image(ndb.Model):
    name = ndb.StringProperty()
    address = ndb.StringProperty()
    height = ndb.FloatProperty()
    width = ndb.FloatProperty()
    user = ndb.UserProperty(auto_current_user_add=True)


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