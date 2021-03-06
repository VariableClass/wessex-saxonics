from google.appengine.ext import ndb
from google.appengine.api import images


class User(ndb.Model):

    @classmethod
    def if_new_create(cls, user_id):

        # Attempt to retrieve user
        user_from_query = cls.get_by_id(user_id)

        # If no user exists
        if user_from_query is None:

            # Create one and upload to the datastore
            user = cls(id=user_id)
            user.put()
            return user

        # Else if user exists, return
        return user_from_query


class Image(ndb.Model):
    name = ndb.StringProperty()
    mime_type = ndb.StringProperty()
    height = ndb.IntegerProperty()
    width = ndb.IntegerProperty()
    authorised_users = ndb.StringProperty(repeated=True)
    auto = ndb.BooleanProperty()
    rotatedDegrees = ndb.IntegerProperty()
    flip_vertical = ndb.BooleanProperty()
    flip_horizontal = ndb.BooleanProperty()
    share_expiry = ndb.DateTimeProperty()
    owner = ndb.StringProperty()

    @classmethod
    def get_all_by_user(cls, user_id):
        ancestor_key = ndb.Key(User, user_id)
        return cls.query(ancestor=ancestor_key).order(cls.name)

    @classmethod
    def get_image_by_user(cls, name, user_id):
        return cls.get_all_by_user(user_id).filter(cls.name == name).get()

    @classmethod
    def delete_user_image(cls, name, user_id):
        key = cls.get_image_by_user(name, user_id).key
        key.delete()

    @classmethod
    def get_all_shared_with_user(cls, user_id):
        return cls.query(cls.authorised_users == user_id)

    @classmethod
    def get_shared_image_by_user(cls, name, user_id, owner=None):

        if owner is None:
            return cls.get_all_shared_with_user(user_id).filter(cls.name == name).get()

        else:
            return cls.get_all_shared_with_user(user_id).filter(cls.name == name).filter(cls.owner == owner).get()
