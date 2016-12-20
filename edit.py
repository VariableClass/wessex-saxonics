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

class EditPage(webapp2.RequestHandler):

    # Handle edit get action
    def get(self):

        # Retrieve user
        user = users.get_current_user()

        # Create authentication URLs
        login_url = users.create_login_url(self.request.path)
        logout_url = users.create_logout_url(self.request.path)

        # Retrieve HTML template
        template = template_env.get_template('html/edit.html')

        # Retrieve image ID from request parameters
        imageid = self.request.get('imageid')

        # Retrieve requested image
        user_image = models.Image.get_image_by_user(imageid, user)

        # Define HTML context
        context = {
            'user': user,
            'user_image': user_image,
            'login_url': login_url,
            'logout_url': logout_url
        }

        # Return context-filled template
        self.response.out.write(template.render(context))


application = webapp2.WSGIApplication([('/edit', EditPage)], debug=True)
