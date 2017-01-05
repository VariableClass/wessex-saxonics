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
 * * Pages
 * */
var viewPage = document.getElementById('view-page');
var uploadPage = document.getElementById('upload-page');
var editPage = document.getElementById('edit-page');

/**
 * Forms
 */
var uploadForm = document.getElementById('upload-form');

/**
 * * Element click actions
 * */
var active = "active";

home.onclick = function(){
    wessexsaxonics.mediaserver.loadMainPage();
}

upload.onclick = function(){
    wessexsaxonics.mediaserver.deactivateAllElements();
    upload.className = active;
    viewPage.style.display = 'none';
    uploadPage.style.display = 'block';
}

signout.onclick = function(){
    firebase.auth().signOut();
    wessexsaxonics.mediaserver.deactivateAllElements();
    signout.className = active;
}

uploadForm.onsubmit = function(){

    var file    = document.querySelector('input[type=file]').files[0];
    var reader  = new FileReader();

    reader.addEventListener("load", function () {
      var name = document.getElementById('image_name').value;
      var filetype = document.getElementById('image_file').value.split('.').pop();
      var imageFile = reader.result;
      wessexsaxonics.mediaserver.uploadImage(name, imageFile, filetype, 10, 10);
    }, false);

    if (file) {
      reader.readAsDataURL(file);
    }
}

wessexsaxonics.mediaserver.loadMainPage = function(){

    // Display all user images once page has loaded
    wessexsaxonics.mediaserver.listImages();

    wessexsaxonics.mediaserver.deactivateAllElements();
    home.className = active;
    viewPage.style.display = 'block';
    uploadPage.style.display = 'none';
}

wessexsaxonics.mediaserver.deactivateAllElements = function(){
    var elements = document.getElementsByClassName(active);

    for (var i = 0; i < elements.length; i++) {
       elements[i].classList.remove(active);
    }
};


/**
 * * Firebase authentication user action
 * */
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {

      // Hide firebase container
      document.getElementById('firebase').style.display = 'none';

  } else {
      document.getElementById('firebase').style.display = 'block';
      signout.style.display = 'none';
  }
});


/**
 * * Image Output
 */

/**
 * Prints a image to the image list.
 * param {Object} image Image to display.
 */
wessexsaxonics.mediaserver.print = function(name, image, width, height) {
  var listItem = document.createElement("li");
  var html_image = document.createElement("img");
  html_image.src = image;
  listItem.appendChild(document.createTextNode("Name: " + name));
  listItem.appendChild(html_image);
  listItem.appendChild(document.createTextNode("Width: " + width));
  listItem.appendChild(document.createTextNode("Height: " + height));
  document.getElementById("images").appendChild(listItem);
};

/**
 * Clear images from image list.
 */
wessexsaxonics.mediaserver.clearImages = function(){
  var images = document.getElementById("images");
  while (images.firstChild) {
    images.removeChild(images.firstChild);
  }
}


/**
 * * API Calls
 */

/**
 * Gets a specific image via the API.
 * @param {string} id ID of the image.
 */
wessexsaxonics.mediaserver.getImage = function(idToken, user_id) {

  // Execute HTTP request
  gapi.client.wessexsaxonics.image.get({"headers": {"Authorization": "Bearer " + idToken },"image_id": user_id}).execute(
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

    wessexsaxonics.mediaserver.clearImages();

    firebase.auth().currentUser.getToken(true).then(function(idToken){
        var xhr = new XMLHttpRequest();
        xhr.open('GET',
          'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images');
        xhr.setRequestHeader('Authorization',
          'Bearer ' + idToken);
        xhr.onreadystatechange = function() {
          if (xhr.readyState == XMLHttpRequest.DONE){
              resp = JSON.parse(xhr.responseText);
              resp.items = resp.items || [];
              for (var i = 0; i < resp.items.length; i++) {
                  var name = resp.items[i].name;
                  var width = resp.items[i].width;
                  var height = resp.items[i].height;
                  var encoded_image = resp.items[i].image;
                  var image = window.atob(encoded_image);
                  wessexsaxonics.mediaserver.print(name, image, width, height);
              }
          }
        };
        xhr.send();
    });
};

/**
 * Uploads image via the API.
 */
wessexsaxonics.mediaserver.uploadImage = function(id, image, filetype, width, height) {

    firebase.auth().currentUser.getToken(true).then(function(idToken){

        // Define payload
        var jsonPayload = new Object();
        jsonPayload.name = id;
        jsonPayload.image = window.btoa(image);
        jsonPayload.filetype = filetype;
        jsonPayload.width = width;
        jsonPayload.height = height;

        // Define request
        var xhr = new XMLHttpRequest();
        xhr.open('POST',
          'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images');
        xhr.setRequestHeader('Authorization',
          'Bearer ' + idToken);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(JSON.stringify(jsonPayload));
    });

    wessexsaxonics.mediaserver.loadMainPage();
};

/**
 * Deletes an image
 */
wessexsaxonics.mediaserver.deleteImage = function(id) {
     gapi.client.wessexsaxonics.images.delete({'image_id': id}).execute(
        function(resp) {
            if (!resp.code){
                wessexsaxonics.mediaserver.loadMainPage();
            }
        }
     );
}


/**
 * * UI
 */


/**
 * * Loads the application UI after the user has completed auth.
 * */
wessexsaxonics.mediaserver.userAuthed = function() {

    // Show signout button
    signout.style.display = 'block';

    // Display all user images
    wessexsaxonics.mediaserver.loadMainPage();
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
      gapi.client.init({
        'apiKey': 'AIzaSyCFecc5GJRVIABKtLMmCY8K-fCiamBCF2k',
        'discoveryDocs': [],
        'clientId': '552722976411-cdl5bddfvaf0fh9djhvetr47j59prgp8.apps.googleusercontent.com',
        'scope': 'user.email',
      });
  }

  gapi.client.load("wessexsaxonics", "v1", callback, 'https://backend-dot-wessex-saxonics.appspot.com/_ah/api');
};
