package techchamps.io.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import techchamps.io.config.CorsConfig;
import techchamps.io.config.SecurityConfig;
import techchamps.io.dto.request.LoginRequest;
import techchamps.io.dto.request.RegisterRequest;
import techchamps.io.model.AppUser;
import techchamps.io.model.Role;
import techchamps.io.repository.AppUserRepository;
import techchamps.io.security.JwtAuthenticationFilter;
import techchamps.io.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, CorsConfig.class, AuthControllerTest.TestSecurityConfig.class})
class AuthControllerTest {

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        UserDetailsService userDetailsService() {
            return username -> {
                throw new UsernameNotFoundException("No users in test context");
            };
        }

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter(UserDetailsService userDetailsService) {
            return new JwtAuthenticationFilter("test-secret-key-that-is-at-least-32-bytes-long!", userDetailsService);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthenticationManager authenticationManager;

    @MockBean
    private AppUserRepository appUserRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtService jwtService;

    private void mockSuccessfulAuth(String username) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(appUserRepository.findByUsername(username))
                .thenReturn(Optional.of(new AppUser(username, "encoded", Role.USER)));
        when(jwtService.generateToken(any(AppUser.class))).thenReturn("mocked-jwt-token");
    }

    @Test
    void login_withValidCredentials_returns200AndSuccess() throws Exception {
        mockSuccessfulAuth("user");

        LoginRequest request = new LoginRequest("user", "user1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.username").value("user"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.token").value("mocked-jwt-token"));
    }

    @Test
    void login_withInvalidCredentials_returns401AndFailure() throws Exception {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        LoginRequest request = new LoginRequest("user", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid credentials"))
                .andExpect(jsonPath("$.username").isEmpty())
                .andExpect(jsonPath("$.token").isEmpty());
    }

    @Test
    void login_withUnknownUsername_returns401() throws Exception {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("User not found"));

        LoginRequest request = new LoginRequest("nobody", "pass");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void login_withEmptyCredentials_callsAuthManagerAndReturns401() throws Exception {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        LoginRequest request = new LoginRequest("", "");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_withValidCredentials_returnsJsonContentType() throws Exception {
        mockSuccessfulAuth("user");

        LoginRequest request = new LoginRequest("user", "user1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username").value("user"));
    }

    @Test
    void login_withValidCredentials_returnsRoleInResponse() throws Exception {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken("admin", null, Collections.emptyList());
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(appUserRepository.findByUsername("admin"))
                .thenReturn(Optional.of(new AppUser("admin", "encoded", Role.ADMIN)));
        when(jwtService.generateToken(any(AppUser.class))).thenReturn("admin-jwt-token");

        LoginRequest request = new LoginRequest("admin", "admin1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void register_withValidRequest_returns200AndSuccess() throws Exception {
        when(appUserRepository.existsByEmail(anyString())).thenReturn(false);
        when(appUserRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");

        AppUser savedUser = new AppUser("new@example.com", "newuser", "hashedPassword", Role.USER);
        when(appUserRepository.save(any(AppUser.class))).thenReturn(savedUser);

        RegisterRequest request = new RegisterRequest("new@example.com", "newuser", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Registration successful"))
                .andExpect(jsonPath("$.email").value("new@example.com"))
                .andExpect(jsonPath("$.username").value("newuser"));
    }

    @Test
    void register_returnsIdFromSavedUser() throws Exception {
        when(appUserRepository.existsByEmail(anyString())).thenReturn(false);
        when(appUserRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");

        AppUser savedUser = new AppUser("new@example.com", "newuser", "hashedPassword", Role.USER);
        java.lang.reflect.Field idField = AppUser.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(savedUser, 42L);
        when(appUserRepository.save(any(AppUser.class))).thenReturn(savedUser);

        RegisterRequest request = new RegisterRequest("new@example.com", "newuser", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42));
    }

    @Test
    void register_withDuplicateEmail_returns409() throws Exception {
        when(appUserRepository.existsByEmail("taken@example.com")).thenReturn(true);

        RegisterRequest request = new RegisterRequest("taken@example.com", "newuser", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Email address is already in use"));
    }

    @Test
    void register_withDuplicateUsername_returns409() throws Exception {
        when(appUserRepository.existsByEmail(anyString())).thenReturn(false);
        when(appUserRepository.existsByUsername("takenuser")).thenReturn(true);

        RegisterRequest request = new RegisterRequest("new@example.com", "takenuser", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Username is already in use"));
    }

    @Test
    void register_withInvalidEmail_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest("not-an-email", "newuser", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_withShortPassword_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest("new@example.com", "newuser", "short");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_verifiesPasswordPassedToAuthManager() throws Exception {
        mockSuccessfulAuth("user");

        LoginRequest request = new LoginRequest("user", "secretpass");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        ArgumentCaptor<UsernamePasswordAuthenticationToken> captor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(captor.capture());
        assertThat(captor.getValue().getCredentials()).isEqualTo("secretpass");
    }

    @Test
    void register_withBlankUsername_returns400() throws Exception {
        RegisterRequest request = new RegisterRequest("new@example.com", "", "password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
