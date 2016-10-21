# [START imports]
import sys
sys.path.append('lib')

import crud
import models
import webapp2

# [END imports]


class UploadPage(webapp2.RequestHandler):

    # Handle upload post action
    def post(self):

        # Retrieve image model
        user_image = models.get_user_image()

        # Retrieve image attributes from form
        name = self.request.get('image_name')
        image = self.request.POST.get('image_file')

        # Store image metadata in datastore, upload image to cloud storage
        user_image.name = name
        user_image.address = crud.upload_image_file(image.file.read(), name, image.type)
        user_image.put()

        # Return to main page
        self.redirect('/')

application = webapp2.WSGIApplication([('/upload', UploadPage)], debug=True)