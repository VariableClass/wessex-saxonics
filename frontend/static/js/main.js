/**
 @fileoverview
 Provides methods to be used across the Wessex Saxonics Media Server POC UI
 */

/** Main */

// Base REST API request URL
const BASE_URL = "https://backend-dot-wessex-saxonics.appspot.com/_ah/api/wessexsaxonics/v1/";

// Namespaces for Wessex-Saxonics and the media server POC.
var wessexsaxonics = wessexsaxonics || {};
wessexsaxonics.mediaserver = wessexsaxonics.mediaserver || {};
wessexsaxonics.mediaserver.api = wessexsaxonics.mediaserver.api || {};
wessexsaxonics.mediaserver.edit = wessexsaxonics.mediaserver.edit || {};
wessexsaxonics.mediaserver.navigation = wessexsaxonics.mediaserver.navigation || {};
wessexsaxonics.mediaserver.sharedImages = wessexsaxonics.mediaserver.sharedImages || {};
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

    wessexsaxonics.mediaserver.navigation.hideAllPages();

    loadingScreen.style.display = DISPLAYED;
    loadingText.style.display = DISPLAYED;
};

// Terminates the application UI wait state
wessexsaxonics.mediaserver.endWait = function(){

    loadingScreen.style.display = HIDDEN;
    loadingText.style.display = HIDDEN;
};

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
};


// PAGES
// Hides all pages
wessexsaxonics.mediaserver.navigation.hideAllPages = function(){

    viewPage.style.display = HIDDEN;
    uploadPage.style.display = HIDDEN;
    editPage.style.display = HIDDEN;
    sharedPage.style.display = HIDDEN;
};

// Displays a single page
wessexsaxonics.mediaserver.navigation.displayPage = function(page){

    // Hide all pages
    wessexsaxonics.mediaserver.navigation.hideAllPages();

    // Display selected page
    page.style.display = DISPLAYED;
};



/** Authentication */

// Backend API key
var API_KEY = "AIzaSyCFecc5GJRVIABKtLMmCY8K-fCiamBCF2k";

// User name nav item
var userNav = document.getElementById('user');

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
};

// Firebase authentication change event
firebase.auth().onAuthStateChanged(function(user) {

    if (user) {

        path = window.location.pathname.split("/");

        if (path[1] == "share") {

            shareUserId = path[2];
            imageId = path[3];

            wessexsaxonics.mediaserver.api.confirmShare(shareUserId, imageId);
        }

        // Hide firebase container
        document.getElementById('firebase').style.display = HIDDEN;

        // Load user name into nav item
        userNav.innerHTML = user.displayName;

        // Show nav items
        uploadNav.style.display = DISPLAYED;
        editNav.style.display = DISPLAYED;
        userNav.style.display = DISPLAYED;
        sharedNav.style.display = DISPLAYED;
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
        userNav.style.display = HIDDEN;
        sharedNav.style.display = HIDDEN;
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
        xhr.open('GET', BASE_URL + 'images/' + image_id + "?key=" + API_KEY);

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // GET request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                // If request status is 404
                if (xhr.status == 200){

                    // Parse response JSON
                    resp = JSON.parse(xhr.responseText);

                    // Set Edit page data
                    wessexsaxonics.mediaserver.edit.setPageData(resp.name, resp.image, resp.width, resp.height, resp.metadata, resp.auto, resp.degreesToRotate, resp.flipv, resp.fliph, resp.owner, resp.authorised_users);

                    // Select Edit nav item
                    wessexsaxonics.mediaserver.navigation.selectNavItem(editNav);

                    // Display Edit page
                    wessexsaxonics.mediaserver.navigation.displayPage(editPage);

                } else {

                    // Alert user of request failure
                    alert("No image found for ID: " + image_id);

                    // Load main page
                    wessexsaxonics.mediaserver.view.loadPage();
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
        xhr.open('GET', BASE_URL + "images?key=" + API_KEY);

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // GET request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                // If request status is 404
                if (xhr.status == 200){

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
      var jsonPayload = {};
        jsonPayload.name = id;
        jsonPayload.image = image;
        jsonPayload.width = width;
        jsonPayload.height = height;

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new POST request
        xhr.open('POST', BASE_URL + "images?key=" + API_KEY);

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

                    // Retrieve error message
                    error = JSON.stringify(xhr.responseText);

                    // Display name in use flag
                    wessexsaxonics.mediaserver.upload.displayErrorFlag(error);

                    // Load upload page
                    wessexsaxonics.mediaserver.upload.loadPage();

                } else {    // Else if request status not 400

                    // Load main page
                    wessexsaxonics.mediaserver.view.loadPage();
                }
            }
        };

        // Send request with payload
        xhr.send(JSON.stringify(jsonPayload));
    });
};

