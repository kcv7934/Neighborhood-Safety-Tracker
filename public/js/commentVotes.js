const upvoteCommentButtons = document.querySelectorAll(
  ".upvote-comment-button",
);
const downvoteCommentButtons = document.querySelectorAll(
  ".downvote-comment-button",
);

const displayCommentVoteErrorMessage = (error, messageElement) => {
  if (error.response && error.response.data && error.response.data.error) {
    messageElement.textContent = error.response.data.error;
  } else {
    console.error(error);
    messageElement.textContent = "Could not vote on comment";
  }

  messageElement.hidden = false;
};

const updateCommentVoteButtons = (commentId, type) => {
  const upvoteButton = document.getElementById(
    `upvote-comment-button-${commentId}`,
  );

  const downvoteButton = document.getElementById(
    `downvote-comment-button-${commentId}`,
  );

  upvoteButton.disabled = false;
  downvoteButton.disabled = false;

  if (type === "upvote") {
    upvoteButton.disabled = true;
  } else if (type === "downvote") {
    downvoteButton.disabled = true;
  }
};

const voteOnComment = async (event) => {
  const button = event.currentTarget;
  const commentId = button.value;

  const type = button.classList.contains("upvote-comment-button")
    ? "upvote"
    : "downvote";

  const message = document.getElementById(`comment-vote-message-${commentId}`);

  message.hidden = true;
  message.textContent = "";

  try {
    const response = await axios.post(`/comment-votes/${commentId}`, {
      type,
    });

    const upvoteCount = document.getElementById(
      `comment-upvote-count-${commentId}`,
    );

    const downvoteCount = document.getElementById(
      `comment-downvote-count-${commentId}`,
    );

    upvoteCount.textContent = response.data.voteCounts.upvotes;

    downvoteCount.textContent = response.data.voteCounts.downvotes;

    updateCommentVoteButtons(commentId, type);
  } catch (error) {
    displayCommentVoteErrorMessage(error, message);
  }
};

for (const button of upvoteCommentButtons) {
  const commentId = button.value;

  const currentVote = document.getElementById(
    `current-comment-vote-${commentId}`,
  );

  if (currentVote) {
    updateCommentVoteButtons(commentId, currentVote.value);
  }

  button.addEventListener("click", voteOnComment);
}

for (const button of downvoteCommentButtons) {
  button.addEventListener("click", voteOnComment);
}