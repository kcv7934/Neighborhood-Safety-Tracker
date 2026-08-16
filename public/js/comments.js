const commentForm = document.getElementById("comment-form");
const editButtons = document.querySelectorAll(".edit-comment-button");
const deleteButtons = document.querySelectorAll(".delete-comment-button");

const validateCommentText = (text) => {
  text = text.trim();

  if (!text) throw "Comment cannot be empty";

  if (text.length > 500) throw "Comment cannot be more than 500 characters";

  return text;
};

const getCommentFormData = (form) => {
  const reportId = form.elements.reportId.value;
  const text = validateCommentText(form.elements.text.value);

  return { reportId, text };
};

const displayCommentErrorMessage = (error, messageElement, providedMessage) => {
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

const createComment = async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const message = document.getElementById("comment-form-message");

  message.hidden = true;
  message.textContent = "";

  try {
    const commentData = getCommentFormData(form);

    await axios.post("/comments", commentData);

    window.location.reload();
  } catch (error) {
    displayCommentErrorMessage(error, message, "Could not create comment");
  }
};

const editComment = async (event) => {
  const button = event.currentTarget;
  const commentId = button.value;

  const commentText = document.getElementById(`comment-text-${commentId}`);

  const newText = window.prompt("Edit your comment:", commentText.textContent);

  if (newText === null) return;

  const message = document.getElementById("comment-form-message");

  message.hidden = true;
  message.textContent = "";

  try {
    const text = validateCommentText(newText);

    await axios.patch(`/comments/${commentId}`, {
      text,
    });

    window.location.reload();
  } catch (error) {
    displayCommentErrorMessage(error, message, "Could not update comment");
  }
};

const deleteComment = async (event) => {
  const button = event.currentTarget;

  const confirmed = window.confirm(
    "Are you sure you want to delete this comment?",
  );

  if (!confirmed) return;

  const commentId = button.value;
  const message = document.getElementById("comment-form-message");

  message.hidden = true;
  message.textContent = "";

  try {
    await axios.delete(`/comments/${commentId}`);

    window.location.reload();
  } catch (error) {
    displayCommentErrorMessage(error, message, "Could not delete comment");
  }
};

if (commentForm) {
  commentForm.addEventListener("submit", createComment);
}

editButtons.forEach((button) => {
  button.addEventListener("click", editComment);
});

deleteButtons.forEach((button) => {
  button.addEventListener("click", deleteComment);
});