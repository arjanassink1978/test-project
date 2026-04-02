package techchamps.io.controller;

import techchamps.io.dto.request.LoginRequest;
import techchamps.io.dto.request.RegisterRequest;
import techchamps.io.dto.response.LoginResponse;
import techchamps.io.dto.response.RegisterResponse;
import techchamps.io.model.AppUser;
import techchamps.io.repository.AppUserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user authentication and registration")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager,
                          AppUserRepository appUserRepository,
                          PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate a user with username and password")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Login successful",
            content = @Content(schema = @Schema(implementation = LoginResponse.class))),
        @ApiResponse(responseCode = "401", description = "Invalid credentials",
            content = @Content(schema = @Schema(implementation = LoginResponse.class)))
    })
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsername(),
                    loginRequest.getPassword()
                )
            );

            return ResponseEntity.ok(new LoginResponse(true, "Login successful", loginRequest.getUsername()));

        } catch (BadCredentialsException e) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new LoginResponse(false, "Invalid credentials"));
        }
    }

    /**
     * Register a new user account.
     * Validates input, checks for duplicate email/username, hashes the password, and persists the user.
     *
     * @param registerRequest the registration payload with email, username, and password
     * @return 200 with RegisterResponse on success, 409 on duplicate email/username
     */
    @PostMapping("/register")
    @Operation(summary = "Register", description = "Create a new user account with email, username, and password")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Registration successful",
            content = @Content(schema = @Schema(implementation = RegisterResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error — invalid email, short password, etc.",
            content = @Content(schema = @Schema(implementation = RegisterResponse.class))),
        @ApiResponse(responseCode = "409", description = "Conflict — email or username already in use",
            content = @Content(schema = @Schema(implementation = RegisterResponse.class)))
    })
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        if (appUserRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new RegisterResponse(null, registerRequest.getEmail(), registerRequest.getUsername(),
                    false, "Email address is already in use"));
        }

        if (appUserRepository.existsByUsername(registerRequest.getUsername())) {
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new RegisterResponse(null, registerRequest.getEmail(), registerRequest.getUsername(),
                    false, "Username is already in use"));
        }

        AppUser newUser = new AppUser(
            registerRequest.getEmail(),
            registerRequest.getUsername(),
            passwordEncoder.encode(registerRequest.getPassword()),
            "USER"
        );

        AppUser savedUser = appUserRepository.save(newUser);

        return ResponseEntity.ok(new RegisterResponse(
            savedUser.getId(),
            savedUser.getEmail(),
            savedUser.getUsername(),
            true,
            "Registration successful"
        ));
    }
}
