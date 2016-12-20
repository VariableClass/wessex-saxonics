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

    ITEMS_PER_PAGE = 20

    # Handle get action
    def get(self):

        # Create authentication URLs
        login_url = users.create_login_url(self.request.path)
        logout_url = users.create_logout_url(self.request.path)

        # Retrieve user
        user = users.get_current_user()

        if user:

            # Retrieve user image metadata
            user_images = models.Image.get_all_by_user(user).fetch(self.ITEMS_PER_PAGE)

            # Retrieve HTML template
            template = template_env.get_template('html/view.html')

            # Define HTML context
            context = {
                'user': user,
                'user_images': user_images,
                'login_url': login_url,
                'logout_url': logout_url
            }

        else:

            # Retrieve HTML template
            template = template_env.get_template('html/signin.html')

            # Define HTML context
            context = {
                'login_url': login_url
            }

        # Return context-filled template
        self.response.out.write(template.render(context))

application = webapp2.WSGIApplication([('/', MainPage)], debug=True)