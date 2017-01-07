from google.appengine.ext import ndb
from google.appengine.api import images


class Image(ndb.Model):
    name = ndb.StringProperty()
    user_id = ndb.StringProperty()
    mime_type = ndb.StringProperty()
    height = ndb.IntegerProperty()
    width = ndb.IntegerProperty()
    auto = ndb.BooleanProperty()
    rotatedDegrees = ndb.IntegerProperty()
    flip_vertical = ndb.BooleanProperty()
    flip_horizontal = ndb.BooleanProperty()

    @classmethod
    def get_all_by_user(cls, user_id):
        return cls.query(cls.user_id == user_id).order(cls.name)

    @classmethod
    def get_image_by_user(cls, name, user_id):
        return cls.query(cls.user_id == user_id, cls.name == name).get()

    @classmethod
    def delete_user_image(cls, name, user_id):
        key = cls.get_image_by_user(name, user_id).key
        key.delete()
