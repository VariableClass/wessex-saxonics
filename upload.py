#[START imports]
import sys
sys.path.append('lib')
import models
import os
import cloudstorage as gcs
import webapp2

from google.appengine.api import app_identity
#[END imports]


class PrefsPage(webapp2.RequestHandler):

    def post(self):
        profilepicture = models.get_user_profile_picture()
        try:
            name = self.request.get('image_name')
            size = float(self.request.get('image_size'))
            file = self.request.POST.get('image_file')

            profilepicture.name = name
            profilepicture.size = size
            profilepicture.put()

        except ValueError:
            # User entered a value that wasn't a float. Ignore for now.
            pass

        bucket_name = os.environ.get('BUCKET_NAME',
                                     app_identity.get_default_gcs_bucket_name())

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.write('Demo GCS Application running from Version: '
                            + os.environ['CURRENT_VERSION_ID'] + '\n')
        self.response.write('Using bucket name: ' + bucket_name + '\n\n')

        upload_file(file.file.read(), '/' + bucket_name + '/' + name, file.type)

        self.redirect('/')


def upload_file(file, filename, type):

    write_retry_params = gcs.RetryParams(backoff_factor=1.1)
    gcs_file = gcs.open(filename,
                        'w',
                        content_type=type,
                        retry_params=write_retry_params)

    gcs_file.write(file)
    gcs_file.close()


application = webapp2.WSGIApplication([('/upload', PrefsPage)], debug=True)