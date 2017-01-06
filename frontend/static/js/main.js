/**
 @fileoverview
 Provides methods to be used across the Wessex Saxonics Media Server POC UI
 */

/** Main */

// Namespaces for Wessex-Saxonics and the media server POC.
var wessexsaxonics = wessexsaxonics || {};
wessexsaxonics.mediaserver = wessexsaxonics.mediaserver || {};
wessexsaxonics.mediaserver.api = wessexsaxonics.mediaserver.api || {};
wessexsaxonics.mediaserver.edit = wessexsaxonics.mediaserver.edit || {};
wessexsaxonics.mediaserver.navigation = wessexsaxonics.mediaserver.navigation || {};
wessexsaxonics.mediaserver.upload = wessexsaxonics.mediaserver.upload || {};
wessexsaxonics.mediaserver.view = wessexsaxonics.mediaserver.view || {};

// To be used in setting the currently selected nav item
const ACTIVE = "active";

// To be used in setting the currently displayed page
const DISPLAYED = "block";
const HIDDEN = "none";

// Element to display whenever a operation requires the user to wait
var loadingScreen = document.getElementById('loading-screen');
var loadingText = document.getElementById('loading-text');

// Puts the application UI into a wait state
wessexsaxonics.mediaserver.startWait = function(){

    loadingScreen.style.display = DISPLAYED;
    loadingText.style.display = DISPLAYED;
}

// Terminates the application UI wait state
wessexsaxonics.mediaserver.endWait = function(){

    loadingScreen.style.display = HIDDEN;
    loadingText.style.display = HIDDEN;
}

// Initialises the application
wessexsaxonics.mediaserver.init = function() {

    // Determine if user is signed in
    if (firebase.auth().currentUser) {

        // Load View page if so
        wessexsaxonics.mediaserver.view.loadPage();

    }
};



/** Navigation */

// NAV ITEMS
// Deselects all nav items
wessexsaxonics.mediaserver.navigation.deselectAllNavItems = function(){
    var activeNavItems = document.getElementsByClassName(ACTIVE);

    for (var i = 0; i < activeNavItems.length; i++) {
       activeNavItems[i].classList.remove(ACTIVE);
    }
};

// Selects a single nav item
wessexsaxonics.mediaserver.navigation.selectNavItem = function(navItem){

    // Deselct all nav items
    wessexsaxonics.mediaserver.navigation.deselectAllNavItems();

    // Select nav item
    navItem.className = ACTIVE;
}


// PAGES
// Hides all pages
wessexsaxonics.mediaserver.navigation.hideAllPages = function(){

    viewPage.style.display = HIDDEN;
    uploadPage.style.display = HIDDEN;
    editPage.style.display = HIDDEN;
}

// Displays a single page
wessexsaxonics.mediaserver.navigation.displayPage = function(page){

    // Hide all pages
    wessexsaxonics.mediaserver.navigation.hideAllPages();

    // Display selected page
    page.style.display = DISPLAYED;
}



/** Authentication */

// Signout nav item
var signoutNav = document.getElementById('sign-out');

// Signout nav item onclick event
signoutNav.onclick = function(){

    // Select signout nav item
    wessexsaxonics.mediaserver.navigation.selectNavItem(signoutNav);

    // Hide all pages
    wessexsaxonics.mediaserver.navigation.hideAllPages();

    // Perform signout
    firebase.auth().signOut();
}

// Firebase authentication change event
firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        // Hide firebase container
        document.getElementById('firebase').style.display = HIDDEN;

        // Hide nav items
        uploadNav.style.display = DISPLAYED;
        editNav.style.display = DISPLAYED;
        signoutNav.style.display = DISPLAYED;

        // Load view page
        wessexsaxonics.mediaserver.view.loadPage();

        } else {

        // Show firebase container
        document.getElementById('firebase').style.display = DISPLAYED;

        // Deselect all nav items
        wessexsaxonics.mediaserver.navigation.deselectAllNavItems();

        // Hide nav items
        uploadNav.style.display = HIDDEN;
        editNav.style.display = HIDDEN;
        signoutNav.style.display = HIDDEN;

        // Hide all pages
        wessexsaxonics.mediaserver.navigation.hideAllPages();
    }
});



