# [START imports]

import crud
import jinja2
import models
import os
import webapp2

from google.appengine.api import users

# [END imports]

#
template_env = jinja2.Environment(loader=jinja2.FileSystemLoader(os.getcwd()))


class MainPage(webapp2.RequestHandler):

    # Handle get action
    def get(self):

        # Retrieve user
        user = users.get_current_user()

        # Create authentication URLs
        login_url = users.create_login_url(self.request.path)
        logout_url = users.create_logout_url(self.request.path)

        # Retrieve user image metadata
        user_image = models.get_user_image()

        # If no user_image
        if user_image is None or user_image.public_url is None:

            # Retrieve HTML template
            template = template_env.get_template('html/upload.html')

            # Define HTML context
            context = {
                'user': user,
                'login_url': login_url,
                'logout_url': logout_url
            }

        else:

            # Retrieve HTML template
            template = template_env.get_template('html/view.html')

            # Define HTML context
            context = {
                'user': user,
                'user_image': user_image,
                'login_url': login_url,
                'logout_url': logout_url
            }

        # Return context-filled template
        self.response.out.write(template.render(context))

application = webapp2.WSGIApplication([('/', MainPage)], debug=True)