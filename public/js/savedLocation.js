const createForm = document.getElementById("create-saved-location-form");
const editForm = document.getElementById("edit-saved-location-form");
const deleteButton = document.getElementById("delete-saved-location-button");

const getSavedLocationFormData = (form) => {
  const label = form.elements.label.value.trim();
  const address = form.elements.address.value.trim();
  const borough = form.elements.borough.value.trim();
  const tagsInput = form.elements.tags.value.trim();

  if (!label) throw "You must provide a label";

  if (label.length > 50) throw "Label cannot be more than 50 characters";

  if (!address) throw "You must provide an address";

  if (address.length > 50) throw "Address cannot be more than 50 characters";

  if (!borough) throw "You must select a borough";

  let tags;
  if (tagsInput.length === 0) {
    tags = [];
  } else {
    tags = tagsInput.split(",").map((tag) => tag.trim());
  }

  if (tags.length > 10) throw "Tags must contain at most 10 items";

  const tagCandidates = new Set();

  for (const tag of tags) {
    if (!tag) throw "Tags cannot be empty";

    if (tag.length > 25) throw "A tag cannot be more than 25 characters";

    if (!/^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/.test(tag))
      throw "Tags may only contain letters, numbers, and single spaces";

    const cleanedTag = tag.toLowerCase();

    if (tagCandidates.has(cleanedTag)) throw "Tags must be unique";

    tagCandidates.add(cleanedTag);
  }

  return {
    label,
    address,
    borough,
    tags,
  };
};

const displayFormErrorMessage = (error, messageElement, providedMessage) => {
  if (error.response?.data?.error) {
    messageElement.textContent = error.response.data.error;
  } else if (typeof error === "string") {
    messageElement.textContent = error;
  } else {
    console.error(error);
    messageElement.textContent = providedMessage;
  }

  messageElement.hidden = false;
};

const createSavedLocation = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;

  const message = document.getElementById("form-message");

  message.hidden = true;
  message.textContent = "";

  try {
    const savedLocationData = getSavedLocationFormData(form);

    await axios.post("/saved-locations", savedLocationData);

    window.location.href = "/saved-locations/my-locations?created=true";
  } catch (error) {
    displayFormErrorMessage(error, message, "Could not create saved location");
  }
};

const editSavedLocation = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;

  const message = document.getElementById("form-message");

  message.hidden = true;
  message.textContent = "";

  try {
    const savedLocationId = form.elements.savedLocationId.value;

    const savedLocationData = getSavedLocationFormData(form);

    await axios.patch(`/saved-locations/${savedLocationId}`, savedLocationData);

    window.location.href = `/saved-locations/${savedLocationId}?updated=true`;
  } catch (error) {
    displayFormErrorMessage(error, message, "Could not update saved location");
  }
};

const deleteSavedLocation = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this saved location",
  );

  if (!confirmed) return;

  const savedLocationId = deleteButton.value;

  const message = document.getElementById("delete-message");

  message.hidden = true;
  message.textContent = "";

  try {
    await axios.delete(`/saved-locations/${savedLocationId}`);

    window.location.href = "/saved-locations/my-locations?deleted=true";
  } catch (error) {
    displayFormErrorMessage(error, message, "Could not delete saved location");
  }
};

if (createForm) {
  createForm.addEventListener("submit", createSavedLocation);
}

if (editForm) {
  editForm.addEventListener("submit", editSavedLocation);
}

if (deleteButton) {
  deleteButton.addEventListener("click", deleteSavedLocation);
}