/** API Calls */

// Returns an image
wessexsaxonics.mediaserver.api.getImage = function(image_id) {

    // Put UI into wait state
    wessexsaxonics.mediaserver.startWait();

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new GET request
        xhr.open('GET', 'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images/' + image_id);

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // GET request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                // If request status is 404
                if (xhr.status == 404){

                    // Alert user of request failure
                    alert("No image found for ID: " + image_id);

                    // Load main page
                    wessexsaxonics.mediaserver.view.loadPage();

                } else {    // Else if request status not 404

                    // Parse response JSON
                    resp = JSON.parse(xhr.responseText);

                    // Set Edit page data
                    wessexsaxonics.mediaserver.edit.setPageData(resp.name, resp.image, resp.width, resp.height);

                    // Select Edit nav item
                    wessexsaxonics.mediaserver.navigation.selectNavItem(editNav);

                    // Display Edit page
                    wessexsaxonics.mediaserver.navigation.displayPage(editPage);
                }

                // Terminate UI wait state
                wessexsaxonics.mediaserver.endWait();
            }
        };

        // Send request
        xhr.send();
    });
};

// Lists user images
wessexsaxonics.mediaserver.api.listImages = function() {

    // Put UI into wait state
    wessexsaxonics.mediaserver.startWait();

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new GET request
        xhr.open('GET', 'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images');

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // GET request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                // Parse response JSON
                resp = JSON.parse(xhr.responseText);
                resp.items = resp.items || [];

                // If items returned
                if (resp.items.length > 0) {

                    // Iterate through each one and display it
                    for (var i = 0; i < resp.items.length; i++) {

                        var name = resp.items[i].name;
                        var image = resp.items[i].image;
                        var width = resp.items[i].width;
                        var height = resp.items[i].height;

                        wessexsaxonics.mediaserver.view.addImageToGrid(name, image, width, height);
                    }

                } else {    // Else if no items returned

                    // Display no images message
                    wessexsaxonics.mediaserver.view.setNoImagesMsg();
              }

              // Terminate UI wait state
              wessexsaxonics.mediaserver.endWait();
          }
        };

        // Send request
        xhr.send();
    });
};

// Uploads new image
wessexsaxonics.mediaserver.api.uploadImage = function(id, image, width, height) {

    // Put UI into wait state
    wessexsaxonics.mediaserver.startWait();

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Define payload
        var jsonPayload = new Object();
        jsonPayload.name = id;
        jsonPayload.image = image;
        jsonPayload.width = width;
        jsonPayload.height = height;

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new POST request
        xhr.open('POST', 'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images');

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // Set POST data content type
        xhr.setRequestHeader("Content-type", "application/json");

        // POST request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                // If request status is 400
                if (xhr.status == 400){

                    // Display name in use flag
                    wessexsaxonics.mediaserver.upload.displayNameInUseFlag();

                    // Load upload page
                    wessexsaxonics.mediaserver.upload.loadPage();

                } else {    // Else if request status not 400

                    // Load main page
                    wessexsaxonics.mediaserver.view.loadPage();
                }

                // Terminate UI wait state
                wessexsaxonics.mediaserver.endWait();
            }
        };

        // Send request with payload
        xhr.send(JSON.stringify(jsonPayload));
    });
};

// Edits image metadata
wessexsaxonics.mediaserver.api.editImage = function(image_id, scaleFactor){

    // Put UI in wait state
    wessexsaxonics.mediaserver.startWait();

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Define payload
        var jsonPayload = new Object();
        jsonPayload.scale_factor = Number(scaleFactor);

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new POST request
        xhr.open('POST', 'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images/' + image_id);

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // Set POST data content type
        xhr.setRequestHeader("Content-type", "application/json");

        // POST request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                // Load main page
                wessexsaxonics.mediaserver.view.loadPage();

                // Terminate UI wait state
                wessexsaxonics.mediaserver.endWait();
            }
        };

        // Send request with payload
        xhr.send(JSON.stringify(jsonPayload));
    });
}

