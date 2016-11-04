# [START imports]
import sys
sys.path.append('lib')

import crud
import models
import webapp2

from google.appengine.api import images

# [END imports]


class UploadPage(webapp2.RequestHandler):

    # Handle upload post action
    def post(self):

        # Retrieve image model
        user_image = models.get_user_image()

        # Retrieve image attributes from form
        name = self.request.get('image_name')
        form_image = self.request.POST.get('image_file')

        # Read image and retrieve metadata
        image_bytes = form_image.file.read()
        image = images.Image(image_bytes)
        width = image.width
        height = image.height

        # Store image metadata in datastore, upload image to cloud storage
        user_image.name = name
        user_image.height = height
        user_image.width = width
        user_image.bucket_name = crud.upload_image_file(image_bytes, name, form_image.type)
        user_image.put()

        # Return to main page
        self.redirect('/')

application = webapp2.WSGIApplication([('/upload', UploadPage)], debug=True)