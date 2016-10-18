from google.appengine.api import users
from google.appengine.ext import ndb


class Image(ndb.Model):
    name = ndb.StringProperty()
    size = ndb.FloatProperty(default=0.0)
    user = ndb.UserProperty(auto_current_user_add=True)


def get_user_profile_picture(user_id=None):

    # If no user ID given, get user to login
    if not user_id:
        user = users.get_current_user()

        # If user not logged in, return NOne
        if not user:
            return None

        # Else set user ID
        user_id = user.user_id()

    key = ndb.Key('Image', user_id)
    profilepicture = key.get()

    # If no profile picture found, return blank new image
    if not profilepicture:
        profilepicture = Image(id=user_id)

    # Return profile picture
    return profilepicture