// Deletes an image
wessexsaxonics.mediaserver.api.deleteImage = function(image_id) {

    // Put UI in wait state
    wessexsaxonics.mediaserver.startWait();

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new DELETE request
        xhr.open('DELETE', 'https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/images/' + image_id);

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // DELETE request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                // Load main page
                wessexsaxonics.mediaserver.view.loadPage();

                // Terminate UI wait state
                wessexsaxonics.mediaserver.endWait();
            }
        };

        // Send request
        xhr.send();
    });
}



/** View Page */

// View nav item
var viewNav = document.getElementById('home');

// View nav item onclick event
viewNav.onclick = function(){

    // Determine if user is signed in
    if (firebase.auth().currentUser) {

        // Load view page
        wessexsaxonics.mediaserver.view.loadPage();
    }
}

// View page
var viewPage = document.getElementById('view-page');

// Fetches page data, then loads
wessexsaxonics.mediaserver.view.loadPage = function(){

    // Clear any existing wait
    wessexsaxonics.mediaserver.endWait();

    // Clear all currently displayed images
    wessexsaxonics.mediaserver.view.clearPageData()

    // Display all user images once page has loaded
    wessexsaxonics.mediaserver.api.listImages();

    // Select View nav item
    wessexsaxonics.mediaserver.navigation.selectNavItem(viewNav);

    // Display View page
    wessexsaxonics.mediaserver.navigation.displayPage(viewPage);
}


// Images grid
var imagesGrid = document.getElementById("images");

// Adds an image to the image grid
wessexsaxonics.mediaserver.view.addImageToGrid = function(name, image, width, height) {

    // Create parent div
    var imageDiv = document.createElement("div");
    imageDiv.className = "float-image";

    // Create new image using retrieved data, of fixed width 200
    var html_image = document.createElement("img");
    html_image.src = image;
    html_image.alt = name;
    html_image.width = 200;

    // Create labels div
    var labelDiv = document.createElement("div");

    // Create label with image name
    var nameLabel = document.createElement("p");
    nameLabel.innerHTML = "ID: <b>" + name + "</b>";

    // Create label with image dimensions
    var dimensionsLabel = document.createElement("p");
    dimensionsLabel.innerHTML = "Width: <b>" + width + "</b>, Height: <b>" + height + "</b>";

    // Create anchor with link to edit image
    var editLink = document.createElement("a");
    editLink.innerHTML = "Edit";
    editLink.href = "javascript:void(0)";
    editLink.addEventListener("click", function(){

        wessexsaxonics.mediaserver.edit.loadPage(name);
    }, false);

    // Append text elements to label div
    labelDiv.appendChild(nameLabel);
    labelDiv.appendChild(dimensionsLabel);
    labelDiv.appendChild(editLink);

    // Append image and label div to parent div
    imageDiv.appendChild(html_image);
    imageDiv.appendChild(labelDiv);

    // Append parent div to grid div
    imagesGrid.appendChild(imageDiv);
};

// Displays no images
wessexsaxonics.mediaserver.view.setNoImagesMsg = function(){

    // Empty image grid
    wessexsaxonics.mediaserver.view.clearPageData();

    // Create no images message
    var noImages = document.createElement("p");
    noImages.innerHTML = "No images to display";

    // Add no images message to display grid
    document.getElementById("images").appendChild(noImages);
}

// Clear images from image grid
wessexsaxonics.mediaserver.view.clearPageData = function(){

    // While there are items to remove
    while (imagesGrid.firstChild) {

        // Remove first item
        imagesGrid.removeChild(imagesGrid.firstChild);
    }
}



/** Upload Page */

// Upload nav item
var uploadNav = document.getElementById('upload');

// Upload nav item onclick event
uploadNav.onclick = function(){

    // Determine if user is signed in
    if (firebase.auth().currentUser) {

        wessexsaxonics.mediaserver.upload.loadPage();
    }
}

// Upload page
var uploadPage = document.getElementById('upload-page');

// Fetches page data, then loads
wessexsaxonics.mediaserver.upload.loadPage = function(){

    // Clears form
    wessexsaxonics.mediaserver.view.clearPageData()

    // Select Upload nav item
    wessexsaxonics.mediaserver.navigation.selectNavItem(uploadNav);

    // Display Upload page
    wessexsaxonics.mediaserver.navigation.displayPage(uploadPage);
}


