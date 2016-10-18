import models
import webapp2


class PrefsPage(webapp2.RequestHandler):
    def post(self):
        profilepicture = models.get_user_profile_picture()
        try:
            name = self.request.get('image_name')
            size = float(self.request.get('image_size'))

            profilepicture.name = name
            profilepicture.size = size
            profilepicture.put()

        except ValueError:
            # User entered a value that wasn't a float. Ignore for now.
            pass

        self.redirect('/')

application = webapp2.WSGIApplication([('/prefs', PrefsPage)], debug=True)