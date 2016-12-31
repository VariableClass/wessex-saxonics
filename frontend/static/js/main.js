/**
 * @fileoverview
 * Provides methods for the Wessex Saxonics Media Server POC UI and interaction with the
 * Wessex Saxonics API.
 */

/** Namespaces for Wessex-Saxonics and the media server POC. */
var wessexsaxonics = wessexsaxonics || {};
wessexsaxonics.mediaserver = wessexsaxonics.mediaserver || {};


/**
 * * Navigation items
 * */
var home = document.getElementById('home');
var upload = document.getElementById('upload');
var signout = document.getElementById('sign-out');

/**
 * * Navigation click actions
 * */

home.onclick = function(){
    home.className = "active"
    upload.className = "";
    signout.className = "";
}

upload.onclick = function(){
    home.className = ""
    upload.className = "active";
    signout.className = "";
}

signout.onclick = function(){
    firebase.auth().signOut();
    home.className = ""
    upload.className = "";
    signout.className = "active";
}



/**
 * * Firebase authentication user action
 * */
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
      document.getElementById('firebase').style.display = 'none'
      signout.style.display = 'block'
  } else {
      document.getElementById('firebase').style.display = 'block'
      signout.style.display = 'none'
  }
});


/**
 * * Image Output
 */

/**
 * Prints a image to the image log.
 * param {Object} image Image to display.
 */
wessexsaxonics.mediaserver.print = function(image) {
  var listItem = document.createElement("li");
  listItem.appendChild(document.createTextNode("Name: " + image.name + ", width: " + image.width + ", height: " + image.height));
  document.querySelector("#images").appendChild(listItem);
};

/**
 * Gets a specific image via the API.
 * @param {string} id ID of the image.
 */
wessexsaxonics.mediaserver.getImage = function(id) {
  gapi.client.wessexsaxonics.image.get({"image_id": id}).execute(
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
  var getImage = document.querySelector("#getImage");
  getImage.addEventListener("click", function() {
    wessexsaxonics.mediaserver.getImage(
        document.querySelector("#image_id").value);
  });

  var signinButton = document.querySelector("#signinButton");
  signinButton.addEventListener("click",
      wessexsaxonics.mediaserver.auth);
};


/**
 * * Loads the application UI after the user has completed auth.
 * */
wessexsaxonics.mediaserver.userAuthed = function() {
    wessexsaxonics.mediaserver.signedIn = true;
    document.querySelector("#signinButton").textContent = "Sign out";
    document.querySelector("#image_id").disabled = false;
    document.querySelector("#getImage").disabled = false;

    // Display all user images
    wessexsaxonics.mediaserver.listImages();
};


/*
 * * Application Initialisation
 */

/**
 * Initializes the application.
 */
wessexsaxonics.mediaserver.init = function() {
  // Loads API asynchronously, and triggers login when complete
  var apisToLoad;
  var callback = function() {
    if (--apisToLoad == 0) {
      wessexsaxonics.mediaserver.enableButtons();
    }
  }

  apisToLoad = 1; // must match number of calls to gapi.client.load()
  gapi.client.load("wessexsaxonics", "v1", callback, 'https://backend-dot-wessex-saxonics.appspot.com/_ah/api');
};
