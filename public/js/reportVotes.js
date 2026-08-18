const upvoteButton = document.getElementById("upvote-report-button");
const downvoteButton = document.getElementById("downvote-report-button");
const currentVote = document.getElementById("current-report-vote");

const displayVoteErrorMessage = (error, messageElement) => {
  if (error.response && error.response.data && error.response.data.error) {
    messageElement.textContent = error.response.data.error;
  } else {
    console.error(error);
    messageElement.textContent = "Could not vote on report";
  }

  messageElement.hidden = false;
};

const updateVoteButtons = (type) => {
  upvoteButton.disabled = false;
  downvoteButton.disabled = false;

  if (type === "upvote") {
    upvoteButton.disabled = true;
  } else {
    downvoteButton.disabled = true;
  }
};

const voteOnUserReport = async (event) => {
  const button = event.currentTarget;
  const reportId = button.value;

  const type = button.id === "upvote-report-button" ? "upvote" : "downvote";

  const message = document.getElementById("report-vote-message");

  message.hidden = true;
  message.textContent = "";

  try {
    const response = await axios.post(`/report-votes/${reportId}`, {
      type,
    });

    const upvoteCount = document.getElementById("upvote-count");
    const downvoteCount = document.getElementById("downvote-count");

    upvoteCount.textContent = response.data.voteCounts.upvotes;
    downvoteCount.textContent = response.data.voteCounts.downvotes;

    updateVoteButtons(type);
  } catch (error) {
    displayVoteErrorMessage(error, message);
  }
};

if (currentVote) {
  updateVoteButtons(currentVote.value);
}

if (upvoteButton) {
  upvoteButton.addEventListener("click", voteOnUserReport);
}

if (downvoteButton) {
  downvoteButton.addEventListener("click", voteOnUserReport);
}
