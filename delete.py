# [START imports]
import sys
sys.path.append('lib')

import crud
import models
import webapp2

# [END imports]


class DeletePage(webapp2.RequestHandler):

    # Handle delete post action
    def get(self):

        # Retrieve image model
        user_image = models.get_user_image()

        # Delete image from cloud cloud storage
        crud.delete_file('/' + user_image.bucket_name + '/' + user_image.name)

        # Return to main page
        self.redirect('/')

application = webapp2.WSGIApplication([('/delete', DeletePage)], debug=True)