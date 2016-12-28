/**
 * @fileoverview
 * Provides methods for the Wessex Saxonics Media Server POC UI and interaction with the
 * Wessex Saxonics API.
 */

/** global namespace for Wessex-Saxonics. */
var wessexsaxonics = wessexsaxonics || {};

/** mediaserver namespace for media server POC. */
wessexsaxonics.mediaserver = wessexsaxonics.mediaserver || {};

/**
 * Prints a image to the image log.
 * param {Object} image Image to display.
 */
wessexsaxonics.mediaserver.print = function(image) {
  var element = document.createElement('div');
  element.classList.add('row');
  element.innerHTML = image.name;
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
 * Enables the button callbacks in the UI.
 */
wessexsaxonics.mediaserver.enableButtons = function() {
  var getImage = document.querySelector('#getImage');
  getImage.addEventListener('click', function(e) {
    wessexsaxonics.mediaserver.getImage(
        document.querySelector('#id').value);
  });

  var listImages = document.querySelector('#listImages');
  listImages.addEventListener('click',
      wessexsaxonics.mediaserver.listImages);

};
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
    }
  }

  apisToLoad = 1; // must match number of calls to gapi.client.load()
  gapi.client.load('wessexsaxonics', 'v1', callback, apiRoot);
};
