let editMode = "create";

let currentImageId = null;

let currentImageFilename = null;

let currentPreviewImage = null;

function resetEditState() {
    editMode = "create";
    currentImageId = null;
    currentImageFilename = null;
    currentPreviewImage = null;
}

function setEditMode(imageId, imageFilename) {
    editMode = "edit";
    currentImageId = imageId;
    currentImageFilename = imageFilename;
}

function setCreateMode() {
    editMode = "create";
    currentImageId = null;
    currentImageFilename = null;
}

function isEditing() {
    return editMode === "edit" && currentImageId !== null;
}

function getImageId() {
    return isEditing() ? currentImageId : null;
}

function getImageFilename() {
    return currentImageFilename || null;
}

function setPreviewImage(image) {
    currentPreviewImage = image;
}

function getPreviewImage() {
    return currentPreviewImage;
}

function clearPreviewImage() {
    currentPreviewImage = null;
}

const editState = {
    mode: "create",
    imageId: null,
    imageFilename: null,
    currentPreviewImage: null,
    reset: resetEditState,
    setEditMode: setEditMode,
    setCreateMode: setCreateMode,
    isEditing: isEditing,
    getImageId: getImageId,
    getImageFilename: getImageFilename,
    setPreviewImage: setPreviewImage,
    getPreviewImage: getPreviewImage,
    clearPreviewImage: clearPreviewImage
};

Object.defineProperty(editState, "mode", {
    get: () => editMode
});

Object.defineProperty(editState, "imageId", {
    get: () => currentImageId
});

Object.defineProperty(editState, "imageFilename", {
    get: () => currentImageFilename
});

Object.defineProperty(editState, "currentPreviewImage", {
    get: () => currentPreviewImage
});

window.editState = editState;