// Edits image metadata
wessexsaxonics.mediaserver.api.editImage = function(image_id, scaleFactor, auto, degreesToRotate, flipv, fliph, authorised_users=null, owner){

    // Put UI into wait state
    wessexsaxonics.mediaserver.startWait();

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Define payload
      	var jsonPayload = {};
        jsonPayload.scale_factor = Number(scaleFactor);
        jsonPayload.auto = auto;
        jsonPayload.degreesToRotate = Number(degreesToRotate);
        jsonPayload.flipv = flipv;
        jsonPayload.fliph = fliph;
        jsonPayload.owner = owner;

        // Append authorised users if applicable
        if (authorised_users !== null){

            jsonPayload.authorised_users = authorised_users;
        }

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new POST request
        xhr.open('POST', BASE_URL + 'images/' + image_id + "?key=" + API_KEY);

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // Set POST data content type
        xhr.setRequestHeader("Content-type", "application/json");

        // POST request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                // If request status not 200
                if (xhr.status == 200){

                    // Parse response JSON
                    resp = JSON.parse(xhr.responseText);

                    // Set Edit page data
                    wessexsaxonics.mediaserver.edit.setPageData(resp.name, resp.image, resp.width, resp.height, resp.metadata, resp.auto, resp.degreesToRotate, resp.flipv, resp.fliph, resp.owner, resp.authorised_users);

                    // Select Edit nav item
                    wessexsaxonics.mediaserver.navigation.selectNavItem(editNav);

                    // Display Edit page
                    wessexsaxonics.mediaserver.navigation.displayPage(editPage);

                } else {

                    // Load upload page
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

// Deletes an image
wessexsaxonics.mediaserver.api.deleteImage = function(image_id) {

    // Put UI in wait state
    wessexsaxonics.mediaserver.startWait();

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new DELETE request
        xhr.open('DELETE', BASE_URL + 'images/' + image_id + "?key=" + API_KEY);

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
};

// Returns the share URL for an image
wessexsaxonics.mediaserver.api.getShareURL = function(image_id) {

    // Put UI into wait state
    wessexsaxonics.mediaserver.startWait();

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new GET request
        xhr.open('GET', BASE_URL + 'images/' + image_id + "/getShareURL?key=" + API_KEY);

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // GET request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                // If request status is 200
                if (xhr.status == 200){

                    // Parse response JSON
                    resp = JSON.parse(xhr.responseText);

                    // Display share URL to user
                    prompt("Share the link below with a friend and they'll be able to edit this image. This link will expire at " + resp.expiry, resp.url);

                    // Determine whether to load edit page
                    wessexsaxonics.mediaserver.edit.loadPage(image_id);

                } else {

                    // Alert user of request failure
                    alert("No image found for ID: " + image_id);

                    // Load view page
                    wessexsaxonics.mediaserver.view.loadPage();
                }

                // Terminate UI wait state
                wessexsaxonics.mediaserver.endWait();
            }
        };

        // Send request
        xhr.send();
    });
};

// Confirms share
wessexsaxonics.mediaserver.api.confirmShare = function(share_user_id, image_id){

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new GET request
        xhr.open('GET', BASE_URL + 'shared_images/' + share_user_id + "/" + image_id + "?key=" + API_KEY);

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // GET request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                // If request status is 204
                if (xhr.status == 204){

                    // Redirect to main page
                    window.location = "https://wessex-saxonics.appspot.com";

                    // Load shared images page
                    wessexsaxonics.mediaserver.sharedImages.loadPage();

                } else {    // Else if request status not 404

                    alert("Failed to confirm share");
                }

                // Terminate UI wait state
                wessexsaxonics.mediaserver.endWait();
            }
        };

        // Send request
        xhr.send();
    });
};

