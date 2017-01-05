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
var edit = document.getElementById('edit');
var signout = document.getElementById('sign-out');

/**
 * * Pages
 * */
var viewPage = document.getElementById('view-page');
var uploadPage = document.getElementById('upload-page');
var editPage = document.getElementById('edit-page');
var loading = document.getElementById('loading');

/**
 * Forms
 */
var uploadForm = document.getElementById('upload-form');
var editForm = document.getElementById('edit-form');

/*
 * Labels
 */
var nameInUse = document.getElementById('name-in-use');

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
    editPage.style.display = 'none';
}

edit.onclick = function(){

    var image_id = window.prompt("Please enter the ID of the image you wish to edit");

    wessexsaxonics.mediaserver.loadEditPage(image_id);
}

signout.onclick = function(){
    firebase.auth().signOut();
    wessexsaxonics.mediaserver.deactivateAllElements();
    signout.className = active;
}

uploadForm.onsubmit = function(){

    var file    = document.querySelector('input[type=file]').files[0];
    var reader  = new FileReader();

    // On new FileReader, retrieve file and file name, then build a new image
    // from which to retrieve width and height, to then upload
    reader.onload = function () {

      var name = document.getElementById('image_name').value;
      var imageFile = reader.result;

      var img = new Image;
      img.onload = function() {
          wessexsaxonics.mediaserver.uploadImage(name, imageFile, img.width, img.height);

          // Clear form
          uploadForm.reset();

          nameInUse.style.display = "none";
      }

      img.src = imageFile;
    };

    // If file uploaded, read in file
    if (file) {
      reader.readAsDataURL(file);
    }
}

editForm.onsubmit = function(){

    var imageId = document.getElementById('image-id').value;
    var scaleFactor = document.getElementById('scale-factor').value;

    wessexsaxonics.mediaserver.editImage(imageId, scaleFactor);

    editForm.reset();
}

wessexsaxonics.mediaserver.loadMainPage = function(){

    // Display all user images once page has loaded
    wessexsaxonics.mediaserver.listImages();

    wessexsaxonics.mediaserver.deactivateAllElements();
    home.className = active;
    viewPage.style.display = 'block';
    uploadPage.style.display = 'none';
    editPage.style.display = 'none';
}

wessexsaxonics.mediaserver.loadEditPage = function(imageId){

    wessexsaxonics.mediaserver.getImage(imageId);
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
wessexsaxonics.mediaserver.addImageToView = function(name, image, width, height) {

  var imageDiv = document.createElement("div");
  imageDiv.className = "float-image";

  var html_image = document.createElement("img");
  html_image.src = image;
  html_image.alt = name;
  html_image.width = 200;

  var labelDiv = document.createElement("div");

  var nameLabel = document.createElement("p");
  nameLabel.innerHTML = "<b>ID:</b> " + name;

  var dimensionsLabel = document.createElement("p");
  dimensionsLabel.innerHTML = "<b>Width:</b> " + width + ", <b>Height:</b> " + height;

  var editLink = document.createElement("a");
  editLink.innerHTML = "Edit";
  editLink.href = "javascript:void(0)";
  editLink.addEventListener("click", function(){
      wessexsaxonics.mediaserver.loadEditPage(name);
  }, false);

  labelDiv.appendChild(nameLabel);
  labelDiv.appendChild(dimensionsLabel);
  labelDiv.appendChild(editLink);

  imageDiv.appendChild(html_image);
  imageDiv.appendChild(labelDiv);
  document.getElementById("images").appendChild(imageDiv);
};

wessexsaxonics.mediaserver.setNoImagesMsg = function(){

    var noImages = document.createElement("p");
    noImages.innerHTML = "No images to display";

    document.getElementById("images").appendChild(noImages);
}

wessexsaxonics.mediaserver.setEditPageData = function(name, image, width, height){

    var title = document.getElementById("edit-title");
    title.innerHTML = "Editing " + name;

    var imageId = document.getElementById("image-id");
    imageId.value = name;

    var html_image = document.getElementById("edit-image");
    html_image.src = image;
    html_image.alt = name;
    html_image.width = width;
    html_image.height = height;

    var deleteLink = document.getElementById("delete-image");
    deleteLink.addEventListener("click", function(){

        wessexsaxonics.mediaserver.deleteImage(name);

    }, false);
}

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
wessexsaxonics.mediaserver.getImage = function(image_id) {

    loading.style.display = "block";

    firebase.auth().currentUser.getToken(true).then(function(idToken){
        var xhr = new XMLHttpRequest();
        xhr.open('GET',
          'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images/' + image_id);
        xhr.setRequestHeader('Authorization',
          'Bearer ' + idToken);
        xhr.onreadystatechange = function() {
          if (xhr.readyState == XMLHttpRequest.DONE){

              if (xhr.status == "404"){

                  alert("No image found for ID: " + image_id);
                  wessexsaxonics.mediaserver.loadMainPage();

              } else {

                  resp = JSON.parse(xhr.responseText);
                  var name = resp.name;
                  var image = resp.image;
                  var width = resp.width;
                  var height = resp.height

                  wessexsaxonics.mediaserver.setEditPageData(name, image, width, height);

                  wessexsaxonics.mediaserver.deactivateAllElements();
                  edit.className = active;
                  viewPage.style.display = 'none';
                  uploadPage.style.display = 'none';
                  editPage.style.display = 'block';
              }

              loading.style.display = "none";
          }
        };
        xhr.send();
    });
};

/**
 * Lists images via the API.
 */
wessexsaxonics.mediaserver.listImages = function() {

    loading.style.display = "block";

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

              if (resp.items.length > 0) {

                  for (var i = 0; i < resp.items.length; i++) {
                      var name = resp.items[i].name;
                      var image = resp.items[i].image;
                      var width = resp.items[i].width;
                      var height = resp.items[i].height;
                      wessexsaxonics.mediaserver.addImageToView(name, image, width, height);
                  }
              } else {

                  wessexsaxonics.mediaserver.setNoImagesMsg();
              }
              loading.style.display = "none";
          }
        };
        xhr.send();
    });
};

