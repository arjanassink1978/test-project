package techchamps.io.builder;

import techchamps.io.dto.request.LoginRequest;

public class LoginRequestBuilder {

    private String username = "user";
    private String password = "user1234";

    public LoginRequestBuilder username(String username) {
        this.username = username;
        return this;
    }

    public LoginRequestBuilder password(String password) {
        this.password = password;
        return this;
    }

    public LoginRequest build() {
        return new LoginRequest(username, password);
    }
}
