package techchamps.io.controller;

import techchamps.io.config.CorsConfig;
import techchamps.io.config.SecurityConfig;
import techchamps.io.dto.response.UserSummaryResponse;
import techchamps.io.security.JwtAuthenticationFilter;
import techchamps.io.service.ForumService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, CorsConfig.class, UserControllerTest.TestSecurityConfig.class})
class UserControllerTest {

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

    @MockBean
    private ForumService forumService;

    @Test
    @WithMockUser(username = "admin")
    void listUsers_asAdmin_returns200WithUserList() throws Exception {
        List<UserSummaryResponse> users = List.of(
                new UserSummaryResponse(1L, "user", "user@example.com", "USER"),
                new UserSummaryResponse(2L, "moderator", "moderator@example.com", "MODERATOR"),
                new UserSummaryResponse(3L, "admin", "admin@example.com", "ADMIN")
        );
        when(forumService.listUsers("admin")).thenReturn(users);

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].username").value("user"))
                .andExpect(jsonPath("$[0].role").value("USER"))
                .andExpect(jsonPath("$[2].role").value("ADMIN"));
    }

    @Test
    @WithMockUser(username = "user")
    void listUsers_asRegularUser_returns403() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Requires ADMIN role"))
                .when(forumService).listUsers("user");

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    void listUsers_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }
}
