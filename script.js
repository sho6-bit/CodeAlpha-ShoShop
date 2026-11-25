const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const authMessage = document.getElementById("auth-message");

let authMessageKey = "";

function showAuthMessage(key) {
    authMessageKey = key;
    authMessage.textContent = window.ShopI18n.t(key);
    authMessage.hidden = false;
}

async function submitAuthForm(event, mode) {
    event.preventDefault();
    authMessage.hidden = true;

    const form = event.currentTarget;
    if (!form.reportValidity()) {
        return;
    }

    const formData = new FormData(form);
    const payload = {
        email: String(formData.get("email")).trim(),
        password: String(formData.get("password"))
    };
    if (mode === "signup") {
        payload.name = String(formData.get("name")).trim();
        payload.phone = String(formData.get("phone")).trim();
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
        const response = await fetch(`/api/auth/${mode === "signup" ? "register" : "login"}`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) {
            if (mode === "login" && response.status === 401) {
                showAuthMessage("auth.login.invalid");
            } else if (mode === "signup" && response.status === 409) {
                showAuthMessage("auth.signup.exists");
            } else if (mode === "signup" && result.error && result.error.includes("Password")) {
                showAuthMessage("auth.signup.password");
            } else if (mode === "signup" && response.status === 400) {
                showAuthMessage("auth.signup.invalid");
            } else {
                showAuthMessage("auth.error");
            }
            return;
        }

        window.location.assign("index.html");
    } catch (error) {
        console.error("Could not submit the account form.", error);
        showAuthMessage("auth.error");
    } finally {
        submitButton.disabled = false;
    }
}

if (loginForm) {
    loginForm.addEventListener("submit", event => submitAuthForm(event, "login"));
}

if (signupForm) {
    signupForm.addEventListener("submit", event => submitAuthForm(event, "signup"));
}

document.addEventListener("shop:languagechange", () => {
    if (authMessageKey && !authMessage.hidden) {
        authMessage.textContent = window.ShopI18n.t(authMessageKey);
    }
});
