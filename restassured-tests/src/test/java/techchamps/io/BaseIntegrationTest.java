package techchamps.io;

import io.restassured.http.ContentType;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import techchamps.io.dto.request.LoginRequest;

import static io.restassured.RestAssured.given;

/**
 * Abstract base class for all RestAssured integration tests.
 * <p>
 * Centralises the {@code @SpringBootTest} configuration and the
 * {@code @LocalServerPort} field so that individual IT classes
 * do not need to repeat this boilerplate.
 * <p>
 * Provides JWT token helpers: {@link #fetchToken}, {@link #userToken},
 * {@link #moderatorToken}, and {@link #adminToken}.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class BaseIntegrationTest {

    @LocalServerPort
    protected int port;

    protected String fetchToken(String username, String password) {
        return given()
            .port(port)
            .contentType(ContentType.JSON)
            .body(new LoginRequest(username, password))
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract()
            .path("token");
    }

    protected String userToken() {
        return fetchToken("user", "user1234");
    }

    protected String moderatorToken() {
        return fetchToken("moderator", "moderator1234");
    }

    protected String adminToken() {
        return fetchToken("admin", "admin1234");
    }
}