// Returns an image
wessexsaxonics.mediaserver.api.getSharedImage = function(image_id) {

    // Put UI into wait state
    wessexsaxonics.mediaserver.startWait();

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new GET request
        xhr.open('GET', BASE_URL + 'shared_images/' + image_id + "?key=" + API_KEY);

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
                    wessexsaxonics.mediaserver.sharedImages.loadPage();

                } else {    // Else if request status not 404

                    // Parse response JSON
                    resp = JSON.parse(xhr.responseText);

                    // Set Edit page data
                    wessexsaxonics.mediaserver.edit.setPageData(resp.name, resp.image, resp.width, resp.height, resp.metadata, resp.auto, resp.degreesToRotate, resp.flipv, resp.fliph);

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


// Lists shared user images
wessexsaxonics.mediaserver.api.listSharedImages = function() {

    // Put UI into wait state
    wessexsaxonics.mediaserver.startWait();

    // Retrieve current user token
    firebase.auth().currentUser.getToken().then(function(idToken){

        // Create new request
        var xhr = new XMLHttpRequest();

        // Open new GET request
        xhr.open('GET', BASE_URL + "shared_images?key=" + API_KEY);

        // Set authorisation header using Firebase token
        xhr.setRequestHeader('Authorization', 'Bearer ' + idToken);

        // GET request state change callback event
        xhr.onreadystatechange = function() {

            // If request has completed
            if (xhr.readyState == XMLHttpRequest.DONE){

                if (xhr.status == 200) {

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

                            wessexsaxonics.mediaserver.sharedImages.addImageToGrid(name, image, width, height);
                        }

                    }

                } else {

                    // Display no images message
                    wessexsaxonics.mediaserver.sharedImages.setNoImagesMsg();
                }

                // Terminate UI wait state
                wessexsaxonics.mediaserver.endWait();
            }
        };

        // Send request
        xhr.send();
    });
};



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
};

// View page
var viewPage = document.getElementById('view-page');

// Fetches page data, then loads
wessexsaxonics.mediaserver.view.loadPage = function(){

    // Clear all currently displayed images
    wessexsaxonics.mediaserver.view.clearPageData();

    // Display all user images once page has loaded
    wessexsaxonics.mediaserver.api.listImages();

    // Select View nav item
    wessexsaxonics.mediaserver.navigation.selectNavItem(viewNav);

    // Display View page
    wessexsaxonics.mediaserver.navigation.displayPage(viewPage);
};


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
    html_image.addEventListener("click", function(){

        wessexsaxonics.mediaserver.edit.loadPage(name);
    }, false);

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
    imagesGrid.appendChild(noImages);
};

// Clear images from image grid
wessexsaxonics.mediaserver.view.clearPageData = function(){

    // While there are items to remove
    while (imagesGrid.firstChild) {

        // Remove first item
        imagesGrid.removeChild(imagesGrid.firstChild);
    }
};



/** Upload Page */

// Upload nav item
var uploadNav = document.getElementById('upload');

// Upload nav item onclick event
uploadNav.onclick = function(){

    // Determine if user is signed in
    if (firebase.auth().currentUser) {

        wessexsaxonics.mediaserver.upload.loadPage();
    }
};

// Upload page
var uploadPage = document.getElementById('upload-page');

// Fetches page data, then loads
wessexsaxonics.mediaserver.upload.loadPage = function(){

    // Clears form
    wessexsaxonics.mediaserver.view.clearPageData();

    // Select Upload nav item
    wessexsaxonics.mediaserver.navigation.selectNavItem(uploadNav);

    // Display Upload page
    wessexsaxonics.mediaserver.navigation.displayPage(uploadPage);
};


// Upload image form
var uploadForm = document.getElementById('upload-form');

// Upload error tag
var errorFlag = document.getElementById('error-flag');

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
        var img = new Image();

        // Image onload event
        img.onload = function() {

            // Perform API upload, using image width and height attributes
            wessexsaxonics.mediaserver.api.uploadImage(name, imageFile, img.width, img.height);

            // Clear form
            wessexsaxonics.mediaserver.upload.clearPageData();
        };

        // Load image source, initiating callback event
        img.src = imageFile;
    };

    // If file uploaded, read in file, initiating callback event
    if (file) {

        reader.readAsDataURL(file);
    }
};

// Sets error flag to displayed
wessexsaxonics.mediaserver.upload.displayErrorFlag = function(error) {

    errorFlag.innerHTML = error;
    errorFlag.style.display = DISPLAYED;
};

// Clear images from image grid
wessexsaxonics.mediaserver.upload.clearPageData = function() {

    // Reset form
    uploadForm.reset();

    // Hide alert tag
    errorFlag.style.display = HIDDEN;
};



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
};

// Edit page
var editPage = document.getElementById('edit-page');

// Fetches page data, then determines whether to load
wessexsaxonics.mediaserver.edit.loadPage = function(imageId, shared=false){

    // Clears page of data
    wessexsaxonics.mediaserver.edit.clearPageData();

    if (shared) {

        // Determines whether to load edit page with a retrieved shared image or fail and return
        wessexsaxonics.mediaserver.api.getSharedImage(imageId);

    } else {

        // Determines whether to load edit page with a retrieved image or fail and return
        wessexsaxonics.mediaserver.api.getImage(imageId);
    }
};


