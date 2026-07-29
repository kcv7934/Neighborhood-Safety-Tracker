const createForm = document.getElementById("create-saved-location-form");

const getSavedLocationFormData = (form) => {
  const label = form.elements.label.value.trim();
  const address = form.elements.address.value.trim();
  const borough = form.elements.borough.value.trim();
  const tagsInput = form.elements.tags.value.trim();

  if (!label) throw "You must provide a label";

  if (label.length > 50) throw "You must provide a label";

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

const displayFormErrorMessage = (error, messageElement) => {
  if (error.response?.data?.error) {
    messageElement.textContent = error.response.data.error;
  } else if (typeof error === "string") {
    messageElement.textContent = error;
  } else {
    console.error(error);
    messageElement.textContent = "Could not save location";
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
    displayFormErrorMessage(error, message);
  }
};

if (createForm) {
  createForm.addEventListener("submit", createSavedLocation);
}
