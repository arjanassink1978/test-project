package techchamps.io;

import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.junit.jupiter.SpringExtension;

/**
 * Abstract base class for all RestAssured integration tests.
 * <p>
 * Centralises the {@code @SpringBootTest} configuration and the
 * {@code @LocalServerPort} field so that individual IT classes
 * do not need to repeat this boilerplate.
 */
@ExtendWith(SpringExtension.class)
@SpringBootTest(
        classes = techchamps.io.BackendApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
public abstract class BaseIntegrationTest {

    @LocalServerPort
    protected int port;
}