/**
 * Uploads image via the API.
 */
wessexsaxonics.mediaserver.uploadImage = function(id, image, width, height) {

    loading.style.display = "block";

    firebase.auth().currentUser.getToken(true).then(function(idToken){

        // Define payload
        var jsonPayload = new Object();
        jsonPayload.name = id;
        jsonPayload.image = image;
        jsonPayload.width = width;
        jsonPayload.height = height;

        // Define request
        var xhr = new XMLHttpRequest();
        xhr.open('POST',
          'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images');
        xhr.setRequestHeader('Authorization',
          'Bearer ' + idToken);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function() {
          if (xhr.readyState == XMLHttpRequest.DONE){

              if (xhr.status == 400){

                  nameInUse.style.display = "block";

              } else {

                  wessexsaxonics.mediaserver.loadMainPage();
              }

              loading.style.display = "none";
          }
        };
        xhr.send(JSON.stringify(jsonPayload));
    });
};

/**
 * Updates image metadata
 */
wessexsaxonics.mediaserver.editImage = function(image_id, scaleFactor){

    loading.style.display = "block";

    firebase.auth().currentUser.getToken(true).then(function(idToken){

        // Define payload
        var jsonPayload = new Object();
        jsonPayload.scale_factor = Number(scaleFactor);

        // Define request
        var xhr = new XMLHttpRequest();
        xhr.open('POST',
          'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images/' + image_id);
        xhr.setRequestHeader('Authorization',
          'Bearer ' + idToken);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onreadystatechange = function() {
          if (xhr.readyState == XMLHttpRequest.DONE){
              var name = resp.name;
              var image = resp.image;
              var width = resp.width;
              var height = resp.height;
              wessexsaxonics.mediaserver.setEditPageData(name, image, width, height);
              wessexsaxonics.mediaserver.loadMainPage();
              loading.style.display = "none";
          }
        };
        xhr.send(JSON.stringify(jsonPayload));
    });
}

/**
 * Deletes an image
 */
wessexsaxonics.mediaserver.deleteImage = function(image_id) {

    loading.style.display = "block";

    firebase.auth().currentUser.getToken(true).then(function(idToken){
        var xhr = new XMLHttpRequest();
        xhr.open('DELETE',
          'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images/' + image_id);
        xhr.setRequestHeader('Authorization',
          'Bearer ' + idToken);
        xhr.onreadystatechange = function() {
          if (xhr.readyState == XMLHttpRequest.DONE){
              wessexsaxonics.mediaserver.loadMainPage();
              loading.style.display = "none";
          }
        };
        xhr.send();
    });
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
    }).then(function() {
        wessexsaxonics.mediaserver.loadMainPage();
    });
  }

  gapi.client.load("wessexsaxonics", "v1", callback, 'https://backend-dot-wessex-saxonics.appspot.com/_ah/api');
};
