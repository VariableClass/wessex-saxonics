# [START imports]
import sys
sys.path.append('lib')

import crud
import jinja2
import models
import os
import webapp2

from google.appengine.api import images, users

# [END imports]

#
template_env = jinja2.Environment(loader=jinja2.FileSystemLoader(os.getcwd()))

class UploadPage(webapp2.RequestHandler):

    # Handle upload get action
    def get(self):

        # Retrieve user
        user = users.get_current_user()

        # Create authentication URLs
        login_url = users.create_login_url(self.request.path)
        logout_url = users.create_logout_url(self.request.path)

        # Retrieve HTML template
        template = template_env.get_template('html/upload.html')

        # Define HTML context
        context = {
            'user': user,
            'login_url': login_url,
            'logout_url': logout_url
        }

        # Return context-filled template
        self.response.out.write(template.render(context))


    # Handle upload post action
    def post(self):

        # Retrieve user
        user = users.get_current_user()

        # Retrieve image attributes from form
        name = self.request.get('image_name')
        form_image = self.request.POST.get('image_file')

        # Read image and retrieve metadata
        image_bytes = form_image.file.read()
        image = images.Image(image_bytes)
        width = image.width
        height = image.height

        # Store image metadata in datastore, upload image to cloud storage
        user_image = models.Image(name=name,
                                  user_id=user.user_id(),
                                  height=height,
                                  width=width,
                                  bucket_name=crud.upload_image_file(image_bytes, name, form_image.type))

        user_image.put()

        # Return to main page
        self.redirect('/')

application = webapp2.WSGIApplication([('/upload', UploadPage)], debug=True)