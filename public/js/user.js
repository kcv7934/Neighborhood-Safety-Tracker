const form = document.getElementById('page-form');
const errorMessage = document.getElementById('form-message');

if (form && errorMessage) {
    if (form.className === 'login') {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.textContent = '';
            errorMessage.hidden = true;

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!username) {
                errorMessage.textContent = 'Username is required.';
                errorMessage.hidden = false;
            }else if (!password) {
                errorMessage.textContent = 'Password is required.';
                errorMessage.hidden = false;
            }

            if (username && password && errorMessage.hidden) {
                form.submit();
            }
        });
    }else if (form.className === 'register') {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            errorMessage.textContent = '';
            errorMessage.hidden = true;

            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();
            const email = document.getElementById('email').value.trim();
            const age = document.getElementById('age').value.trim();
            const state = document.getElementById('state').value.trim();
            const city = document.getElementById('city').value.trim();

            const inputFields = [firstName, lastName, username, password, confirmPassword, email, age, state, city];
            const inputFieldNames = ['First Name', 'Last Name', 'Username', 'Password', 'Confirm Password', 'Email', 'Age', 'State', 'City'];

            for (let i = 0; i < inputFields.length; i++) {
                if (!inputFields[i]) {
                    errorMessage.textContent = `${inputFieldNames[i]} is required.`;
                    errorMessage.hidden = false;
                }
            }

            if (!/^[a-zA-Z]+$/.test(firstName)) {
                errorMessage.textContent = 'First name must contain only letters.';
                errorMessage.hidden = false;
            }else if (!/^[a-zA-Z]+$/.test(lastName)) {
                errorMessage.textContent = 'Last name must contain only letters.';
                errorMessage.hidden = false;
            }else if (username.includes(' ')) {
                errorMessage.textContent = 'Username cannot contain spaces.';
                errorMessage.hidden = false;
            }else if (password < 8) {
                errorMessage.textContent = 'Password must be at least 8 characters long.';
                errorMessage.hidden = false;
            }else if (password.includes(' ')) {
                errorMessage.textContent = 'Password cannot contain spaces.';
                errorMessage.hidden = false;
            }else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                errorMessage.textContent = 'Password must contain at least one special character.';
                errorMessage.hidden = false;
            }else if (!/[0-9]/.test(password)) {
                errorMessage.textContent = 'Password must contain at least one number.';
                errorMessage.hidden = false;
            }else if (!/[A-Z]/.test(password)) {
                errorMessage.textContent = 'Password must contain at least one uppercase letter.';
                errorMessage.hidden = false;
            }else if (password !== confirmPassword) {
                errorMessage.textContent = 'Passwords do not match.';
                errorMessage.hidden = false;
            }else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                errorMessage.textContent = 'Invalid email format.';
                errorMessage.hidden = false;
            }else if (isNaN(age) || age < 0 || age > 120) {
                errorMessage.textContent = 'Age must be a number between 0 and 120.';
                errorMessage.hidden = false;
            }else if (state.length !== 2 || !/^[A-Z]{2}$/.test(state)) {
                errorMessage.textContent = 'State must be a valid 2-letter abbreviation.';
                errorMessage.hidden = false;
            }else if (!/^[a-zA-Z ]+$/.test(city)) {
                errorMessage.textContent = 'City must contain only letters and spaces.';
                errorMessage.hidden = false;
            }

            if (errorMessage.hidden) {
                form.submit();
            }
        });
    }
}