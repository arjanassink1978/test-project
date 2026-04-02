package techchamps.io.builder;

import techchamps.io.dto.request.RegisterRequest;

public class RegisterRequestBuilder {

    private String email = "newuser@example.com";
    private String username = "newuser";
    private String password = "securePass123";

    public RegisterRequestBuilder email(String email) {
        this.email = email;
        return this;
    }

    public RegisterRequestBuilder username(String username) {
        this.username = username;
        return this;
    }

    public RegisterRequestBuilder password(String password) {
        this.password = password;
        return this;
    }

    public RegisterRequest build() {
        return new RegisterRequest(email, username, password);
    }
}
