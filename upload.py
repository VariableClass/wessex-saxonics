# [START imports]
import sys
sys.path.append('lib')

import models
import os
import cloudstorage as gcs
import webapp2

from google.appengine.api import app_identity

# [END imports]


class UploadPage(webapp2.RequestHandler):

    # Handle upload post action
    def post(self):

        # Retrieve image model
        profile_picture = models.get_user_profile_picture()

        # Retrieve image attributes from form
        name = self.request.get('image_name')
        image = self.request.POST.get('image_file')

        # Store image metadata in datastore
        profile_picture.name = name
        profile_picture.put()

        # Upload image to cloud storage
        upload_image_file(image.file.read(), name, image.type)

        # Return to main page
        self.redirect('/')


# Upload image to cloud storage
def upload_image_file(image, name, image_type):

    # Define retry parameters
    write_retry_params = gcs.RetryParams(backoff_factor=1.1)

    # Retrieve default bucket
    bucket_name = os.environ.get('BUCKET_NAME', app_identity.get_default_gcs_bucket_name())

    # Define filename
    filename = '/' + bucket_name + '/' + name

    # Create new cloud storage file to write to
    gcs_file = gcs.open(filename, 'w', content_type=image_type, retry_params=write_retry_params)

    # Write the image file to cloud storage
    gcs_file.write(image)

    # Close the cloud storage file
    gcs_file.close()


application = webapp2.WSGIApplication([('/upload', UploadPage)], debug=True)