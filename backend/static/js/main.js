/**
 * @fileoverview
 * Provides methods for the Wessex Saxonics Media Server POC UI and interaction with the
 * Wessex Saxonics API.
 */

/** Namespaces for Wessex-Saxonics and the media server POC. */
var wessexsaxonics = wessexsaxonics || {};
wessexsaxonics.mediaserver = wessexsaxonics.mediaserver || {};

/**
 * * Client ID of the application.
 * * @type {string}
 * */
wessexsaxonics.mediaserver.CLIENT_ID = '552722976411-cdl5bddfvaf0fh9djhvetr47j59prgp8.apps.googleusercontent.com';

/**
 * * Scopes used by the application.
 * * @type {string}
 * */
wessexsaxonics.mediaserver.SCOPES = 'https://www.googleapis.com/auth/userinfo.email';


/**
 * * Sign-In
 * */

/**
 * * Whether or not the user is signed in.
 * * @type {boolean}
 * */
wessexsaxonics.mediaserver.signedIn = false;

/**
 * * Handles the auth flow, with the given value for immediate mode.
 * * @param {boolean} mode Whether or not to use immediate mode.
 * * @param {Function} callback Callback to call on completion.
 * */
wessexsaxonics.mediaserver.signin = function(mode, callback) {
  gapi.auth.authorize({client_id: wessexsaxonics.mediaserver.CLIENT_ID,
    scope: wessexsaxonics.mediaserver.SCOPES, immediate: mode,
    cookie_policy: 'single_host_origin'},
      callback);
};

/**
 * * Handles sign out
 * */
wessexsaxonics.mediaserver.signout = function(mode, callback) {
  gapi.auth.setToken(null);
  gapi.auth.signOut();
};

/**
 * * Presents the user with the authorization popup.
 * */
wessexsaxonics.mediaserver.auth = function() {
  if (!wessexsaxonics.mediaserver.signedIn) {
    wessexsaxonics.mediaserver.signin(false,
        wessexsaxonics.mediaserver.userAuthed);
  } else {
    wessexsaxonics.mediaserver.signout();
    wessexsaxonics.mediaserver.signedIn = false;
    document.querySelector('#signinButton').textContent = 'Sign in';
    document.querySelector('#image_id').disabled = true;
    document.querySelector('#getImage').disabled = true;
    document.querySelector('#listImages').disabled = true;
  }
};


/**
 * * Image Output
 */

/**
 * Prints a image to the image log.
 * param {Object} image Image to display.
 */
wessexsaxonics.mediaserver.print = function(image) {
  var element = document.createElement('div');
  element.classList.add('row');
  element.innerHTML = "Name: " + image.name + ", width: " + image.width + ", height: " + image.height + ", bucket name: " + image.bucket_name;
  document.querySelector('#outputLog').appendChild(element);
};

/**
 * Gets a specific image via the API.
 * @param {string} id ID of the image.
 */
wessexsaxonics.mediaserver.getImage = function(id) {
  gapi.client.wessexsaxonics.images.get({'id': id}).execute(
      function(resp) {
        if (!resp.code) {
          wessexsaxonics.mediaserver.print(resp);
        }
      });
};

/**
 * Lists images via the API.
 */
wessexsaxonics.mediaserver.listImages = function() {
  gapi.client.wessexsaxonics.images.list().execute(
      function(resp) {
        if (!resp.code) {
          resp.items = resp.items || [];
          for (var i = 0; i < resp.items.length; i++) {
            wessexsaxonics.mediaserver.print(resp.items[i]);
          }
        }
      });
};

/**
 * * UI
 */

/**
 * Enables the button callbacks in the UI.
 */
wessexsaxonics.mediaserver.enableButtons = function() {
  var getImage = document.querySelector('#getImage');
  getImage.addEventListener('click', function(e) {
    wessexsaxonics.mediaserver.getImage(
        document.querySelector('#image_id').value);
  });

  var listImages = document.querySelector('#listImages');
  listImages.addEventListener('click',
      wessexsaxonics.mediaserver.listImages);

  var signinButton = document.querySelector('#signinButton');
  signinButton.addEventListener('click',
      wessexsaxonics.mediaserver.auth);
};

/**
 * * Loads the application UI after the user has completed auth.
 * */
wessexsaxonics.mediaserver.userAuthed = function() {
  var request = gapi.client.oauth2.userinfo.get().execute(function(resp) {
    if (!resp.code) {
      wessexsaxonics.mediaserver.signedIn = true;
      document.querySelector('#signinButton').textContent = 'Sign out';
      document.querySelector('#image_id').disabled = false;
      document.querySelector('#getImage').disabled = false;
      document.querySelector('#listImages').disabled = false;
    }
  });
};


/*
 * * Application Initialisation
 */

/**
 * Initializes the application.
 * @param {string} apiRoot Root of the API's path.
 */
wessexsaxonics.mediaserver.init = function(apiRoot) {
  // Loads the OAuth and helloworld APIs asynchronously, and triggers login
  // when they have completed.
  var apisToLoad;
  var callback = function() {
    if (--apisToLoad == 0) {
      wessexsaxonics.mediaserver.enableButtons();
      wessexsaxonics.mediaserver.signin(true, wessexsaxonics.mediaserver.userAuthed);
    }
  }

  apisToLoad = 2; // must match number of calls to gapi.client.load()
  gapi.client.load('wessexsaxonics', 'v1', callback, apiRoot);
  gapi.client.load('oauth2', 'v2', callback);
};
