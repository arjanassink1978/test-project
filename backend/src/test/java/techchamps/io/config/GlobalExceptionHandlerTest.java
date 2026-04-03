package techchamps.io.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // ============================================================
    // handleValidationException
    // ============================================================

    @Test
    void handleValidationException_returnsBadRequest() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "target");
        bindingResult.addError(new FieldError("target", "title", "Title is required"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<Map<String, String>> response = handler.handleValidationException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("title", "Title is required");
    }

    @Test
    void handleValidationException_multipleErrors_returnsAll() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "target");
        bindingResult.addError(new FieldError("target", "title", "Title is required"));
        bindingResult.addError(new FieldError("target", "content", "Content is required"));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<Map<String, String>> response = handler.handleValidationException(ex);

        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody()).containsEntry("title", "Title is required");
        assertThat(response.getBody()).containsEntry("content", "Content is required");
    }

    // ============================================================
    // handleResponseStatusException
    // ============================================================

    @Test
    void handleResponseStatusException_notFound_returns404() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND, "Thread not found");

        ResponseEntity<Map<String, String>> response = handler.handleResponseStatusException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).containsEntry("message", "Thread not found");
    }

    @Test
    void handleResponseStatusException_badRequest_returns400() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid input");

        ResponseEntity<Map<String, String>> response = handler.handleResponseStatusException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).containsEntry("message", "Invalid input");
    }

    @Test
    void handleResponseStatusException_forbidden_returns403() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");

        ResponseEntity<Map<String, String>> response = handler.handleResponseStatusException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody()).containsEntry("message", "Access denied");
    }

    @Test
    void handleResponseStatusException_nullReason_usesMessage() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR);

        ResponseEntity<Map<String, String>> response = handler.handleResponseStatusException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().get("message")).isNotNull();
    }
}
