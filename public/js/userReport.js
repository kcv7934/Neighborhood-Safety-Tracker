const form = document.getElementById("user-report-form");
const message = document.getElementById("form-message");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    message.hidden = true;
    message.textContent = "";

    const category = document.getElementById("category").value.trim();
    const address = document.getElementById("address").value.trim();
    const borough = document.getElementById("borough").value.trim();
    const description = document.getElementById("description").value.trim();

    try {
      if (!category) throw "You must select a category";
      if (!address) throw "Address must be provided";
      if (address.length > 50)
        throw "Address cannot be more than 50 characters";
      if (!borough) throw "You must select a borough";
      if (description.length < 10)
        throw "Description must be at least 10 characters";
      if (description.length > 500)
        throw "Description cannot be more than 500 characters";

      // axios POST request

      // TODO: using test authorId from seed.js until user authentication is implemented
      const userReportData = {
        authorId: "687000000000000000000001",
        category,
        address,
        borough,
        description,
      };

      const response = await axios.post("/user-reports", userReportData);

      message.textContent = "Report created successfully";
      message.hidden = false;

      form.reset();

      console.log(response.data);
    } catch (e) {
      if (e.response?.data?.error) {
        message.textContent = e.response.data.error;
      } else if (typeof e === "string") {
        message.textContent = e;
      } else {
        console.error(e);
        message.textContent = "Could not create user report";
      }
      message.hidden = false;
    }
  });
}
