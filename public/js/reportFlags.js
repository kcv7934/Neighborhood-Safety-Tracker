const flagButton = document.getElementById("flag-report-button");

const displayFlagErrorMessage = (error, messageElement, providedMessage) => {
  if (error.response && error.response.data && error.response.data.error) {
    messageElement.textContent = error.response.data.error;
  } else if (typeof error === "string") {
    messageElement.textContent = error;
  } else {
    console.error(error);
    messageElement.textContent = providedMessage;
  }

  messageElement.hidden = false;
};

const flagReport = async () => {
  const reportId = flagButton.value;
  const reason = document.getElementById("flag-reason");
  const message = document.getElementById("report-flag-message");

  message.hidden = true;
  message.textContent = "";

  try {
    const reasonValue = reason.value;

    if (!reasonValue) throw "You must select a reason";

    const response = await axios.post(`/report-flags/${reportId}`, {
      reason: reasonValue,
    });

    if (response.data.hidden) {
      window.location.href = "/search?reportHidden=true";
      return;
    }

    window.location.reload();
  } catch (error) {
    displayFlagErrorMessage(error, message, "Could not flag report");
  }
};

if (flagButton) {
  flagButton.addEventListener("click", flagReport);
}