// Edit page title
var editTitle = document.getElementById("edit-title");

// Image ID of currently selected image
var imageId = document.getElementById("image-id");

// Edit form
var editForm = document.getElementById('edit-form');

// Metadata div
var metadataDiv = document.getElementById('metadata');

// Get auto fix from form
var autoFix = document.getElementById('auto-fix');

// Form scale factor input element
var scaleFactor = document.getElementById('scale-factor');

// Get degrees to rotate from form
var degreesToRotate = document.getElementById('degrees-to-rotate');

// Get auto fix from form
var flipVertically = document.getElementById('flip-vertically');

// Get auto fix from form
var flipHorizontally = document.getElementById('flip-horizontally');

// Edit form onsubmit event
editForm.onsubmit = function(){

    // Retrieve all remaining authorised users
    authedUsers = []

    var children = authorisedUsers.children;
    for (var i = 0; i < children.length; i++) {

        authedUsers.push(children[i].id);
    }

    // Submit API call passing image ID and scale factor
    wessexsaxonics.mediaserver.api.editImage(imageId.value, scaleFactor.value, autoFix.checked, degreesToRotate.value, flipVertically.checked, flipHorizontally.checked, authedUsers, globalOwner);

    // Clear page
    wessexsaxonics.mediaserver.edit.clearPageData();
};

// Variable to hold owner if current user
var globalOwner = "";

// Image element
var html_image = document.getElementById("edit-image");

// Share image link
var shareLink = document.getElementById("share-image");

// Delete image link
var deleteLink = document.getElementById("delete-image");

// Authorised users list
var authorisedUsers = document.getElementById("authorised-users");

// Populates page with data
wessexsaxonics.mediaserver.edit.setPageData = function(name, image, width, height, metadata, auto, rotatedDegrees, flipv, fliph, owner, authorised_users=null){

    // Update global owner variable
    globalOwner = owner;

    // Set title
    editTitle.innerHTML = "Editing " + name;

    // Set imageId element
    imageId.value = name;

    // Set auto fix checkbox
    autoFix.checked = auto;

    // Set scale factor value to default
    scaleFactor.value = 100;

    // Populate metadata with appropriate fields
    metadataDiv.appendChild(wessexsaxonics.mediaserver.edit.generateMetadataFields(metadata));

    // Set degrees rotated value
    degreesToRotate.value = Number(rotatedDegrees);

    // Set vertical and horizontal flip checkboxes
    flipVertically.checked = flipv;
    flipHorizontally.checked = fliph;

    // Delete link onclick event
    deleteLink.onclick = function() {

        wessexsaxonics.mediaserver.api.deleteImage(name);
    };

    // If owner, display share link
    if (owner == firebase.auth().currentUser.uid){

        // Display share link
        shareLink.style.display = DISPLAYED;

        // Share link onclick event
        shareLink.onclick = function() {

            wessexsaxonics.mediaserver.api.getShareURL(name);
        };
    }

    // If authorised users has been passed in
    if (authorised_users !== null) {

        // Generate authorised users list
        authorisedUsers.appendChild(wessexsaxonics.mediaserver.edit.generateAuthorisedUsers(authorised_users));
    }

    // Set image properties
    html_image.src = image;
    html_image.alt = name;
    html_image.width = width;
    html_image.height = height;
};

// Clears page of data
wessexsaxonics.mediaserver.edit.clearPageData = function() {

    // Clear title
    editTitle.innerHTML = "Editing {0}";

    // Clear imageId element
    imageId.value = "";

    // If items have been loaded
    if (metadataDiv.childNodes.length > 1){

        // Remove metadata items div
        metadataDiv.removeChild(metadataDiv.lastChild);
    }

    // If users have been loaded
    if (authorisedUsers.childNodes.length > 1){

        // Remove metadata items div
        authorisedUsers.removeChild(authorisedUsers.lastChild);
    }

    // Clear form
    editForm.reset();

    // Clear onclick event from delete link
    deleteLink.onclick = function(){};

    // Clear image
    html_image.src = "";
    html_image.alt = "";
    html_image.width = 0;
    html_image.height = 0;
};


wessexsaxonics.mediaserver.edit.generateAuthorisedUsers = function(authorised_users) {

    // Create a div to append edit fields to
    var div = document.createElement('div');

    // For each metadata item
    for (var i = 0, len = authorised_users.length; i < len; ++i) {

        // Get JSON key
        user = authorised_users[i];

        // Create a metadata item
        div.appendChild(wessexsaxonics.mediaserver.edit.buildUserItem(user));
    }

    return div
};