// Upload image form
var uploadForm = document.getElementById('upload-form');

// Alert tag describing image name already taken
var nameInUse = document.getElementById('name-in-use');

// Upload image form onsubmit event
uploadForm.onsubmit = function(){

    // Retrieve uploaded file
    var file = document.querySelector('input[type=file]').files[0];

    // Initialise new FileReader
    var reader = new FileReader();

    // On new FileReader
    reader.onload = function () {

        // Retrieve file name
        var name = document.getElementById('image_name').value;

        // Read in file
        var imageFile = reader.result;

        // Initialise new image from which to retrieve width and height attributes
        var img = new Image;

        // Image onload event
        img.onload = function() {

            // Perform API upload, using image width and height attributes
            wessexsaxonics.mediaserver.api.uploadImage(name, imageFile, img.width, img.height);

            // Clear form
            wessexsaxonics.mediaserver.upload.clearPageData();
        }

        // Load image source, initiating callback event
        img.src = imageFile;
    };

    // If file uploaded, read in file, initiating callback event
    if (file) {

        reader.readAsDataURL(file);
    }
}

// Sets name in use flag to displayed
wessexsaxonics.mediaserver.upload.displayNameInUseFlag = function() {

    nameInUse.style.display = DISPLAYED;
}

// Clear images from image grid
wessexsaxonics.mediaserver.upload.clearPageData = function() {

    // Reset form
    uploadForm.reset();

    // Hide alert tag
    nameInUse.style.display = HIDDEN;
}



/** Edit Page */

// Edit nav item
var editNav = document.getElementById('edit');

// Edit nav item onclick event
editNav.onclick = function(){

    // Determine if user is signed in
    if (firebase.auth().currentUser) {

        // Prompt user for image ID to edit
        var image_id = window.prompt("Please enter the ID of the image you wish to edit");

        // Determine whether to load edit page
        wessexsaxonics.mediaserver.edit.loadPage(image_id);
    }
}

// Edit page
var editPage = document.getElementById('edit-page');

// Fetches page data, then determines whether to load
wessexsaxonics.mediaserver.edit.loadPage = function(imageId){

    // Clears page of data
    wessexsaxonics.mediaserver.edit.clearPageData();

    // Determines whether to load edit page with a retrieved image or fail and return
    wessexsaxonics.mediaserver.api.getImage(imageId);
}


// Edit page title
var editTitle = document.getElementById("edit-title");

// Image ID of currently selected image
var imageId = document.getElementById("image-id");

// Edit form
var editForm = document.getElementById('edit-form');

// Edit form onsubmit event
editForm.onsubmit = function(){

    // Get image ID from form
    var imageId = document.getElementById('image-id').value;

    // Get scale factor from form
    var scaleFactor = document.getElementById('scale-factor').value;

    // Submit API call passing image ID and scale factor
    wessexsaxonics.mediaserver.api.editImage(imageId, scaleFactor);

    // Clear page
    wessexsaxonics.mediaserver.edit.clearPageData();
}

// Image element
var html_image = document.getElementById("edit-image");

// Delete image link
var deleteLink = document.getElementById("delete-image");

// Populates page with data
wessexsaxonics.mediaserver.edit.setPageData = function(name, image, width, height){

    // Set title
    editTitle.innerHTML = "Editing " + name;

    // Set imageId element
    imageId.value = name;

    // Delete link onclick event
    deleteLink.onclick = function() {

        wessexsaxonics.mediaserver.api.deleteImage(name);
    };

    // Set image properties
    html_image.src = image;
    html_image.alt = name;
    html_image.width = width;
    html_image.height = height;
}

// Clears page of data
wessexsaxonics.mediaserver.edit.clearPageData = function() {

    // Clear title
    editTitle.innerHTML = "Editing {0}"

    // Clear imageId element
    imageId.value = "";

    // Clear form
    editForm.reset();

    // Clear onclick event from delete link
    deleteLink.onclick = function(){};

    // Clear image
    html_image.src = "";
    html_image.alt = "";
    html_image.width = 0;
    html_image.height = 0;
}
