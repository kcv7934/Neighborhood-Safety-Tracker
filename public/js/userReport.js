const createForm = document.getElementById("create-user-report-form");
const editForm = document.getElementById("edit-user-report-form");
const deleteButton = document.getElementById("delete-user-report-button");

const getUserReportFormData = (form) => {
  const category = form.elements.category.value.trim();
  const address = form.elements.address.value.trim();
  const borough = form.elements.borough.value.trim();
  const description = form.elements.description.value.trim();

  if (!category) throw "You must select a category";

  if (!address) throw "You must provide an address";

  if (address.length > 50) throw "Address cannot be more than 50 characters";

  if (!borough) throw "You must select a borough";

  if (description.length < 10)
    throw "Description must be at least 10 characters";

  if (description.length > 500)
    throw "Description cannot be more than 500 characters";

  return { category, address, borough, description };
};

const displayFormErrorMessage = (error, messageElement, providedMessage) => {
  if (e.response && e.response.data && e.response.data.error) {
    messageElement.textContent = error.response.data.error;
  } else if (typeof error === "string") {
    messageElement.textContent = error;
  } else {
    console.error(error);
    messageElement.textContent = providedMessage;
  }

  messageElement.hidden = false;
};

const createUserReport = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;

  const message = document.getElementById("form-message");

  message.hidden = true;
  message.textContent = "";

  try {
    const userReportData = getUserReportFormData(form);

    const response = await axios.post("/user-reports", userReportData);

    const reportId = response.data._id;

    window.location.href = `/user-reports/${reportId}?created=true`;
  } catch (error) {
    displayFormErrorMessage(error, message, "Could not create user report");
  }
};

const editUserReport = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const message = document.getElementById("form-message");

  message.hidden = true;
  message.textContent = "";

  try {
    const reportId = form.elements.reportId.value;
    const userReportData = getUserReportFormData(form);

    await axios.patch(`/user-reports/${reportId}`, userReportData);

    window.location.href = `/user-reports/${reportId}?updated=true`;
  } catch (error) {
    displayFormErrorMessage(error, message, "Could not update user report");
  }
};

const deleteUserReport = async () => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this report?",
  );

  if (!confirmed) return;

  const reportId = deleteButton.value;

  const message = document.getElementById("delete-message");

  message.hidden = true;
  message.textContent = "";

  try {
    await axios.delete(`/user-reports/${reportId}`);

    window.location.href = "/user-reports/my-reports?deleted=true";
  } catch (error) {
    displayFormErrorMessage(error, message, "Could not delete user report");
  }
};

if (createForm) {
  createForm.addEventListener("submit", createUserReport);
}

if (editForm) {
  editForm.addEventListener("submit", editUserReport);
}

if (deleteButton) {
  deleteButton.addEventListener("click", deleteUserReport);
}