// Returns a div containing authorised users and deletion links
wessexsaxonics.mediaserver.edit.buildUserItem = function(user) {

    // Create form to hold label and button
    var userForm = document.createElement('form');
    userForm.id = user;

    // On button click event
    userForm.onsubmit = function() {

        userForm.parentNode.removeChild(userForm);
    }

    // Create label to identify user
    var label = document.createElement('label');
    label.innerHTML = user;
    label.className = "label";

    // Create delete user button
    var deleteUser = document.createElement('button');
    deleteUser.innerHTML = "Remove";

    // Append label and value to div
    userForm.appendChild(label);
    userForm.appendChild(deleteUser);

    return userForm;
}

// Returns a div containing metadata editing fields
wessexsaxonics.mediaserver.edit.generateMetadataFields = function(metadata) {

    // Retrieve JSON object from string
    var metadataJson = JSON.parse(metadata);

    // Create a div to append edit fields to
    var div = document.createElement('div');

    // For each metadata item
    for (var i = 0, len = Object.keys(metadataJson).length; i < len; ++i) {

        // Get JSON key
        key = Object.keys(metadataJson)[i];

        // Create a metadata item
        div.appendChild(wessexsaxonics.mediaserver.edit.buildMetadataItem(key, metadataJson[key]));
    }

    return div;
};

wessexsaxonics.mediaserver.edit.buildMetadataItem = function(key, value){

    // Create div to hold label and metadata
    var metadataItem = document.createElement('div');

    // Create label to identify metadata item
    var label = document.createElement('small');
    label.innerHTML = key + ":";
    label.className = "label";

    // Create metadata value item
    var metadataValue = document.createElement('small');
    metadataValue.id = key;
    metadataValue.className = "value";
    metadataValue.innerHTML = "<b>" + value + "</b>";

    // Append label and value to div
    metadataItem.appendChild(label);
    metadataItem.appendChild(metadataValue);

    return metadataItem;
};



/** Shared Images Page */

// Shared Images nav item
var sharedNav = document.getElementById('shared');

// Shared Images nav item onclick event
sharedNav.onclick = function(){

    // Determine if user is signed in
    if (firebase.auth().currentUser) {

        // Load view page
        wessexsaxonics.mediaserver.sharedImages.loadPage();
    }
};

// Shared Images page
var sharedPage = document.getElementById('shared-page');

// Fetches page data, then loads
wessexsaxonics.mediaserver.sharedImages.loadPage = function(){

    // Clear all currently displayed images
    wessexsaxonics.mediaserver.sharedImages.clearPageData();

    // Display all shared images once page has loaded
    wessexsaxonics.mediaserver.api.listSharedImages();

    // Select Shared Images nav item
    wessexsaxonics.mediaserver.navigation.selectNavItem(sharedNav);

    // Display Shared Images page
    wessexsaxonics.mediaserver.navigation.displayPage(sharedPage);
};


// Shared images grid
var sharedImagesGrid = document.getElementById("shared-images");

// Adds a shared image to the shared image grid
wessexsaxonics.mediaserver.sharedImages.addImageToGrid = function(name, image, width, height) {

    // Create parent div
    var imageDiv = document.createElement("div");
    imageDiv.className = "float-image";

    // Create new image using retrieved data, of fixed width 200
    var html_image = document.createElement("img");
    html_image.src = image;
    html_image.alt = name;
    html_image.width = 200;
    html_image.addEventListener("click", function(){

        wessexsaxonics.mediaserver.edit.loadPage(name, true);
    }, false);

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

        wessexsaxonics.mediaserver.edit.loadPage(name, true);
    }, false);

    // Append text elements to label div
    labelDiv.appendChild(nameLabel);
    labelDiv.appendChild(dimensionsLabel);
    labelDiv.appendChild(editLink);

    // Append image and label div to parent div
    imageDiv.appendChild(html_image);
    imageDiv.appendChild(labelDiv);

    // Append parent div to grid div
    sharedImagesGrid.appendChild(imageDiv);
};

// Displays no images
wessexsaxonics.mediaserver.sharedImages.setNoImagesMsg = function(){

    // Empty shared image grid
    wessexsaxonics.mediaserver.sharedImages.clearPageData();

    // Create no images message
    var noImages = document.createElement("p");
    noImages.innerHTML = "No images to display";

    // Add no images message to display grid
    sharedImagesGrid.appendChild(noImages);
};

// Clear images from shared image grid
wessexsaxonics.mediaserver.sharedImages.clearPageData = function(){

    // While there are items to remove
    while (sharedImagesGrid.firstChild) {

        // Remove first item
        sharedImagesGrid.removeChild(sharedImagesGrid.firstChild);
    }
};
