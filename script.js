
const loginSection = document.getElementById("login-section");
const signupSection = document.getElementById("signup-section");
const leftIllustration = document.getElementById("left-illustration");
const rightIllustration = document.getElementById("right-illustration");
const showSignup = document.getElementById("show-signup");
const showLogin = document.getElementById("show-login");

if (
    loginSection &&
    signupSection &&
    leftIllustration &&
    rightIllustration &&
    showSignup &&
    showLogin
) {
    showSignup.addEventListener("click", function(event) {
        event.preventDefault();

        loginSection.hidden = true;
        signupSection.hidden = false;
        leftIllustration.hidden = true;
        rightIllustration.hidden = true;
    });

    showLogin.addEventListener("click", function(event) {
        event.preventDefault();

        signupSection.hidden = true;
        loginSection.hidden = false;
        leftIllustration.hidden = false;
        rightIllustration.hidden = false;
    });
}
