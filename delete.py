# [START imports]
import sys
sys.path.append('lib')

import crud
import models
import time
import webapp2

from google.appengine.api import users

# [END imports]


class DeletePage(webapp2.RequestHandler):

    # Handle delete post action
    def get(self):

        imageid = self.request.get('imageid')

        # Retrieve user
        user = users.get_current_user()

        # Retrieve image model
        user_image = models.Image.get_by_id(imageid)


        if user_image.user_id == user.user_id():

            # Delete image from cloud cloud storage
            crud.delete_file('/' + user_image.bucket_name + '/' + user_image.name)

            # Delete metadata from datastore
            models.Image.delete_user_image(imageid)

        # Return to main page
        self.redirect('/')

application = webapp2.WSGIApplication([('/delete', DeletePage)], debug=True)