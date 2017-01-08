# Wessex Saxonics Media Server POC
https://wessex-saxonics.appspot.com/

The Wessex Saxonics Media Server proof of concept operates as two independent services, both running on Google Cloud Platform. All requests are sent as AJAX HTTPS requests, authorised by Firebase provided Java Web Tokens. Requests between the frontend and backend services are secured with an API key.

- The first service is a Python powered Google Cloud Endpoints Framework 2.0 REST API operating at https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/. The OpenAPI specification can be found within the project directory at `backend/wessexsaxonicsv1openapi.yaml`. You can explore the API at https://backend-dot-wessex-saxonics.appspot.com/_ah/api/explorer. The API sits behind an API key, restricted to a single HTTP referrer; the web client, however this is amendable in the Cloud Console, were the key to be shared with another project/developer. 

- The second service is a JavaScript Single-Page Application operating at https://wessex-saxonics.appspot.com/

## Usage Guide
#### Signing In
To start, navigate to the web frontend service and sign in using one of the Firebase login providers:

  - Google
  - Facebook
  - Twitter
  - E-mail

Once signed in, you will be presented with an *(initially empty)* dashboard where all photos you upload will be accessible. The navigation bar presents you with options to **Upload**, **Edit**, view **Shared Images**, **Sign Out** or select the **Wessex Saxonics Media Server POC** to return to the home page. The navigation item displaying your user display name is simply to add clarity that you are signed in.

#### Uploading Images
Firstly, images may be uploaded on the **Upload** page. Specify an *Image Name* and select a file for upload before clicking the *Upload* button to post the image to the backend to be dealt with. This call returns an 204 Success, or 400 Bad Request if the name has been taken or the image is of an unsupported filetype. If the image has been uploaded successfully, you will be returned to the home page. 

#### Viewing Images
There should now sit a single, solitary image on your home page, listed with its ID, width and height. As you add more images, they will display in a sort of grid.

#### Editing Images
Clicking the 'Edit' link below an image or indeed, the image itself, will take you to the **Edit** page. It is also possible to select the Edit navigation item and manually enter the name of the image you wish to edit. A non-matching ID will return 404 Not Found.

Here you are presented with a somewhat messy arry of controls. The first set; *Adjust Image* enable you to automatically adjust, scale, rotate and flip the image vertically or horizontally. Clicking the **Submit** button will commit any changes you make to the REST API. The second set is EXIF image metadata retrieved from the image file.

There are also two links on this page.
- **Delete** - Which obviously removes the image file and it's metadata from the cloud storage and datastore respectively, via a DELETE request to the API.
- **Share** - The functionality of this link is not immediately obvious, however clicking it will reveal that it generates a URL which can be accessed by anyone you share it with who has an account with the Media Server application and is logged in. The link is valid for *30 minutes* but will expire prematurely the minute it is accessed. Following this link will give the bearer the ability to edit the photo from which you generated the link, though they will not be able to deauthorise themselves nor any other invitees you may have shared links with, as you can. 

#### Interacting with Shared Images
When someone has shared an image with you, it will appear under your Shared Images tab. From here you can select and edit it as you would any of your own images, though you will not be able to remove image editors as you can with your own uploads.

> Currently requests for shared images are a little slower than those for images you upload as Image metadata (as an ndb.Model) is written to the Cloud Datastore against a parent key of your User ndb.Model, so queries may be executed using the user ID as an ancestor key.
