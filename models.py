from google.appengine.api import users
from google.appengine.ext import ndb


class Image(ndb.Model):
    name = ndb.StringProperty()
    user = ndb.UserProperty(auto_current_user_add=True)


def get_user_profile_picture(user_id=None):

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
    profile_picture = key.get()

    # If no profile picture found, return blank new image
    if not profile_picture:
        profile_picture = Image(id=user_id)

    # Return profile picture
    return profile_picture